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
    error InsufficientTokenOutput();
    error InsufficientCroOutput();
    error SellUnavailable(address token);
    error TokenTransferFailed();

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
        address wrappedNative;
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
        uint256 tokensSoldWei;
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
        address wrappedNative,
        address lpBeneficiary,
        uint64 lpLockDurationSeconds
    );

    event TokenBought(address indexed token, address indexed buyer, uint256 croIn, uint256 tokensOut, uint256 reserveRaisedWei);
    event TokenSold(address indexed token, address indexed seller, uint256 tokensIn, uint256 croOut, uint256 reserveRaisedWei);
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
        address wrappedNative,
        address lpBeneficiary,
        uint64 lpLockDurationSeconds
    ) external payable nonReentrant returns (address token) {
        if (totalSupply == 0) revert InvalidSupply();
        if (graduationTargetWei == 0) revert InvalidGraduationTarget();
        if (vvsRouter == address(0) || wrappedNative == address(0) || lpBeneficiary == address(0)) revert InvalidAddress();
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
            wrappedNative: wrappedNative,
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
            wrappedNative,
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

    function sell(address token, uint256 tokensIn, uint256 minCroOut) external nonReentrant {
        LaunchConfig memory config = launchConfigByToken[token];
        if (config.creator == address(0)) revert LaunchNotFound(token);
        LaunchState storage state = launchStateByToken[token];
        if (state.graduated) revert SellUnavailable(token);
        if (tokensIn == 0) revert TransferFailed();

        uint256 croOut = quoteSellCro(token, tokensIn);
        if (croOut < minCroOut) revert InsufficientCroOutput();
        if (croOut > state.reserveRaisedWei) revert InsufficientCroOutput();

        bool ok = IERC20(token).transferFrom(msg.sender, address(this), tokensIn);
        if (!ok) revert TokenTransferFailed();
        state.tokensSoldWei -= tokensIn;
        state.reserveRaisedWei -= croOut;

        (bool sent, ) = payable(msg.sender).call{value: croOut}("");
        if (!sent) revert TransferFailed();
        emit TokenSold(token, msg.sender, tokensIn, croOut, state.reserveRaisedWei);
    }

    function quoteBuyTokens(address token, uint256 croIn) public view returns (uint256) {
        LaunchConfig memory config = launchConfigByToken[token];
        if (config.creator == address(0) || croIn == 0) return 0;
        return (croIn * config.totalSupply) / (config.graduationTargetWei * 2);
    }

    function quoteSellCro(address token, uint256 tokensIn) public view returns (uint256) {
        LaunchConfig memory config = launchConfigByToken[token];
        if (config.creator == address(0) || tokensIn == 0) return 0;
        return (tokensIn * config.graduationTargetWei * 2) / config.totalSupply;
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
        address pairBeforeAdd = _tryPair(config.vvsRouter, token, config.wrappedNative);
        address lpRecipient = pairBeforeAdd == address(0) ? config.lpBeneficiary : address(this);
        IERC20(token).approve(config.vvsRouter, tokenLiquidity);
        (uint256 amountToken, , uint256 liquidity) = router.addLiquidityETH{value: reserveToSeed}(
            token,
            tokenLiquidity,
            minTokenAmount,
            minCroAmount,
            lpRecipient,
            deadline
        );

        if (liquidity == 0) revert PairNotFound();
        address pair = pairBeforeAdd == address(0) ? _tryPair(config.vvsRouter, token, config.wrappedNative) : pairBeforeAdd;
        uint256 lpUnlocksAt = 0;
        address lpVaultAddress = address(0);
        if (pair != address(0) && lpRecipient == address(this)) {
            lpUnlocksAt = block.timestamp + config.lpLockDurationSeconds;
            IERC20(pair).approve(address(lpVault), liquidity);
            lpVault.deposit(pair, config.lpBeneficiary, liquidity, lpUnlocksAt);
            lpVaultAddress = address(lpVault);
        }

        state.pair = pair;
        state.lpVault = lpVaultAddress;
        state.liquidity = liquidity;
        state.lpUnlocksAt = lpUnlocksAt;

        emit TokenGraduated(
            token,
            config.creator,
            config.vvsRouter,
            pair,
            lpVaultAddress,
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
        LaunchState storage state = launchStateByToken[token];
        if (state.graduated) revert AlreadyGraduated(token);
        if (croIn == 0) revert TransferFailed();

        uint256 limit = currentAntiBotLimit(token);
        if (croIn > limit) revert AntiBotLimitExceeded(croIn, limit);

        uint256 tokensOut = quoteBuyTokens(token, croIn);
        if (tokensOut == 0) revert InsufficientTokenOutput();
        if (IERC20(token).balanceOf(address(this)) < tokensOut) revert InsufficientTokenOutput();

        state.reserveRaisedWei += croIn;
        state.tokensSoldWei += tokensOut;
        lastBuyAtByTokenByWallet[token][buyer] = uint64(block.timestamp);

        bool ok = IERC20(token).transfer(buyer, tokensOut);
        if (!ok) revert TokenTransferFailed();
        emit TokenBought(token, buyer, croIn, tokensOut, state.reserveRaisedWei);
    }

    function _tryPair(address routerAddress, address token, address wrappedNative) internal view returns (address pair) {
        (bool factoryOk, bytes memory factoryData) = routerAddress.staticcall(abi.encodeWithSignature("factory()"));
        if (!factoryOk || factoryData.length < 32) return address(0);
        address factoryAddress = abi.decode(factoryData, (address));
        if (factoryAddress == address(0)) return address(0);
        (bool pairOk, bytes memory pairData) = factoryAddress.staticcall(abi.encodeWithSignature("getPair(address,address)", token, wrappedNative));
        if (!pairOk || pairData.length < 32) return address(0);
        pair = abi.decode(pairData, (address));
    }
}
