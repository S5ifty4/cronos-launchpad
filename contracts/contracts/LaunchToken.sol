// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Fixed-supply launch token minted to its launch pool/factory.
contract LaunchToken is ERC20, Ownable {
    uint8 private immutable tokenDecimals;

    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 totalSupply_,
        address supplyRecipient_,
        address owner_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        tokenDecimals = decimals_;
        _mint(supplyRecipient_, totalSupply_);
    }

    function decimals() public view override returns (uint8) {
        return tokenDecimals;
    }
}
