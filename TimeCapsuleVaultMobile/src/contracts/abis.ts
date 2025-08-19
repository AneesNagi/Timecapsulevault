export const TimeCapsuleVaultABI = [
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLockStatus',
    outputs: [
      { internalType: 'bool', name: 'locked', type: 'bool' },
      { internalType: 'uint256', name: 'currentPrice', type: 'uint256' },
      { internalType: 'uint256', name: 'timeRemaining', type: 'uint256' },
      { internalType: 'bool', name: 'isPriceBased', type: 'bool' },
      { internalType: 'bool', name: 'isGoalBased', type: 'bool' },
      { internalType: 'uint256', name: 'currentAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'goalAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'progressPercentage', type: 'uint256' },
      { internalType: 'string', name: 'unlockReason', type: 'string' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'unlockTime', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'targetPrice', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'creator', outputs: [{ internalType: 'address', name: '', type: 'address' }], stateMutability: 'view', type: 'function' },
] as const;

export const VaultFactoryABI = [
  {
    inputs: [
      { internalType: 'uint256', name: '_unlockTime', type: 'uint256' },
      { internalType: 'uint256', name: '_targetPrice', type: 'uint256' },
      { internalType: 'uint256', name: '_targetAmount', type: 'uint256' },
      { internalType: 'address', name: '_priceFeedAddress', type: 'address' },
    ],
    name: 'createVault',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
    name: 'getUserVaults',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const CHAINLINK_PRICE_FEED_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { internalType: 'uint80', name: 'roundId', type: 'uint80' },
      { internalType: 'int256', name: 'answer', type: 'int256' },
      { internalType: 'uint256', name: 'startedAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
      { internalType: 'uint80', name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;


