// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {LaunchToken} from "./LaunchToken.sol";
import {NameRegistry} from "./NameRegistry.sol";
import {TimelockedLpVault} from "./TimelockedLpVault.sol";
import {IVvsFactory} from "./interfaces/IVvsFactory.sol";
import {IVvsRouter} from "./interfaces/IVvsRouter.sol";

contract LaunchpadFactory is Ownable, ReentrancyGuard {
    error InvalidGraduationTarget();
    error InvalidSupply();
    error InvalidAddress();
    error InvalidLpLockDuration();
    error AntiBotLimitExceeded(uint256 attempted, uint256 limit);
    error LaunchNotFound(address token);
    error AlreadyGraduated(address token);
    error GraduationTargetNotMet(uint256 reserveRaised, uint256 target);
    error TransferFailed();
    error PairNotFound();

    struct LaunchConfig {
        bytes32 normalizedNameHash;
        bytes32 normalizedSymbolHash;
        uint256 totalSupply;
        uint256 graduationTargetWei;
        uint256 antiBotBaseLimitWei;
        uint64 antiBotEndsAt;
        bool antiBotEnabled;
        address creator;
        address vvsRouter;
        address lpBeneficiary;
        uint64 lpLockDurationSeconds;
    }

    struct LaunchState {
        uint256 reserveRaisedWei;
        bool graduated;
        address pair;
        address lpVault;
        uint256 liquidity;
        uint256 lpUnlocksAt;
    }

    NameRegistry public immutable nameRegistry;
    TimelockedLpVault public immutable lpVault;
    mapping(address => LaunchConfig) public launchConfigByToken;
    mapping(address => LaunchState) public launchStateByToken;
    mapping(address => mapping(address => uint64)) public lastBuyAtByTokenByWallet;

    event TokenCreated(
        address indexed token,
        address indexed creator,
        string name,
        string symbol,
        bytes32 indexed normalizedNameHash,
        bytes32 normalizedSymbolHash,
        uint256 totalSupply,
        uint256 graduationTargetWei,
        bool antiBotEnabled,
        address vvsRouter,
        address lpBeneficiary,
        uint64 lpLockDurationSeconds
    );

    event TokenBought(address indexed token, address indexed buyer, uint256 croIn, uint256 reserveRaisedWei);
    event TokenGraduated(
        address indexed token,
        address indexed creator,
        address indexed vvsRouter,
        address pair,
        address lpVault,
        uint256 reserveRaisedWei,
        uint256 tokenLiquidity,
        uint256 liquidity,
        uint256 lpUnlocksAt
    );

    constructor(NameRegistry nameRegistry_, TimelockedLpVault lpVault_, address owner_) Ownable(owner_) {
        if (address(nameRegistry_) == address(0) || address(lpVault_) == address(0) || owner_ == address(0)) {
            revert InvalidAddress();
        }
        nameRegistry = nameRegistry_;
        lpVault = lpVault_;
    }

    function createToken(
        string calldata name,
        string calldata symbol,
        bytes32 normalizedNameHash,
        bytes32 normalizedSymbolHash,
        uint256 totalSupply,
        uint256 graduationTargetWei,
        bool antiBotEnabled,
        uint64 antiBotDurationSeconds,
        uint256 antiBotBaseLimitWei,
        address vvsRouter,
        address lpBeneficiary,
        uint64 lpLockDurationSeconds
    ) external payable nonReentrant returns (address token) {
        if (totalSupply == 0) revert InvalidSupply();
        if (graduationTargetWei == 0) revert InvalidGraduationTarget();
        if (vvsRouter == address(0) || lpBeneficiary == address(0)) revert InvalidAddress();
        if (lpLockDurationSeconds < 30 days) revert InvalidLpLockDuration();

        token = address(new LaunchToken(name, symbol, 18, totalSupply, address(this), msg.sender));
        nameRegistry.claimIdentity(token, normalizedNameHash, normalizedSymbolHash, name, symbol);

        launchConfigByToken[token] = LaunchConfig({
            normalizedNameHash: normalizedNameHash,
            normalizedSymbolHash: normalizedSymbolHash,
            totalSupply: totalSupply,
            graduationTargetWei: graduationTargetWei,
            antiBotBaseLimitWei: antiBotBaseLimitWei,
            antiBotEndsAt: antiBotEnabled ? uint64(block.timestamp) + antiBotDurationSeconds : 0,
            antiBotEnabled: antiBotEnabled,
            creator: msg.sender,
            vvsRouter: vvsRouter,
            lpBeneficiary: lpBeneficiary,
            lpLockDurationSeconds: lpLockDurationSeconds
        });

        emit TokenCreated(
            token,
            msg.sender,
            name,
            symbol,
            normalizedNameHash,
            normalizedSymbolHash,
            totalSupply,
            graduationTargetWei,
            antiBotEnabled,
            vvsRouter,
            lpBeneficiary,
            lpLockDurationSeconds
        );

        if (msg.value > 0) {
            _buy(token, msg.sender, msg.value);
        }
    }

    function buy(address token) external payable nonReentrant {
        _buy(token, msg.sender, msg.value);
    }

    function graduate(address token, uint256 minTokenAmount, uint256 minCroAmount, uint256 deadline) external nonReentrant {
        LaunchConfig memory config = launchConfigByToken[token];
        if (config.creator == address(0)) revert LaunchNotFound(token);
        LaunchState storage state = launchStateByToken[token];
        if (state.graduated) revert AlreadyGraduated(token);
        if (state.reserveRaisedWei < config.graduationTargetWei) {
            revert GraduationTargetNotMet(state.reserveRaisedWei, config.graduationTargetWei);
        }

        state.graduated = true;

        uint256 reserveToSeed = state.reserveRaisedWei;
        uint256 tokenLiquidity = IERC20(token).balanceOf(address(this));
        if (tokenLiquidity == 0) revert InvalidSupply();

        IVvsRouter router = IVvsRouter(config.vvsRouter);
        IERC20(token).approve(config.vvsRouter, tokenLiquidity);
        (uint256 amountToken, , uint256 liquidity) = router.addLiquidityETH{value: reserveToSeed}(
            token,
            tokenLiquidity,
            minTokenAmount,
            minCroAmount,
            address(this),
            deadline
        );

        address pair = IVvsFactory(router.factory()).getPair(token, router.WETH());
        if (pair == address(0) || liquidity == 0) revert PairNotFound();

        uint256 lpUnlocksAt = block.timestamp + config.lpLockDurationSeconds;
        IERC20(pair).approve(address(lpVault), liquidity);
        lpVault.deposit(pair, config.lpBeneficiary, liquidity, lpUnlocksAt);

        state.pair = pair;
        state.lpVault = address(lpVault);
        state.liquidity = liquidity;
        state.lpUnlocksAt = lpUnlocksAt;

        emit TokenGraduated(
            token,
            config.creator,
            config.vvsRouter,
            pair,
            address(lpVault),
            reserveToSeed,
            amountToken,
            liquidity,
            lpUnlocksAt
        );
    }

    function currentAntiBotLimit(address token) public view returns (uint256) {
        LaunchConfig memory config = launchConfigByToken[token];
        if (!config.antiBotEnabled || block.timestamp >= config.antiBotEndsAt) return type(uint256).max;
        uint256 remaining = config.antiBotEndsAt - block.timestamp;
        uint256 durationBucket = remaining > 480 ? 5 : remaining > 300 ? 15 : remaining > 0 ? 35 : 100;
        return (config.antiBotBaseLimitWei * durationBucket) / 100;
    }

    function _buy(address token, address buyer, uint256 croIn) internal {
        LaunchConfig memory config = launchConfigByToken[token];
        if (config.creator == address(0)) revert LaunchNotFound(token);
        if (croIn == 0) revert TransferFailed();

        uint256 limit = currentAntiBotLimit(token);
        if (croIn > limit) revert AntiBotLimitExceeded(croIn, limit);

        launchStateByToken[token].reserveRaisedWei += croIn;
        lastBuyAtByTokenByWallet[token][buyer] = uint64(block.timestamp);

        // MVP scaffold: pricing/token-out math comes next; reserve accounting + launch protection are in place now.
        emit TokenBought(token, buyer, croIn, launchStateByToken[token].reserveRaisedWei);
    }
}
