import { create } from 'zustand';

interface PaywallState {
  isOpen: boolean;
  limitType: 'project' | 'member' | 'storage' | null;
  openPaywall: (limitType: 'project' | 'member' | 'storage') => void;
  closePaywall: () => void;
}

export const usePaywallStore = create<PaywallState>((set) => ({
  isOpen: false,
  limitType: null,
  openPaywall: (limitType) => set({ isOpen: true, limitType }),
  closePaywall: () => set({ isOpen: false, limitType: null }),
}));
