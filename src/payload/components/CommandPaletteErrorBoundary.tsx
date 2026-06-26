"use client";

import React from "react";

/* Wraps the command palette so that, in the unlikely event it throws during render,
   the palette simply disappears and the rest of the admin keeps working. */

export class CommandPaletteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — the palette is non-essential; never break the admin */
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
