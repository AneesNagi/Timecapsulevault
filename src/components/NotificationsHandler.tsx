import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';

interface WalletData {
  address: string;
  privateKey: string;
  network: string;
}

export const NotificationsHandler = () => {
  const [activeWallet, setActiveWallet] = useState<WalletData | null>(null);
  const toast = useToast();

  // Safe wrapper for toast to prevent errors
  const safeToast = useCallback((options: any) => {
    try {
      toast(options);
    } catch (error) {
      console.warn('Toast error:', error);
    }
  }, [toast]);

  // Load wallet from localStorage
  useEffect(() => {
    const loadWallet = () => {
      const savedWallets = localStorage.getItem('wallets');
      if (savedWallets) {
        const wallets = JSON.parse(savedWallets);
        if (wallets.length > 0) {
          setActiveWallet(wallets[0]);
        }
      }
    };

    loadWallet();

    // Listen for storage changes to update wallet info
    window.addEventListener('storage', loadWallet);
    return () => window.removeEventListener('storage', loadWallet);
  }, []);

  // Listen for wallet events
  useEffect(() => {
    if (!activeWallet) return;

    const address = activeWallet.address;

    // Listen for incoming transactions
    const handleIncomingTransaction = (event: any) => {
      if (event.detail.to === address) {
        safeToast({
          title: 'New Transaction',
          description: `Received ${event.detail.value} ETH`,
          status: 'success',
          duration: 5000,
        });
      }
    };

    // Listen for outgoing transactions
    const handleOutgoingTransaction = (event: any) => {
      if (event.detail.from === address) {
        safeToast({
          title: 'Transaction Sent',
          description: `Sent ${event.detail.value} ETH to ${event.detail.to}`,
          status: 'info',
          duration: 5000,
        });
      }
    };

    // Listen for vault events
    const handleVaultEvent = (event: any) => {
      switch (event.detail.type) {
        case 'vault_created':
          safeToast({
            title: 'Vault Created',
            description: 'Your new vault has been created successfully',
            status: 'success',
            duration: 5000,
          });
          break;
        case 'vault_locked':
          safeToast({
            title: 'Vault Locked',
            description: 'Your vault has been locked according to your settings',
            status: 'info',
            duration: 5000,
          });
          break;
        case 'vault_unlocked':
          safeToast({
            title: 'Vault Unlocked',
            description: 'Your vault is now unlocked and ready for withdrawal',
            status: 'success',
            duration: 5000,
          });
          break;
        default:
          break;
      }
    };

    // Add event listeners
    window.addEventListener('incoming_transaction', handleIncomingTransaction);
    window.addEventListener('outgoing_transaction', handleOutgoingTransaction);
    window.addEventListener('vault_event', handleVaultEvent);

    // Cleanup
    return () => {
      window.removeEventListener('incoming_transaction', handleIncomingTransaction);
      window.removeEventListener('outgoing_transaction', handleOutgoingTransaction);
      window.removeEventListener('vault_event', handleVaultEvent);
    };
  }, [activeWallet, toast]);

  return null;
}; 