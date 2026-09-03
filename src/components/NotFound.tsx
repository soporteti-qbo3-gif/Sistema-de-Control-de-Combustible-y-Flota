/**
 * Componente 404 - Página no encontrada
 */

import React from 'react';
import { Home, ArrowLeft, Search } from 'lucide-react';

interface NotFoundProps {
  onGoHome?: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onGoHome }) => {
  return (
    <div
      id="page-not-found"
      className="min-h-[60vh] flex items-center justify-center p-4 sm:p-8 font-sans text-stone-900"
    >
      <div className="max-w-md w-full text-center space-y-6 bg-white border border-stone-200/80 rounded-2xl p-6 sm:p-10 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center border border-stone-200 shadow-inner">
          <Search className="w-8 h-8 text-stone-500" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            Error 404
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Página no encontrada
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
            La ruta o recurso al que intentas acceder no existe, ha sido reubicada o el enlace ingresado es incorrecto.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          {onGoHome ? (
            <button
              id="btn-not-found-action"
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </button>
          ) : (
            <a
              id="link-not-found-home"
              href="/"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              <span>Ir al Inicio</span>
            </a>
          )}

          <button
            id="btn-not-found-back"
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold border border-stone-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Regresar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
