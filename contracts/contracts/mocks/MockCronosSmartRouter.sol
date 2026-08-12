// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {MockLpToken, MockVvsFactory} from "./MockVvsRouter.sol";

/// @notice Mimics the Cronos VVS Smart Router shape that has factory() + WCRO constant behavior but no WETH().
contract MockCronosSmartRouter {
    MockVvsFactory public immutable factoryContract;
    address public immutable WCRO;

    constructor(address wcro_) {
        WCRO = wcro_;
        factoryContract = new MockVvsFactory();
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

        address pair = factoryContract.ensurePair(token, WCRO);
        IERC20(token).transferFrom(msg.sender, address(this), amountTokenDesired);

        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = amountToken < amountETH ? amountToken : amountETH;
        MockLpToken(pair).mint(to, liquidity);
    }
}
