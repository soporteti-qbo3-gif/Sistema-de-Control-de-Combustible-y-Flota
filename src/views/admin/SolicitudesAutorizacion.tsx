/**
 * Módulo Administrativo: Autorizaciones de Carga y Emisión de Tokens Digitales
 */

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  Truck,
  Fuel,
  Gauge,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  Send,
  Sparkles,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { SolicitudAutorizacion, Vehiculo } from '../../types';

export const SolicitudesAutorizacion: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudAutorizacion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODAS');
  const [copiadoToken, setCopiadoToken] = useState<string | null>(null);

  // Modal rechazo
  const [solicitudRechazo, setSolicitudRechazo] = useState<SolicitudAutorizacion | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensajeAlerta, setMensajeAlerta] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      const [sols, vehs] = await Promise.all([api.getSolicitudes(), api.getVehiculos()]);
      setSolicitudes(sols);
      setVehiculos(vehs);
    } catch (e) {
      console.error('Error cargando solicitudes:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleAprobar = async (id: string) => {
    setProcesando(true);
    try {
      const res = await api.aprobarSolicitud(id);
      setMensajeAlerta(
        `Solicitud aprobada con éxito. Código de autorización generado: ${res.solicitud.codigoAutorizacion}. Conductor notificado en su app.`
      );
      setTimeout(() => setMensajeAlerta(null), 6000);
      await cargarDatos();
    } catch (e: any) {
      alert('Error al aprobar: ' + e.message);
    } finally {
      setProcesando(false);
    }
  };

  const handleConfirmarRechazo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudRechazo) return;

    setProcesando(true);
    try {
      await api.rechazarSolicitud(solicitudRechazo.id, motivoRechazo);
      setMensajeAlerta(`Solicitud de ${solicitudRechazo.conductorNombre} rechazada.`);
      setSolicitudRechazo(null);
      setMotivoRechazo('');
      setTimeout(() => setMensajeAlerta(null), 5000);
      await cargarDatos();
    } catch (e: any) {
      alert('Error al rechazar: ' + e.message);
    } finally {
      setProcesando(false);
    }
  };

  const copiarAlPortapapeles = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiadoToken(token);
    setTimeout(() => setCopiadoToken(null), 2500);
  };

  // Filtrado
  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (filtroEstado !== 'TODAS' && s.estado !== filtroEstado) return false;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        s.conductorNombre.toLowerCase().includes(q) ||
        s.vehiculoPlaca.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.codigoAutorizacion && s.codigoAutorizacion.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendientesCount = solicitudes.filter((s) => s.estado === 'PENDIENTE').length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && solicitudRechazo) {
        setSolicitudRechazo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [solicitudRechazo]);

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-lg">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <KeyRound className="w-4 h-4" />
            </div>
            <h1 className="text-base font-semibold text-slate-900">Centro de Autorizaciones y Despacho Digital</h1>
            {pendientesCount > 0 && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                {pendientesCount} por autorizar
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Emite códigos de autorización únicos para los conductores. Las solicitudes aprobadas sincronizan automáticamente el token en la aplicación del conductor.
          </p>
        </div>

        <button
          onClick={cargarDatos}
          className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-slate-200 self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualizar</span>
        </button>
      </div>

      {mensajeAlerta && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{mensajeAlerta}</span>
        </div>
      )}

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-0.5">
            Total Solicitudes
          </span>
          <span className="text-xl font-semibold font-mono text-slate-900">{solicitudes.length}</span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block mb-0.5">
            Pendientes
          </span>
          <span className="text-xl font-semibold font-mono text-amber-600">{pendientesCount}</span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block mb-0.5">
            Aprobadas
          </span>
          <span className="text-xl font-semibold font-mono text-emerald-700">
            {solicitudes.filter((s) => s.estado === 'APROBADA').length}
          </span>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-0.5">
            Completadas
          </span>
          <span className="text-xl font-semibold font-mono text-slate-700">
            {solicitudes.filter((s) => s.estado === 'COMPLETADA').length}
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white border border-slate-200 p-2.5 rounded-lg">
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['TODAS', 'PENDIENTE', 'APROBADA', 'COMPLETADA', 'RECHAZADA'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filtroEstado === estado
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {estado === 'TODAS' ? 'Todas' : estado.charAt(0) + estado.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, conductor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-slate-400 focus:bg-white"
          />
        </div>
      </div>

      {/* Listado de Solicitudes */}
      <div className="space-y-3">
        {cargando ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-700" />
            Cargando solicitudes...
          </div>
        ) : solicitudesFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
            <KeyRound className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            No hay solicitudes que coincidan con los criterios de búsqueda.
          </div>
        ) : (
          solicitudesFiltradas.map((sol) => {
            const vehiculo = vehiculos.find((v) => v.id === sol.vehiculoId);
            const esPendiente = sol.estado === 'PENDIENTE';

            return (
              <div
                key={sol.id}
                id={`card-solicitud-${sol.id}`}
                className={`p-4 rounded-lg border transition-colors ${
                  esPendiente
                    ? 'bg-amber-50/20 border-amber-200'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Info Conductor y Vehículo */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {sol.id}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wider ${
                          sol.estado === 'PENDIENTE'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : sol.estado === 'APROBADA'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : sol.estado === 'COMPLETADA'
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {sol.estado}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(sol.fechaSolicitud).toLocaleString('es-CR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-slate-900 block">{sol.conductorNombre}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{sol.conductorTelefono}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-medium text-slate-900 block">
                            {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : 'Vehículo'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-800 font-medium">{sol.vehiculoPlaca}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Gauge className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-semibold text-slate-900 block font-mono">
                            {sol.odometroReportado.toLocaleString('es-CR')} km
                          </span>
                          <span className="text-[11px] text-slate-500">Odómetro Reportado</span>
                        </div>
                      </div>
                    </div>

                    {/* Detalle solicitud */}
                    <div className="p-2.5 bg-slate-50/70 rounded-md border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-600">
                            Litros: <strong className="text-slate-900 font-mono">{sol.litrosSolicitados} L</strong>
                          </span>
                          <span className="text-slate-600">
                            Presupuesto Est.: <strong className="text-slate-900 font-mono">₡{Math.round(sol.montoMaximoEstimado || 0).toLocaleString('es-CR')} CRC</strong>
                          </span>
                        </div>
                        {sol.estacionSugerida && (
                          <span className="text-slate-500 text-[11px]">Estación: {sol.estacionSugerida}</span>
                        )}
                      </div>
                      <p className="text-slate-700 pt-0.5">
                        <strong className="text-slate-600 font-medium">Motivo:</strong> {sol.motivo}
                      </p>
                    </div>
                  </div>

                  {/* Acciones o Token Generado */}
                  <div className="flex flex-col items-end justify-center space-y-2 lg:pl-4 lg:border-l lg:border-slate-200 min-w-[200px]">
                    {sol.codigoAutorizacion ? (
                      <div className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-md space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-medium text-slate-500">Token Autorizado</span>
                          <button
                            onClick={() => copiarAlPortapapeles(sol.codigoAutorizacion!)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copiar Token"
                          >
                            {copiadoToken === sol.codigoAutorizacion ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-sm font-semibold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 text-center tracking-wider">
                          {sol.codigoAutorizacion}
                        </div>
                        <span className="text-[10px] text-slate-500 block text-center">
                          Aprobado por: <strong className="text-slate-700">{sol.aprobadoPor || 'Admin'}</strong>
                        </span>
                      </div>
                    ) : sol.motivoRechazo ? (
                      <div className="w-full bg-rose-50 border border-rose-200 p-2.5 rounded-md text-xs text-rose-800">
                        <span className="font-medium block mb-0.5">Solicitud Rechazada</span>
                        <p className="text-[11px] text-rose-700">{sol.motivoRechazo}</p>
                      </div>
                    ) : (
                      <div className="flex flex-row lg:flex-col gap-1.5 w-full">
                        <button
                          id={`btn-aprobar-${sol.id}`}
                          onClick={() => handleAprobar(sol.id)}
                          disabled={procesando}
                          className="flex-1 lg:w-full px-3.5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Aprobar y Emitir Token</span>
                        </button>

                        <button
                          id={`btn-rechazar-${sol.id}`}
                          onClick={() => setSolicitudRechazo(sol)}
                          disabled={procesando}
                          className="flex-1 lg:w-full px-3 py-1.5 rounded-md bg-slate-100 hover:bg-rose-50 hover:border-rose-300 border border-slate-200 text-slate-700 hover:text-rose-700 text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Rechazo */}
      {solicitudRechazo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setSolicitudRechazo(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900 flex items-center">
              <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
              Rechazar Solicitud {solicitudRechazo.id}
            </h3>

            <p className="text-xs text-slate-600">
              Indica la razón por la cual no se autoriza la carga para{' '}
              <strong className="text-slate-900">{solicitudRechazo.conductorNombre}</strong> ({solicitudRechazo.vehiculoPlaca}).
            </p>

            <form onSubmit={handleConfirmarRechazo} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Motivo del rechazo *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej. El vehículo aún cuenta con suficiente combustible o excede la cuota semanal."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md p-2.5 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSolicitudRechazo(null)}
                  className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  {procesando ? 'Procesando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
