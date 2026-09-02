/**
 * ErrorBoundary - Componente de captura de excepciones en tiempo de renderizado
 * Proporciona un fallback amigable, accesible y seguro para el usuario final.
 */

import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('CRITICAL [ErrorBoundary] Error capturado en el árbol de componentes:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          id="error-boundary-container"
          className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans text-stone-900"
        >
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-stone-200 p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center ring-8 ring-rose-50">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                Ha ocurrido un error inesperado
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                El sistema experimentó un fallo en la interfaz. No te preocupes, tus datos y operaciones previas permanecen seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs font-mono text-stone-700 overflow-x-auto max-h-32">
                <span className="font-bold text-rose-700 block mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </span>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-stone-500 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                id="btn-error-reset"
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>

              <button
                id="btn-error-reload"
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold border border-stone-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recargar</span>
              </button>

              <button
                id="btn-error-home"
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium border border-stone-200 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
