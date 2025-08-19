export interface Vault {
  id: string;
  address: string;
  name: string;
  balance: string;
  isLocked: boolean;
  isTimeLocked: boolean;
  isPriceLocked: boolean;
  isGoalLocked: boolean;
  unlockTime?: number;
  targetPrice?: number;
  goalAmount?: string;
  currentAmount?: string;
  progressPercentage?: number;
  currentPrice?: number;
  createdAt: number;
  network: string;
  emoji?: string;
  description?: string;
  category?: string;
  color?: string;
  tags?: string[];
}

export interface Wallet {
  id: string;
  address: string;
  privateKey: string;
  balance: string;
  network: string;
  name?: string;
  createdAt: number;
  lastActivity?: number;
  transactionCount?: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'send' | 'receive' | 'vault_create' | 'vault_deposit' | 'vault_withdraw';
  network: string;
}

export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpcUrl: string;
  currency: string;
  explorerUrl: string;
  isTestnet: boolean;
}

export interface VaultStats {
  totalVaults: number;
  totalValue: string;
  lockedValue: string;
  unlockedValue: string;
  activeGoals: number;
  completedGoals: number;
  avgLockDuration: number;
  successRate: number;
}

export interface WalletStats {
  totalWallets: number;
  totalBalance: string;
  activeWallets: number;
  totalTransactions: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  card: string;
  input: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
}

