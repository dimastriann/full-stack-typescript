import { create } from 'zustand';
import type { viewType } from '../types/View';

interface ViewStore {
  view: viewType;
  setView: (view: viewType) => void;
}

export const useViewStore = create<ViewStore>((set) => ({
  view: 'table',
  setView: (view: viewType) => set({ view }),
}));
