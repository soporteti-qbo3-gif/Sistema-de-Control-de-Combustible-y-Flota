/**
 * Componente 404 - Página no encontrada (Estilo SaaS Premium)
 */

import React from 'react';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from './ui/Button';

interface NotFoundProps {
  onGoHome?: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div
      id="page-not-found"
      className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8 font-sans text-slate-900 dark:text-slate-100"
    >
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xs">
        <div className="w-14 h-14 mx-auto rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs">
          <Search className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
            Error 404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Página no encontrada
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            La ruta o recurso al que intentas acceder no existe, ha sido reubicada o el enlace ingresado es incorrecto.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          {onGoHome ? (
            <Button
              id="btn-not-found-action"
              variant="primary"
              size="md"
              onClick={onGoHome}
              icon={<Home className="w-4 h-4" />}
            >
              Ir al Inicio
            </Button>
          ) : (
            <a
              id="link-not-found-home"
              href="/"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </a>
          )}

          <Button
            id="btn-not-found-back"
            variant="secondary"
            size="md"
            onClick={() => window.history.back()}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Regresar
          </Button>
        </div>
      </div>
    </div>
  );
};
