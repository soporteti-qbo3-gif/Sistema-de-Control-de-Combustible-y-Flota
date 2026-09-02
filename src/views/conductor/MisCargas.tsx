/**
 * Historial de Cargas de Combustible para Conductor
 * - Tarjetas plegables (Acordeón compacto)
 * - Filtro por mes con selector horizontal de chips
 * - Información clave visible de un vistazo: fecha, odómetro, costo y estado
 * - Cero tablas anchas; filas resumidas ultra-legibles en móvil
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Fuel,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Receipt,
  Gauge,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CargaCombustible } from '../../types';
import { PhotoViewerModal } from '../../components/PhotoViewerModal';

export const MisCargas: React.FC = () => {
  const { usuario } = useAuth();
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mesFiltro, setMesFiltro] = useState<string>('TODOS');
  const [tarjetaExpandidaId, setTarjetaExpandidaId] = useState<string | null>(null);
  const [photoViewer, setPhotoViewer] = useState<{ open: boolean; title: string; url?: string }>({
    open: false,
    title: '',
  });

  const cargarCargas = async () => {
    setCargando(true);
    try {
      const data = await api.getCargas();
      setCargas(data);
    } catch (e) {
      console.error('Error cargando historial de cargas:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCargas();
  }, [usuario]);

  // Formato amigable de fecha
  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'Fecha no registrada';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleDateString('es-CR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaStr;
    }
  };

  // Extraer meses disponibles dinámicamente según las cargas reales
  const mesesDisponibles = React.useMemo(() => {
    const map = new Map<string, string>();
    map.set('TODOS', 'Todas las Cargas');

    cargas.forEach((c) => {
      if (c.fecha) {
        try {
          const d = new Date(c.fecha);
          if (!isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
            const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
            if (!map.has(key)) {
              map.set(key, capitalized);
            }
          }
        } catch {
          // Ignorar si no es fecha válida
        }
      }
    });

    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [cargas]);

  const cargasFiltradas = cargas.filter((c) => {
    if (mesFiltro === 'TODOS') return true;
    if (!c.fecha) return false;
    try {
      const d = new Date(c.fecha);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === mesFiltro;
      }
    } catch {
      // fallback substring check
    }
    return c.fecha.includes(mesFiltro);
  });

  const toggleExpand = (id: string) => {
    setTarjetaExpandidaId(tarjetaExpandidaId === id ? null : id);
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-3 pb-20 lg:pb-8">
      {/* Header Compacto */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">
              Historial de Cargas
            </h1>
            <p className="text-xs text-slate-500">
              {cargasFiltradas.length} registros encontrados
            </p>
          </div>
        </div>
      </div>

      {/* Selector Horizontal de Meses (Scrollable Chips) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        {mesesDisponibles.map((m) => {
          const activo = mesFiltro === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMesFiltro(m.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                activo
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Lista de Tarjetas en Acordeón */}
      {cargando ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando registros...</p>
        </div>
      ) : cargasFiltradas.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <History className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-700">No hay cargas en este período</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cargasFiltradas.map((carga) => {
            const isExpanded = tarjetaExpandidaId === carga.id;

            const getEstadoBadge = () => {
              switch (carga.estadoValidacion) {
                case 'VALIDADO':
                  return (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                      Validado
                    </span>
                  );
                case 'REQUIERE_REVISION':
                  return (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                      Revisión
                    </span>
                  );
                default:
                  return (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      Pendiente
                    </span>
                  );
              }
            };

            return (
              <div
                key={carga.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-colors"
              >
                {/* Cabecera de la Tarjeta (Resumen Compacto Clickeable) */}
                <div
                  onClick={() => toggleExpand(carga.id)}
                  className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                      <Fuel className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-mono font-semibold text-slate-900">
                          {carga.vehiculoPlaca}
                        </span>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] text-slate-500 truncate">
                          {formatearFecha(carga.fecha)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-xs font-mono font-medium text-slate-900">
                          ₡{Number(carga.totalPagado).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ({Number(carga.odometroActual).toLocaleString()} km)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {getEstadoBadge()}
                    <button
                      className="p-1 text-slate-400 hover:text-slate-700"
                      aria-label="Ver detalles"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Contenido Plegable Expandido */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-slate-50/60 text-xs space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Litros</span>
                        <span className="font-semibold text-slate-900 font-mono">{carga.litros} L</span>
                      </div>
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Rendimiento</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {carga.rendimientoKmL ? `${carga.rendimientoKmL.toFixed(1)} km/L` : 'N/A'}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Precio/L</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          ₡{Math.round(carga.precioPorLitro)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-2 rounded-md border border-slate-200">
                      <span>Estación: <strong className="text-slate-900">{carga.estacion}</strong></span>
                      {carga.codigoAutorizacion && (
                        <span className="font-mono font-medium text-emerald-800">
                          Token: {carga.codigoAutorizacion}
                        </span>
                      )}
                    </div>

                    {/* Nota del Conductor */}
                    {carga.notaConductor && (
                      <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-md text-[11px] text-amber-900 space-y-1">
                        <span className="font-medium flex items-center space-x-1 text-amber-800">
                          <MessageSquare className="w-3 h-3 text-amber-700" />
                          <span>Tu nota enviada al Administrador:</span>
                        </span>
                        <p className="italic text-slate-800 bg-white/70 p-1.5 rounded border border-amber-200/50">
                          "{carga.notaConductor}"
                        </p>
                      </div>
                    )}

                    {/* Nota de Validación del Administrador */}
                    {carga.notasValidacion && (
                      <div className="p-2 bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-700 space-y-1">
                        <span className="font-medium text-slate-900">
                          Observación de Auditoría (Admin {carga.validadoPor ? `• ${carga.validadoPor}` : ''}):
                        </span>
                        <p className="text-slate-600">
                          {carga.notasValidacion}
                        </p>
                      </div>
                    )}

                    {/* Miniaturas de comprobantes */}
                    {(carga.fotoFacturaUrl || carga.fotoOdometroUrl) && (
                      <div className="flex items-center space-x-2 pt-1">
                        {carga.fotoFacturaUrl && (
                          <button
                            onClick={() =>
                              setPhotoViewer({
                                open: true,
                                title: `Factura - ${carga.vehiculoPlaca}`,
                                url: carga.fotoFacturaUrl,
                              })
                            }
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium"
                          >
                            <Receipt className="w-3 h-3 text-slate-500" />
                            <span>Ver Factura</span>
                          </button>
                        )}
                        {carga.fotoOdometroUrl && (
                          <button
                            onClick={() =>
                              setPhotoViewer({
                                open: true,
                                title: `Odómetro - ${carga.vehiculoPlaca}`,
                                url: carga.fotoOdometroUrl,
                              })
                            }
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-medium"
                          >
                            <Gauge className="w-3 h-3 text-slate-500" />
                            <span>Ver Odómetro</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Visor Modal de Fotos */}
      <PhotoViewerModal
        isOpen={photoViewer.open}
        onClose={() => setPhotoViewer({ open: false, title: '' })}
        title={photoViewer.title}
        imageUrl={photoViewer.url}
      />
    </div>
  );
};
