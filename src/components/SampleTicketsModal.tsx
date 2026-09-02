/**
 * Selector de Muestras Rápidas de Facturas y Odómetros para Evaluación Inmediata (Costa Rica - ₡ / CRC)
 */

import React, { useEffect } from 'react';
import { X, Sparkles, Receipt } from 'lucide-react';
import { generarTicketSvgBase64, generarOdometroSvgBase64 } from '../../server/db';

export interface SampleTicketOption {
  id: string;
  nombre: string;
  estacion: string;
  tipoCombustible: string;
  litros: number;
  precioPorLitro: number;
  totalPagado: number;
  odometroActual: number;
  odometroAnterior: number;
  placa: string;
  folio: string;
  descripcion: string;
}

export const TICKETS_MUESTRA: SampleTicketOption[] = [
  {
    id: 'sample-delta-hilux',
    nombre: 'Factura Servicentro Delta 65L - Toyota Hilux',
    estacion: 'Servicentro Delta La Sabana - San José',
    tipoCombustible: 'Diesel',
    litros: 65.0,
    precioPorLitro: 640.0,
    totalPagado: 41600.0,
    odometroAnterior: 48920,
    odometroActual: 49640,
    placa: 'CR-ABC-123',
    folio: 'TKT-99432',
    descripcion: 'Carga completa de diésel con rendimiento óptimo (11.07 km/L)',
  },
  {
    id: 'sample-uno-versa',
    nombre: 'Factura Uno Santa Ana 36.5L - Nissan Versa',
    estacion: 'Gasolinera Uno Santa Ana',
    tipoCombustible: 'Gasolina Regular',
    litros: 36.5,
    precioPorLitro: 720.0,
    totalPagado: 26280.0,
    odometroAnterior: 32680,
    odometroActual: 33220,
    placa: 'CR-XYZ-567',
    folio: 'SHL-88210',
    descripcion: 'Ruta urbana GAM con rendimiento normal de 14.79 km/L',
  },
  {
    id: 'sample-jsm-f350',
    nombre: 'Factura JSM Alajuela 115L - Ford F-350',
    estacion: 'JSM Autopista Bernardo Soto Alajuela',
    tipoCombustible: 'Diesel',
    litros: 115.0,
    precioPorLitro: 638.0,
    totalPagado: 73370.0,
    odometroAnterior: 98750,
    odometroActual: 99480,
    placa: 'CR-TRK-901',
    folio: 'PMX-33109',
    descripcion: 'Carga de trabajo pesado para transporte interurbano (6.35 km/L)',
  },
  {
    id: 'sample-zurqui-anomalia',
    nombre: 'Factura El Zurquí con Alerta de Anomalía',
    estacion: 'Servicentro El Zurquí Ruta 32',
    tipoCombustible: 'Gasolina Regular',
    litros: 42.0,
    precioPorLitro: 725.0,
    totalPagado: 30450.0,
    odometroAnterior: 32680,
    odometroActual: 32980, // Solo 300 km recorridos con 42L = 7.14 km/L (Alerta roja!)
    placa: 'CR-XYZ-567',
    folio: 'BP-55421',
    descripcion: 'Muestra para auditar alerta de sobreconsumo / posible desvío de combustible',
  },
];

interface SampleTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sample: {
    fotoFacturaBase64: string;
    fotoOdometroBase64: string;
    estacion: string;
    tipoCombustible: string;
    litros: number;
    precioPorLitro: number;
    totalPagado: number;
    odometroActual: number;
    folio: string;
  }) => void;
}

export const SampleTicketsModal: React.FC<SampleTicketsModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePick = (t: SampleTicketOption) => {
    const fotoFacturaBase64 = generarTicketSvgBase64(
      t.estacion,
      t.litros,
      t.totalPagado,
      new Date().toISOString().split('T')[0],
      t.folio
    );
    const fotoOdometroBase64 = generarOdometroSvgBase64(t.odometroActual, t.placa);

    onSelect({
      fotoFacturaBase64,
      fotoOdometroBase64,
      estacion: t.estacion,
      tipoCombustible: t.tipoCombustible,
      litros: t.litros,
      precioPorLitro: t.precioPorLitro,
      totalPagado: t.totalPagado,
      odometroActual: t.odometroActual,
      folio: t.folio,
    });
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-900 border border-stone-200 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Seleccionar Muestra de Factura & Odómetro (Costa Rica)
              </h3>
              <p className="text-xs text-stone-500">
                Prueba instantánea con 1 clic para evaluar la IA Gemini
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Opciones */}
        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
          {TICKETS_MUESTRA.map((t) => (
            <div
              key={t.id}
              onClick={() => handlePick(t)}
              className="p-4 rounded-xl bg-stone-50 hover:bg-emerald-50/50 border border-stone-200 hover:border-emerald-300 transition-all cursor-pointer group flex items-start justify-between space-x-4 shadow-xs"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                    {t.nombre}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-mono font-bold">
                    {t.placa}
                  </span>
                </div>
                <p className="text-xs text-stone-700">
                  <span className="text-stone-500 font-medium">Estación:</span> {t.estacion}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-stone-600">
                  <span className="bg-white px-2 py-0.5 rounded border border-stone-200">
                    ⛽ {t.litros} L ({t.tipoCombustible})
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-700 font-semibold font-mono">
                    ₡{Math.round(t.totalPagado).toLocaleString('es-CR')} CRC
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-stone-200 text-sky-700 font-mono">
                    📍 Odómetro: {t.odometroActual.toLocaleString('es-CR')} km
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-stone-200 font-mono text-stone-700 font-bold">
                    Folio: {t.folio}
                  </span>
                </div>

                <p className="text-[11px] text-stone-500 italic mt-1">{t.descripcion}</p>
              </div>

              <button className="px-3 py-1.5 rounded-lg bg-stone-900 group-hover:bg-stone-800 text-white text-xs font-semibold flex items-center space-x-1 shadow-xs flex-shrink-0 mt-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Usar Muestra</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
