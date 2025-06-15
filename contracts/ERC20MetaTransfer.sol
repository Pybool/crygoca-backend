// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function nonces(address owner) external view returns (uint256);
}

contract ERC20MetaTransfer {
    using ECDSA for bytes32;

    mapping(address => uint256) public erc20Nonces;
    mapping(address => uint256) public ethNonces;

    bytes32 public immutable DOMAIN_SEPARATOR_ERC20;
    bytes32 public immutable DOMAIN_SEPARATOR_ETH;

    bytes32 public constant META_TRANSFER_TYPEHASH = keccak256(
        "ERC20MetaTransfer(address token,address from,address to,uint256 amount,uint256 nonce,uint256 deadline)"
    );
    bytes32 public constant META_TRANSFER_ETH_TYPEHASH = keccak256(
        "ETHMetaTransfer(address from,address to,uint256 amount,uint256 nonce,uint256 deadline)"
    );

    event MetaTransferERC20(address indexed from, address indexed to, address indexed token, uint256 amount);
    event MetaTransferETH(address indexed from, address indexed to, uint256 amount);

    constructor() {
        DOMAIN_SEPARATOR_ERC20 = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("ERC20MetaTransfer"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        DOMAIN_SEPARATOR_ETH = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("ETHMetaTransfer"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );
    }

    function metaTransferERC20(
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "Expired signature");
        require(amount > 0, "Amount must be greater than zero");

        uint256 nonce = erc20Nonces[from];

        bytes32 structHash = keccak256(
            abi.encode(META_TRANSFER_TYPEHASH, token, from, to, amount, nonce, deadline)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR_ERC20, structHash));
        address signer = digest.recover(v, r, s);

        require(signer == from, "Invalid signature");

        erc20Nonces[from] = nonce + 1;

        require(IERC20(token).transferFrom(from, to, amount), "ERC20 transfer failed");

        emit MetaTransferERC20(from, to, token, amount);
    }

    function metaTransferETH(
        address from,
        address to,
        uint256 amount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(block.timestamp <= deadline, "Expired signature");
        require(amount > 0, "Amount must be greater than zero");

        uint256 nonce = ethNonces[from];

        bytes32 structHash = keccak256(
            abi.encode(META_TRANSFER_ETH_TYPEHASH, from, to, amount, nonce, deadline)
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR_ETH, structHash));
        address signer = digest.recover(v, r, s);

        require(signer == from, "Invalid signature");

        ethNonces[from] = nonce + 1;

        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");

        emit MetaTransferETH(from, to, amount);
    }

    receive() external payable {}
}
