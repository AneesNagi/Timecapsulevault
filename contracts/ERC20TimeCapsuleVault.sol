// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract ERC20TimeCapsuleVault {
    using SafeERC20 for IERC20;
    
    address public creator;
    uint256 public unlockTime;
    uint256 public targetPrice;
    uint256 public targetAmount;
    uint256 public immutable createdAt; // Contract creation timestamp for emergency withdrawal
    AggregatorV3Interface public priceFeed;
    IERC20 public token; // The ERC-20 token this vault holds
    bool public isPriceLock;
    bool public isGoalLock;
    
    // Reentrancy protection
    bool private locked;
    
    // Constants for validation
    uint256 public constant MAX_LOCK_DURATION = 10 * 365 days; // 10 years max
    uint256 public constant MIN_LOCK_DURATION = 1 hours; // 1 hour min
    uint256 public constant MAX_TARGET_AMOUNT = 10000 * 10**18; // 10,000 tokens max (assuming 18 decimals)
    uint256 public constant PRICE_DECIMALS = 8; // Chainlink price decimals
    uint256 public constant MAX_PRICE_CHANGE = 50; // 50% max price change per hour (circuit breaker)

    // For oracle circuit breaker
    int256 private lastValidPrice;
    uint256 private lastPriceUpdate;

    event PriceUpdated(int256 newPrice);
    event VaultUnlocked(string reason);
    event GoalProgress(uint256 currentAmount, uint256 targetAmount, uint256 progressPercentage);
    event Deposit(address indexed depositor, uint256 amount);
    event Withdrawal(address indexed creator, uint256 amount);
    event AutoWithdrawal(address indexed creator, uint256 amount, string reason);

    modifier noReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyCreator() {
        require(msg.sender == creator, "Not authorized");
        _;
    }

    modifier autoWithdrawIfUnlocked() {
        _;
        // After any state change, check if vault should auto-withdraw
        _checkAndExecuteAutoWithdraw();
    }

    constructor(
        uint256 _unlockTime, 
        address _owner, 
        uint256 _targetPrice, 
        uint256 _targetAmount, 
        address _priceFeedAddress,
        address _tokenAddress
    ) {
        // Input validation
        require(_owner != address(0), "Invalid owner address");
        require(_priceFeedAddress != address(0), "Invalid price feed address");
        require(_tokenAddress != address(0), "Invalid token address");
        
        // Time validation
        if (_unlockTime > 0) {
            require(_unlockTime > block.timestamp, "Unlock time must be in future");
            require(_unlockTime <= block.timestamp + MAX_LOCK_DURATION, "Lock duration too long");
            require(_unlockTime >= block.timestamp + MIN_LOCK_DURATION, "Lock duration too short");
        }
        
        // Amount validation
        if (_targetAmount > 0) {
            require(_targetAmount <= MAX_TARGET_AMOUNT, "Target amount too high");
            require(_targetAmount >= 1, "Target amount too low"); // At least 1 token
        }
        
        // Price validation (basic check - price should be positive)
        if (_targetPrice > 0) {
            require(_targetPrice > 0, "Target price must be positive");
        }
        
        creator = _owner;
        unlockTime = _unlockTime;
        targetPrice = _targetPrice;
        targetAmount = _targetAmount;
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        token = IERC20(_tokenAddress);
        isPriceLock = _targetPrice > 0;
        isGoalLock = _targetAmount > 0;
        
        // At least one lock condition must be set
        require(_unlockTime > 0 || _targetPrice > 0 || _targetAmount > 0, "At least one lock condition required");
        
        // Set contract creation timestamp for emergency withdrawal
        createdAt = block.timestamp;
    }

    function deposit(uint256 amount) external autoWithdrawIfUnlocked {
        require(amount > 0, "Deposit amount must be greater than 0");
        require(token.balanceOf(msg.sender) >= amount, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= amount, "Insufficient token allowance");
        
        // Transfer tokens from user to vault
        token.safeTransferFrom(msg.sender, address(this), amount);
        
        emit Deposit(msg.sender, amount);
    }

    function withdraw() external onlyCreator noReentrant {
        require(_isUnlocked(), "Vault is still locked");
        
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        // Transfer all tokens to creator
        token.safeTransfer(creator, balance);
        
        emit Withdrawal(creator, balance);
    }

    function emergencyWithdraw() external onlyCreator {
        require(block.timestamp >= createdAt + 30 days, "Emergency withdrawal not available yet");
        
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        
        // Transfer all tokens to creator
        token.safeTransfer(creator, balance);
        
        emit Withdrawal(creator, balance);
    }

    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function isUnlocked() external view returns (bool) {
        return _isUnlocked();
    }

    function _isUnlocked() internal view returns (bool) {
        // Time lock check
        if (unlockTime > 0 && block.timestamp >= unlockTime) {
            return true;
        }
        
        // Price lock check
        if (isPriceLock && targetPrice > 0) {
            try priceFeed.latestRoundData() returns (uint80, int256 price, uint256, uint256, uint80) {
                if (price > 0 && uint256(price) >= targetPrice) {
                    return true;
                }
            } catch {
                // If price feed fails, continue to other checks
            }
        }
        
        // Goal lock check
        if (isGoalLock && targetAmount > 0) {
            uint256 currentBalance = token.balanceOf(address(this));
            if (currentBalance >= targetAmount) {
                return true;
            }
        }
        
        return false;
    }

    function _checkAndExecuteAutoWithdraw() internal {
        if (_isUnlocked() && token.balanceOf(address(this)) > 0) {
            uint256 balance = token.balanceOf(address(this));
            token.safeTransfer(creator, balance);
            emit AutoWithdrawal(creator, balance, "Vault unlocked");
        }
    }

    function getCurrentPrice() external view returns (int256) {
        try priceFeed.latestRoundData() returns (uint80, int256 price, uint256, uint256, uint80) {
            return price;
        } catch {
            return 0;
        }
    }

    function getProgressPercentage() external view returns (uint256) {
        if (!isGoalLock || targetAmount == 0) {
            return 0;
        }
        
        uint256 currentBalance = token.balanceOf(address(this));
        return (currentBalance * 100) / targetAmount;
    }

    // Function to recover accidentally sent tokens (only creator)
    function recoverToken(address tokenAddress, uint256 amount) external onlyCreator {
        require(tokenAddress != address(token), "Cannot recover vault token");
        IERC20(tokenAddress).safeTransfer(creator, amount);
    }
} 