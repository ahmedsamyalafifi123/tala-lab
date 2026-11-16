"use client";

import { createContext, useContext } from "react";

/**
 * Portal target for Popover and Select pickers rendered inside a drawer.
 * A Vaul drawer blocks touch scrolling outside its own element, so pickers
 * portalled to <body> cannot scroll on phones. Providers set this to the
 * drawer element; the pickers portal into it instead.
 */
const PickerContainerContext = createContext<HTMLElement | null>(null);

export const PickerContainerProvider = PickerContainerContext.Provider;

export function usePickerContainer() {
  return useContext(PickerContainerContext) ?? undefined;
}
