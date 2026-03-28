// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredAura
 * @notice MVP collateral vault aligned with backend `borrowerController` / ABI.
 *         Add Ownable / roles before mainnet — anyone can call release/liquidate here.
 */
contract CredAura {
    mapping(address => uint256) private _lockedWei;
    mapping(address => uint256) private _creditScore;

    event CollateralLocked(address indexed borrower, uint256 amount, string loanId);
    event CollateralReleased(address indexed borrower, string loanId);
    event CollateralLiquidated(address indexed borrower, string loanId);

    /// @notice Lock native MATIC/ETH as collateral for a loan id (msg.value).
    function lockCollateral(string calldata loanId) external payable {
        _lockedWei[msg.sender] += msg.value;
        emit CollateralLocked(msg.sender, msg.value, loanId);
    }

    /// @notice Release wei back to borrower (backend signer should be gated in production).
    function releaseCollateral(
        address borrower,
        string calldata loanId,
        uint256 amount
    ) external {
        require(_lockedWei[borrower] >= amount, "Insufficient collateral");
        _lockedWei[borrower] -= amount;
        (bool ok, ) = payable(borrower).call{value: amount}("");
        require(ok, "ETH transfer failed");
        emit CollateralReleased(borrower, loanId);
    }

    /// @notice Clear locked balance on liquidation (funds routing TBD for production).
    function liquidate(address borrower, string calldata loanId) external {
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
