// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {LaunchToken} from "./LaunchToken.sol";
import {NameRegistry} from "./NameRegistry.sol";

contract LaunchpadFactory is Ownable, ReentrancyGuard {
    error InvalidGraduationTarget();
    error InvalidSupply();
    error AntiBotLimitExceeded(uint256 attempted, uint256 limit);
    error LaunchNotFound(address token);
    error AlreadyGraduated(address token);
    error GraduationTargetNotMet(uint256 reserveRaised, uint256 target);
    error TransferFailed();

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
    }

    struct LaunchState {
        uint256 reserveRaisedWei;
        bool graduated;
    }

    NameRegistry public immutable nameRegistry;
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
        address vvsRouter
    );

    event TokenBought(address indexed token, address indexed buyer, uint256 croIn, uint256 reserveRaisedWei);
    event TokenGraduated(address indexed token, address indexed creator, address indexed vvsRouter, uint256 reserveRaisedWei);

    constructor(NameRegistry nameRegistry_, address owner_) Ownable(owner_) {
        nameRegistry = nameRegistry_;
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
        address vvsRouter
    ) external payable nonReentrant returns (address token) {
        if (totalSupply == 0) revert InvalidSupply();
        if (graduationTargetWei == 0) revert InvalidGraduationTarget();

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
            vvsRouter: vvsRouter
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
            vvsRouter
        );

        if (msg.value > 0) {
            _buy(token, msg.sender, msg.value);
        }
    }

    function buy(address token) external payable nonReentrant {
        _buy(token, msg.sender, msg.value);
    }

    function graduate(address token) external nonReentrant {
        LaunchConfig memory config = launchConfigByToken[token];
        if (config.creator == address(0)) revert LaunchNotFound(token);
        LaunchState storage state = launchStateByToken[token];
        if (state.graduated) revert AlreadyGraduated(token);
        if (state.reserveRaisedWei < config.graduationTargetWei) {
            revert GraduationTargetNotMet(state.reserveRaisedWei, config.graduationTargetWei);
        }

        state.graduated = true;

        // MVP scaffold: keep the VVS call behind an adapter in the next slice once router/factory addresses are confirmed.
        // The event records the intended router so the indexer/UI can prove the configured graduation path.
        emit TokenGraduated(token, config.creator, config.vvsRouter, state.reserveRaisedWei);
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
