// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Minimal V2-shaped liquidity router for Cronos Testnet graduation smoke tests.
/// @dev This is not VVS production infrastructure. It intentionally exposes the same
/// addLiquidityETH/factory/getPair shape that LaunchpadFactory expects so testnet
/// launches can exercise the full graduation lifecycle until an official VVS testnet
/// V2 router or Smart Router/V3 adapter is integrated.
contract TestnetLpToken is ERC20 {
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract TestnetV2LiquidityFactory {
    mapping(address => mapping(address => address)) public getPair;

    event PairCreated(address indexed tokenA, address indexed tokenB, address pair);

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        pair = getPair[tokenA][tokenB];
        if (pair == address(0)) {
            TestnetLpToken lp = new TestnetLpToken("CronosForge Testnet LP", "CF-LP");
            pair = address(lp);
            getPair[tokenA][tokenB] = pair;
            getPair[tokenB][tokenA] = pair;
            emit PairCreated(tokenA, tokenB, pair);
        }
    }

    function ensurePair(address tokenA, address tokenB) external returns (address pair) {
        pair = this.createPair(tokenA, tokenB);
    }
}

contract TestnetV2LiquidityRouter {
    TestnetV2LiquidityFactory public immutable factoryContract;
    address public immutable WETH;

    event LiquidityAdded(
        address indexed token,
        address indexed pair,
        address indexed to,
        uint256 amountToken,
        uint256 amountETH,
        uint256 liquidity
    );

    constructor(address weth_) {
        require(weth_ != address(0), "INVALID_WETH");
        WETH = weth_;
        factoryContract = new TestnetV2LiquidityFactory();
    }

    function factory() external view returns (address) {
        return address(factoryContract);
    }

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        require(deadline >= block.timestamp, "DEADLINE_EXPIRED");
        require(msg.value >= amountETHMin, "INSUFFICIENT_ETH");
        require(amountTokenDesired >= amountTokenMin, "INSUFFICIENT_TOKEN");

        address pair = factoryContract.ensurePair(token, WETH);
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);

        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = amountToken < amountETH ? amountToken : amountETH;
        TestnetLpToken(pair).mint(to, liquidity);

        emit LiquidityAdded(token, pair, to, amountToken, amountETH, liquidity);
    }
}
