"use client";

import React from "react";
import { CommandPalette } from "./CommandPalette";
import { CommandPaletteErrorBoundary } from "./CommandPaletteErrorBoundary";

/* Registered at admin.components.providers — wraps the entire admin tree. Must render
   {children} (providers nest), then mounts the palette alongside. The error boundary
   guarantees a palette fault can never take the admin down. */

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CommandPaletteErrorBoundary>
        <CommandPalette />
      </CommandPaletteErrorBoundary>
    </>
  );
}
