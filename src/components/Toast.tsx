/**
 * Sistema de Notificaciones Toast Flotantes para Feedback Inmediato
 */

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'info' | 'warning';
  mensaje: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col space-y-2 max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const getIcon = () => {
          switch (t.tipo) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
            case 'error':
              return <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-sky-600 flex-shrink-0" />;
          }
        };

        const getBg = () => {
          switch (t.tipo) {
            case 'success':
              return 'bg-emerald-50 border-emerald-200 text-emerald-950';
            case 'error':
              return 'bg-rose-50 border-rose-200 text-rose-950';
            case 'warning':
              return 'bg-amber-50 border-amber-200 text-amber-950';
            default:
              return 'bg-sky-50 border-sky-200 text-sky-950';
          }
        };

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl border shadow-lg transition-all transform animate-in fade-in slide-in-from-top-2 ${getBg()}`}
          >
            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
              {getIcon()}
              <p className="text-xs font-semibold leading-tight">{t.mensaje}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="p-1 rounded-lg text-stone-500 hover:text-stone-900 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
