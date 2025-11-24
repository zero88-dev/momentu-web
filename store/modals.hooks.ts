import { create } from "zustand";
const useModals = create((set) => ({
  visibleSearch: false,
  setVisibleSearch: (visible: boolean) => set({ visibleSearch: visible }),
}));

export default useModals;
