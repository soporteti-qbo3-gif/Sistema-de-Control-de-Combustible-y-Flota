/**
 * Modal de Solicitud de Carga y Despacho Digital para el Conductor
 */

import React, { useState } from 'react';
import {
  X,
  Send,
  Fuel,
  Gauge,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Vehiculo } from '../../types';
import { api } from '../../services/api';

interface SolicitarCargaModalProps {
  isOpen?: boolean;
  vehiculo?: Vehiculo | null;
  vehiculoAsignado?: Vehiculo | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const SolicitarCargaModal: React.FC<SolicitarCargaModalProps> = ({
  isOpen = true,
  vehiculo,
  vehiculoAsignado,
  onClose,
  onSuccess,
}) => {
  const vehiculoActual = vehiculo || vehiculoAsignado || null;

  const [odometroReportado, setOdometroReportado] = useState<number>(vehiculoActual?.odometroActual || 0);
  const [litrosSolicitados, setLitrosSolicitados] = useState<number>(
    vehiculoActual ? Math.round(vehiculoActual.capacidadTanqueLitros * 0.8) : 50
  );
  const [estacionSugerida, setEstacionSugerida] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Ruta operativa programada y distribución.');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solicitudCreada, setSolicitudCreada] = useState<any | null>(null);

  // Sincronizar si cambia la unidad
  React.useEffect(() => {
    if (vehiculoActual) {
      setOdometroReportado(vehiculoActual.odometroActual);
      setLitrosSolicitados(Math.round(vehiculoActual.capacidadTanqueLitros * 0.8));
    }
  }, [vehiculoActual]);

  // Escuchar tecla Escape para cerrar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (!vehiculoActual) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100"
        onClick={onClose}
      >
        <div className="w-full max-w-sm bg-white p-5 rounded-lg border border-slate-200 text-center space-y-3 shadow-lg">
          <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No hay vehículo asignado</h3>
          <p className="text-xs text-slate-500">
            Debes tener un vehículo asignado para solicitar una autorización de carga.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-900 text-white rounded-md text-xs font-medium"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  const precioEstimadoLitro = vehiculoActual.tipoCombustible === 'Diesel' ? 640 : 720;
  const montoEstimado = Math.round(litrosSolicitados * precioEstimadoLitro);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (odometroReportado < vehiculoActual.odometroActual) {
      setError(
        `El odómetro ingresado (${odometroReportado.toLocaleString()} km) no puede ser menor al último odómetro del vehículo (${vehiculoActual.odometroActual.toLocaleString()} km).`
      );
      return;
    }

    if (litrosSolicitados > vehiculoActual.capacidadTanqueLitros) {
      setError(
        `Los litros solicitados (${litrosSolicitados} L) superan la capacidad total del tanque (${vehiculoActual.capacidadTanqueLitros} L).`
      );
      return;
    }

    setEnviando(true);
    try {
      const nueva = await api.createSolicitud({
        vehiculoId: vehiculoActual.id,
        odometroReportado: Number(odometroReportado),
        litrosSolicitados: Number(litrosSolicitados),
        estacionSugerida: estacionSugerida.trim() || undefined,
        motivo: motivo.trim(),
      });

      setSolicitudCreada(nueva);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud.');
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Solicitar Autorización de Carga</h2>
              <p className="text-[11px] text-slate-500">
                Despacho digital para {vehiculoActual.marca} {vehiculoActual.modelo} ({vehiculoActual.placa})
              </p>
            </div>
          </div>
          <button
            id="btn-close-modal-solicitud"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido */}
        {solicitudCreada ? (
          <div className="p-6 text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">¡Solicitud Enviada Exitosamente!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                El folio <strong className="text-slate-900 font-mono">{solicitudCreada.id}</strong> ha sido enviado a la central de despacho.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Litros solicitados:</span>
                <span className="font-medium text-slate-900">{solicitudCreada.litrosSolicitados} Litros</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Monto estimado:</span>
                <span className="font-semibold text-slate-900 font-mono">₡{Math.round(solicitudCreada.montoMaximoEstimado || 0).toLocaleString('es-CR')} CRC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estado:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  PENDIENTE DE REVISIÓN
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Recibirás el código de autorización en tu panel y avisos en cuanto sea autorizado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-start space-x-2 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Vehículo Info Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Vehículo Asignado
                </span>
                <span className="font-semibold text-slate-900">
                  {vehiculoActual.marca} {vehiculoActual.modelo} ({vehiculoActual.anio})
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                  Capacidad Tanque
                </span>
                <span className="font-medium text-slate-800">{vehiculoActual.capacidadTanqueLitros} L ({vehiculoActual.tipoCombustible})</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center">
                  <Gauge className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  Odómetro Actual (km) *
                </label>
                <input
                  type="number"
                  required
                  min={vehiculoActual.odometroActual}
                  value={odometroReportado}
                  onChange={(e) => setOdometroReportado(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-2 focus:border-slate-400 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                  Último: {vehiculoActual.odometroActual.toLocaleString('es-CR')} km
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center">
                  <Fuel className="w-3.5 h-3.5 mr-1 text-slate-600" />
                  Litros a Cargar *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={vehiculoActual.capacidadTanqueLitros}
                  value={litrosSolicitados}
                  onChange={(e) => setLitrosSolicitados(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-2 focus:border-slate-400 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Capacidad: {vehiculoActual.capacidadTanqueLitros} L
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-600" />
                Estación o Gasolinera Sugerida
              </label>
              <input
                type="text"
                placeholder="Ej. Servicentro Delta La Sabana o Gasolinera Uno Santa Ana"
                value={estacionSugerida}
                onChange={(e) => setEstacionSugerida(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-2 focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1 text-slate-600" />
                Motivo / Justificación *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Ruta de distribución foránea hacia GAM y Alajuela"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-md px-3 py-2 focus:border-slate-400 focus:outline-none"
              />
            </div>

            {/* Presupuesto Estimado */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-slate-600" />
                <span className="text-slate-600 font-medium">Monto Máximo Estimado:</span>
              </div>
              <span className="text-xs font-semibold text-slate-900 font-mono">₡{montoEstimado.toLocaleString('es-CR')} CRC</span>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-md bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando}
                className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{enviando ? 'Enviando Solicitud...' : 'Enviar Solicitud'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
