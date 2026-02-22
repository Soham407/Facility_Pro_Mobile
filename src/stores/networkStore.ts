import { create } from 'zustand';

interface NetworkStore {
  isOnline: boolean;
  setOnline: (online: boolean) => void;
}

export const useNetworkStore = create<NetworkStore>((set) => ({
  isOnline: true,
  setOnline: (isOnline) => set({ isOnline }),
}));
