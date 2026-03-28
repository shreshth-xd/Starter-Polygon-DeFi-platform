// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredAura
 * @notice Collateral vault: borrowers lock native gas token (MATIC on Polygon); only the
 *         deployer / owner may release or liquidate. Sync loanId string with backend draft.
 */
contract CredAura {
    address public owner;

    mapping(address => uint256) private _lockedWei;
    mapping(address => uint256) private _creditScore;

    event CollateralLocked(address indexed borrower, uint256 amount, string loanId);
    event CollateralReleased(address indexed borrower, string loanId, uint256 amount);
    event CollateralLiquidated(address indexed borrower, string loanId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event CreditScoreUpdated(address indexed wallet, uint256 score);

    error Unauthorized();
    error InvalidOwner();

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidOwner();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Backend may mirror off-chain scores for on-chain reads (owner only).
    function setCreditScore(address wallet, uint256 score) external onlyOwner {
        _creditScore[wallet] = score;
        emit CreditScoreUpdated(wallet, score);
    }

    /// @notice Lock native MATIC/ETH as collateral for a loan id (msg.value).
    function lockCollateral(string calldata loanId) external payable {
        _lockedWei[msg.sender] += msg.value;
        emit CollateralLocked(msg.sender, msg.value, loanId);
    }

    /// @notice Release wei back to borrower (only protocol owner / backend signer).
    function releaseCollateral(
        address borrower,
        string calldata loanId,
        uint256 amount
    ) external onlyOwner {
        require(_lockedWei[borrower] >= amount, "Insufficient collateral");
        _lockedWei[borrower] -= amount;
        (bool ok, ) = payable(borrower).call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit CollateralReleased(borrower, loanId, amount);
    }

    /// @notice Clear locked balance on liquidation.
    function liquidate(address borrower, string calldata loanId) external onlyOwner {
        _lockedWei[borrower] = 0;
        emit CollateralLiquidated(borrower, loanId);
    }

    function getLockedCollateral(address borrower) external view returns (uint256) {
        return _lockedWei[borrower];
    }

    function getCreditScore(address wallet) external view returns (uint256) {
        return _creditScore[wallet];
    }

    receive() external payable {}
}
