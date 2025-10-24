import type { viewType } from '../types/View';

interface ViewStore {
  view: viewType;
  setView: (view: viewType) => void;
}
