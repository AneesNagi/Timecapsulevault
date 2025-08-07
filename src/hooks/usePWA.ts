import { useState, useEffect, useCallback } from 'react';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  canInstall: boolean;
  deferredPrompt: any;
  updateAvailable: boolean;
}

export const usePWA = () => {
  const [pwaState, setPwaState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    canInstall: false,
    deferredPrompt: null,
    updateAvailable: false
  });

  // Check if app is installed
  useEffect(() => {
    const checkInstallation = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
      
      setPwaState(prev => ({ ...prev, isInstalled }));
    };

    checkInstallation();
    window.addEventListener('appinstalled', checkInstallation);
    
    return () => {
      window.removeEventListener('appinstalled', checkInstallation);
    };
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setPwaState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setPwaState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaState(prev => ({ 
        ...prev, 
        canInstall: true, 
        deferredPrompt: e 
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setPwaState(prev => ({ ...prev, updateAvailable: true }));
      });
    }
  }, []);

  // Install app
  const installApp = useCallback(async () => {
    if (pwaState.deferredPrompt) {
      pwaState.deferredPrompt.prompt();
      const { outcome } = await pwaState.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setPwaState(prev => ({ 
          ...prev, 
          canInstall: false, 
          deferredPrompt: null,
          isInstalled: true 
        }));
      }
    }
  }, [pwaState.deferredPrompt]);

  // Update app
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  // Send notification
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      return new Notification(title, options);
    }
  }, []);

  // Background sync
  const requestBackgroundSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator && 'sync' in (window.ServiceWorkerRegistration.prototype as any)) {
      const registration = await navigator.serviceWorker.ready;
      return (registration as any).sync.register(tag);
    }
  }, []);

  return {
    ...pwaState,
    installApp,
    updateApp,
    registerServiceWorker,
    requestNotificationPermission,
    sendNotification,
    requestBackgroundSync
  };
}; 