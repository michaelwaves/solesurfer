"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Silently catches SparkJS / splat loading errors so the rest of the
 * scene still renders if the Gaussian splat fails (e.g. on Pico headsets).
 */
export default class SplatErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[SplatBackground] Caught error, disabling splat:", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}
