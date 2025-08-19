import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_NETWORKS, getNetworkById, SupportedNetwork } from '../constants/networks';

type NetworkContextType = {
  network: SupportedNetwork;
  setNetwork: (n: SupportedNetwork) => void;
  selectedNetwork: string;
  setSelectedNetwork: (networkId: string) => void;
};

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [network, setNetworkState] = useState<SupportedNetwork>(SUPPORTED_NETWORKS[1] || SUPPORTED_NETWORKS[0]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('selectedNetworkId');
        if (saved) {
          const found = getNetworkById(saved);
          if (found) setNetworkState(found);
        }
      } catch {}
    })();
  }, []);

  const setNetwork = async (n: SupportedNetwork) => {
    setNetworkState(n);
    try { await AsyncStorage.setItem('selectedNetworkId', n.id); } catch {}
  };

  const setSelectedNetwork = async (networkId: string) => {
    const found = getNetworkById(networkId);
    if (found) {
      setNetwork(found);
    }
  };

  return (
    <NetworkContext.Provider value={{ 
      network, 
      setNetwork, 
      selectedNetwork: network.id, 
      setSelectedNetwork 
    }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider');
  return ctx;
};


