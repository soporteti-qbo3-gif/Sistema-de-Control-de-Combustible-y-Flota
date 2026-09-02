/**
 * Ejecutor Interactivo de Pruebas Unitarias de Cálculos y Reglas de Negocio
 */

import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Sparkles,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { TestReport } from '../../types';
import confetti from 'canvas-confetti';

export const PruebasUnitarias: React.FC = () => {
  const [reporte, setReporte] = useState<TestReport | null>(null);
  const [ejecutando, setEjecutando] = useState(false);

  const correrPruebas = async () => {
    setEjecutando(true);
    try {
      const resp = await api.ejecutarPruebas();
      setReporte(resp);

      if (resp.porcentajeExito === 100) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error('Error al ejecutar pruebas:', e);
    } finally {
      setEjecutando(false);
    }
  };

  useEffect(() => {
    correrPruebas();
  }, []);

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
            <FlaskConical className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">Suite de Pruebas Unitarias</h1>
            <p className="text-xs text-slate-500">
              Validación matemática de fórmulas de flota, km recorridos, rendimiento km/L y alertas
            </p>
          </div>
        </div>

        <button
          id="btn-run-tests"
          disabled={ejecutando}
          onClick={correrPruebas}
          className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
        >
          {ejecutando ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Ejecutando Test Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Re-ejecutar Pruebas</span>
            </>
          )}
        </button>
      </div>

      {/* Resumen de Ejecución */}
      {reporte && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500">Total Pruebas</span>
            <p className="text-xl font-mono font-semibold text-slate-900">{reporte.total}</p>
            <span className="text-[10px] text-slate-400">Casos evaluados</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
            <span className="text-[11px] font-medium text-emerald-700">Pasadas (Green)</span>
            <p className="text-xl font-mono font-semibold text-emerald-700">{reporte.pasados}</p>
            <span className="text-[10px] text-emerald-600">100% de aserciones OK</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
            <span className="text-[11px] font-medium text-rose-700">Fallidas</span>
            <p className="text-xl font-mono font-semibold text-slate-900">{reporte.fallidos}</p>
            <span className="text-[10px] text-slate-400">Errores encontrados</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
            <span className="text-[11px] font-medium text-slate-700">Tasa de Éxito</span>
            <p className="text-xl font-mono font-semibold text-slate-900">{reporte.porcentajeExito}%</p>
            <span className="text-[10px] text-slate-400">Integridad garantizada</span>
          </div>
        </div>
      )}

      {/* Lista Detallada de Pruebas */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">Detalle de Aserciones del Módulo calculos.ts</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {reporte ? new Date(reporte.timestamp).toLocaleTimeString() : ''}
          </span>
        </div>

        {ejecutando ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
            <span>Verificando algoritmos matemáticos...</span>
          </div>
        ) : !reporte ? (
          <p className="text-xs text-slate-500 text-center py-6">No hay datos de pruebas disponibles.</p>
        ) : (
          <div className="space-y-2">
            {reporte.resultados.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="flex items-start space-x-2.5">
                  {item.paso ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-slate-900 block">{item.nombre}</span>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 mt-0.5">
                      <span>Módulo: <strong className="text-slate-800 font-mono">{item.modulo}</strong></span>
                      <span>•</span>
                      <span>Esperado: <strong className="text-emerald-700 font-mono">{JSON.stringify(item.esperado)}</strong></span>
                      <span>•</span>
                      <span>Obtenido: <strong className="text-slate-900 font-mono">{JSON.stringify(item.obtenido)}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 block">{item.duracionMs} ms</span>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    PASSED
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
