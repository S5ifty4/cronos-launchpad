// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice On-chain exact identity guard for launchpad-created tokens.
/// @dev Fuzzy/homoglyph checks are handled off-chain before submission; this contract enforces exact normalized hashes.
contract NameRegistry is Ownable {
    error NameAlreadyClaimed(bytes32 normalizedNameHash, address existingToken);
    error SymbolAlreadyClaimed(bytes32 normalizedSymbolHash, address existingToken);
    error ReservedName(bytes32 normalizedNameHash);
    error ReservedSymbol(bytes32 normalizedSymbolHash);
    error NotRegistrar(address caller);
    error ZeroAddress();

    event RegistrarSet(address indexed registrar, bool allowed);
    event NameReserved(bytes32 indexed normalizedNameHash, string label);
    event SymbolReserved(bytes32 indexed normalizedSymbolHash, string label);
    event TokenIdentityClaimed(
        address indexed token,
        bytes32 indexed normalizedNameHash,
        bytes32 indexed normalizedSymbolHash,
        string name,
        string symbol
    );

    mapping(bytes32 => address) public tokenByNameHash;
    mapping(bytes32 => address) public tokenBySymbolHash;
    mapping(bytes32 => bool) public reservedNameHash;
    mapping(bytes32 => bool) public reservedSymbolHash;
    mapping(address => bool) public registrars;

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyRegistrar() {
        if (!registrars[msg.sender]) revert NotRegistrar(msg.sender);
        _;
    }

    function setRegistrar(address registrar, bool allowed) external onlyOwner {
        if (registrar == address(0)) revert ZeroAddress();
        registrars[registrar] = allowed;
        emit RegistrarSet(registrar, allowed);
    }

    function reserveName(bytes32 normalizedNameHash, string calldata label) external onlyOwner {
        reservedNameHash[normalizedNameHash] = true;
        emit NameReserved(normalizedNameHash, label);
    }

    function reserveSymbol(bytes32 normalizedSymbolHash, string calldata label) external onlyOwner {
        reservedSymbolHash[normalizedSymbolHash] = true;
        emit SymbolReserved(normalizedSymbolHash, label);
    }

    function claimIdentity(
        address token,
        bytes32 normalizedNameHash,
        bytes32 normalizedSymbolHash,
        string calldata name,
        string calldata symbol
    ) external onlyRegistrar {
        if (token == address(0)) revert ZeroAddress();
        if (reservedNameHash[normalizedNameHash]) revert ReservedName(normalizedNameHash);
        if (reservedSymbolHash[normalizedSymbolHash]) revert ReservedSymbol(normalizedSymbolHash);

        address existingName = tokenByNameHash[normalizedNameHash];
        if (existingName != address(0)) revert NameAlreadyClaimed(normalizedNameHash, existingName);

        address existingSymbol = tokenBySymbolHash[normalizedSymbolHash];
        if (existingSymbol != address(0)) revert SymbolAlreadyClaimed(normalizedSymbolHash, existingSymbol);

        tokenByNameHash[normalizedNameHash] = token;
        tokenBySymbolHash[normalizedSymbolHash] = token;

        emit TokenIdentityClaimed(token, normalizedNameHash, normalizedSymbolHash, name, symbol);
    }
}
