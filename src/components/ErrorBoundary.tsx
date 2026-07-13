'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by Careerverse ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-black/60 border border-rose-500/20 rounded-lg flex flex-col items-center justify-center text-center space-y-4 font-mono text-xs max-w-full">
          <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />
          <div className="space-y-1">
            <h3 className="font-bold text-white uppercase">{this.props.fallbackTitle || "SYSTEM MODULE ERROR"}</h3>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              {this.state.error?.message || "Quantum synchronization anomaly detected."}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded transition-all text-[10px] uppercase font-bold cursor-pointer"
          >
            Re-Initialize Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
