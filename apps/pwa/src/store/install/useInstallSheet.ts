import { create } from 'zustand';

/**
 * Whether the add-to-home-screen sheet is open.
 *
 * Shared rather than local because the two things that open it live in
 * different parts of the tree — the floating pill sits above the tab bar, the
 * docked chip sits in the header — and both must drive the same sheet.
 */
type InstallSheetState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useInstallSheet = create<InstallSheetState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
