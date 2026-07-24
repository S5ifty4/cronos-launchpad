// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Simple public LP-token timelock for launch graduations.
/// @dev No emergency withdrawal by design; this is meant to be an inspectable trust primitive.
contract TimelockedLpVault is Ownable {
    error LockNotExpired(uint256 unlocksAt, uint256 nowTime);
    error ZeroAddress();
    error InvalidUnlockTime();

    event LpDeposited(address indexed lpToken, address indexed beneficiary, uint256 amount, uint256 unlocksAt);
    event LpWithdrawn(address indexed lpToken, address indexed beneficiary, uint256 amount);

    struct LockInfo {
        address beneficiary;
        uint256 amount;
        uint256 unlocksAt;
    }

    mapping(address lpToken => LockInfo lockInfo) public locks;

    constructor(address owner_) Ownable(owner_) {}

    function deposit(address lpToken, address beneficiary, uint256 amount, uint256 unlocksAt) external onlyOwner {
        if (lpToken == address(0) || beneficiary == address(0)) revert ZeroAddress();
        if (unlocksAt <= block.timestamp) revert InvalidUnlockTime();

        LockInfo storage info = locks[lpToken];
        if (info.beneficiary == address(0)) {
            info.beneficiary = beneficiary;
            info.unlocksAt = unlocksAt;
        } else {
            // A later deposit can only extend lock duration, never shorten it or change recipient.
            if (info.beneficiary != beneficiary) revert ZeroAddress();
            if (unlocksAt > info.unlocksAt) info.unlocksAt = unlocksAt;
        }

        info.amount += amount;
        IERC20(lpToken).transferFrom(msg.sender, address(this), amount);
        emit LpDeposited(lpToken, beneficiary, amount, info.unlocksAt);
    }

    function withdraw(address lpToken) external {
        LockInfo storage info = locks[lpToken];
        if (block.timestamp < info.unlocksAt) revert LockNotExpired(info.unlocksAt, block.timestamp);
        if (msg.sender != info.beneficiary) revert ZeroAddress();

        uint256 amount = info.amount;
        info.amount = 0;
        IERC20(lpToken).transfer(info.beneficiary, amount);
        emit LpWithdrawn(lpToken, info.beneficiary, amount);
    }
}
