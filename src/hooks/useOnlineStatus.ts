import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useNetworkStore } from '../stores/networkStore';

export function useOnlineStatus() {
  const { isOnline, setOnline } = useNetworkStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(!!state.isConnected && !!state.isInternetReachable);
    });

    return () => unsubscribe();
  }, [setOnline]);

  return isOnline;
}
