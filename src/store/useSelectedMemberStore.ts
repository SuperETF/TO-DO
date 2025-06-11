import { create } from "zustand";

interface SelectedMemberState {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
}

export const useSelectedMemberStore = create<SelectedMemberState>((set) => ({
  selectedId: null,
  setSelectedId: (id) => set({ selectedId: id }),
}));
