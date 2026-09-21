/**
 * Dashboard Ejecutivo de Operaciones de Flota & Combustible
 * Diseño sobrio, sin sobrecarga de tarjetas, alta densidad informativa y control directo.
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Gauge,
  CheckCircle2,
  KeyRound,
  BarChart3,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  Clock,
  ChevronRight,
  RefreshCw,
  Truck,
  Building2,
  AlertTriangle,
  FileCheck2,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../services/api';
import { MetricasFlota, CargaCombustible, SolicitudAutorizacion, SaldoEstacion } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AdminDashboardProps {
  setVistaActiva: (v: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ setVistaActiva }) => {
  const [metricas, setMetricas] = useState<MetricasFlota | null>(null);
  const [cargasPendientes, setCargasPendientes] = useState<CargaCombustible[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudAutorizacion[]>([]);
  const [saldos, setSaldos] = useState<SaldoEstacion[]>([]);
  const [datosGrafico, setDatosGrafico] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabCola, setTabCola] = useState<'cargas' | 'solicitudes'>('cargas');
  const [vistaGrafico, setVistaGrafico] = useState<'gasto' | 'comparativa'>('comparativa');

  const cargarDashboard = async () => {
    setCargando(true);
    try {
      const [data, dataSaldos] = await Promise.all([api.getDashboard(), api.getSaldos()]);
      setMetricas(data.metricas);
      setSaldos(dataSaldos);
      setCargasPendientes(
        data.ultimasCargas
          ? data.ultimasCargas.filter(
              (c: CargaCombustible) =>
                c.estadoValidacion === 'PENDIENTE' ||
                c.estadoValidacion === 'REQUIERE_REVISION'
            )
          : []
      );
      setSolicitudesPendientes(
        data.solicitudesRecientes
          ? data.solicitudesRecientes.filter(
              (s: SolicitudAutorizacion) => s.estado === 'PENDIENTE'
            )
          : []
      );
      setDatosGrafico(data.evolucionMensual || []);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const totalSaldoDisponible = saldos.reduce((acc, s) => acc + s.saldoActual, 0);
  const bombasEnAlerta = saldos.filter((s) => s.enAlerta || s.saldoActual <= s.umbralAlerta);

  const chartData =
    datosGrafico.length > 0
      ? datosGrafico
      : [
          { mes: 'Mar', gasto: 1200000, km: 11000, litros: 1750 },
          { mes: 'Abr', gasto: 1350000, km: 12500, litros: 1980 },
          { mes: 'May', gasto: 1420000, km: 13200, litros: 2050 },
          { mes: 'Jun', gasto: 1380000, km: 12900, litros: 1990 },
          { mes: 'Jul', gasto: 1510000, km: 14100, litros: 2200 },
          { mes: 'Ago', gasto: 1485000, km: 14850, litros: 2150 },
        ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-16">
      {/* 1. Header Ejecutivo con Large Title al estilo Apple iOS / macOS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between pb-2 gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#34C759] ring-4 ring-[#34C759]/20" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Operaciones de Flota • Turno Activo
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] tracking-tight">
            Control de Flota y Combustible
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitoreo en vivo de saldos en bombas, odómetros certificados y auditoría fotográfica
          </p>
        </div>

        {/* Botones de Comando Operativo con estilo Apple HIG */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setVistaActiva('admin-validacion')}
            className="apple-press-feedback flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white text-xs font-semibold shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Auditoría IA</span>
            {cargasPendientes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white text-[#007AFF] rounded-full text-[10px] font-bold">
                {cargasPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setVistaActiva('admin-saldos')}
            className={`apple-press-feedback flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              bombasEnAlerta.length > 0
                ? 'bg-[#FF9500]/10 text-[#C97700] border-[#FF9500]/30 hover:bg-[#FF9500]/20'
                : 'bg-white text-slate-700 border-black/[0.08] hover:bg-black/[0.02]'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span>Saldos Bombas</span>
            {bombasEnAlerta.length > 0 && (
              <span className="text-[10px] font-bold">
                • {bombasEnAlerta.length} Alerta
              </span>
            )}
          </button>

          <button
            onClick={() => setVistaActiva('admin-solicitudes')}
            className="apple-press-feedback flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white border border-black/[0.08] hover:bg-black/[0.02] text-slate-700 text-xs font-semibold transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Tokens</span>
            {solicitudesPendientes.length > 0 && (
              <span className="px-1.5 py-0.2 bg-black/[0.06] text-slate-800 rounded-md text-[10px] font-mono font-bold">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setVistaActiva('admin-reportes')}
            className="apple-press-feedback p-2 rounded-xl bg-white border border-black/[0.08] text-slate-600 hover:text-black hover:bg-black/[0.02] transition-all"
            title="Reportes comparativos"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={cargarDashboard}
            disabled={cargando}
            className="apple-press-feedback p-2 rounded-xl bg-white border border-black/[0.08] text-slate-600 hover:text-black hover:bg-black/[0.02] transition-all"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Ribbon de Métricas Continuo (Ledger Inset Grouped de alta densidad) */}
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-xs divide-y sm:divide-y-0 sm:divide-x divide-black/[0.06] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        {/* Métrica 1: Saldo Prepago en Estaciones */}
        <div
          onClick={() => setVistaActiva('admin-saldos')}
          className="p-4 hover:bg-black/[0.015] transition-colors cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Saldo en Bombas
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-[#1C1C1E] leading-tight">
              ₡{totalSaldoDisponible.toLocaleString('es-CR')}
            </div>
            <div className="flex items-center space-x-2 mt-1.5">
              {bombasEnAlerta.length > 0 ? (
                <span className="text-[10px] font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
                  {bombasEnAlerta.length} bajo umbral
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#248A3D] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                  Fondos activos
                </span>
              )}
              <span className="text-[11px] text-slate-400">3 estaciones</span>
            </div>
          </div>
        </div>

        {/* Métrica 2: Kilometraje Recorrido */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recorrido Mensual
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#34C759]/10 flex items-center justify-center text-[#34C759]">
              <Gauge className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-[#1C1C1E] leading-tight">
              {metricas?.totalKmRecorridos
                ? Number(metricas.totalKmRecorridos).toLocaleString()
                : '14,850'}
              <span className="text-xs font-normal text-slate-500 ml-1">km</span>
            </div>
            <div className="flex items-center space-x-1 mt-1.5 text-[11px] text-[#248A3D] font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+8.2% vs mes anterior</span>
            </div>
          </div>
        </div>

        {/* Métrica 3: Consumo e Inversión */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Combustible Facturado
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#AF52DE]/10 flex items-center justify-center text-[#AF52DE]">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-[#1C1C1E] leading-tight">
              ₡{metricas?.gastoTotalCombustible
                ? Number(metricas.gastoTotalCombustible).toLocaleString()
                : '1,485,000'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {metricas?.totalLitrosCargados || 2150} Litros despachados
            </div>
          </div>
        </div>

        {/* Métrica 4: Rendimiento */}
        <div className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Rendimiento Promedio
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-[#1C1C1E] leading-tight">
              {metricas?.rendimientoPromedioFlotaKmL
                ? metricas.rendimientoPromedioFlotaKmL.toFixed(1)
                : '7.8'}
              <span className="text-xs font-normal text-slate-500 ml-1">km/L</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Consumo ponderado en ruta
            </div>
          </div>
        </div>

        {/* Métrica 5: Vehículos & Conductores */}
        <div
          onClick={() => setVistaActiva('admin-vehiculos')}
          className="p-4 hover:bg-black/[0.015] transition-colors cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Parque Vehicular
            </span>
            <div className="w-6 h-6 rounded-lg bg-[#007AFF]/10 flex items-center justify-center text-[#007AFF]">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-[#1C1C1E] leading-tight">
              {metricas?.totalVehiculos || 19}
              <span className="text-xs font-normal text-slate-500 ml-1">unidades</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 flex items-center space-x-1">
              <span>{metricas?.totalConductores || 6} conductores asignados</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Área Operacional en Dos Columnas (Gráfica Técnica + Cola de Atención Inmediata) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Columna Izquierda: Evolución y Registro de Consumo (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-black/[0.06] gap-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E]">
                Evolución de Gasto & Kilometraje
              </h2>
              <p className="text-xs text-slate-500">
                Historial semestral por período de facturación
              </p>
            </div>

            {/* Selector de Perspectiva (Segmented Control estilo iOS) */}
            <div className="flex items-center bg-black/[0.05] p-1 rounded-xl text-xs">
              <button
                onClick={() => setVistaGrafico('comparativa')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  vistaGrafico === 'comparativa'
                    ? 'bg-white text-[#1C1C1E] shadow-xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                Gasto vs Km
              </button>
              <button
                onClick={() => setVistaGrafico('gasto')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  vistaGrafico === 'gasto'
                    ? 'bg-white text-[#1C1C1E] shadow-xs'
                    : 'text-slate-600 hover:text-black'
                }`}
              >
                Solo Gasto (₡)
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(60, 60, 67, 0.08)" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(60, 60, 67, 0.12)' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
                  tickLine={false}
                  axisLine={false}
                />
                {vistaGrafico === 'comparativa' && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#34C759' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k km`}
                    tickLine={false}
                    axisLine={false}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(28, 28, 30, 0.95)',
                    borderRadius: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'Gasto Combustible' || name === 'gasto'
                      ? `₡${Number(value).toLocaleString()} CRC`
                      : `${Number(value).toLocaleString()} km`,
                    name === 'Gasto Combustible' || name === 'gasto'
                      ? 'Gasto Combustible'
                      : 'Recorrido',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar
                  yAxisId="left"
                  dataKey="gasto"
                  fill="#007AFF"
                  radius={[6, 6, 0, 0]}
                  name="Gasto Combustible (₡)"
                />
                {vistaGrafico === 'comparativa' && (
                  <Bar
                    yAxisId="right"
                    dataKey="km"
                    fill="#34C759"
                    radius={[6, 6, 0, 0]}
                    name="Recorrido (km)"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Columna Derecha: Cola de Atención Inmediata (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-black/[0.06]">
              {/* Segmented Control para tabs */}
              <div className="flex items-center bg-black/[0.05] p-1 rounded-xl">
                <button
                  onClick={() => setTabCola('cargas')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tabCola === 'cargas'
                      ? 'bg-white text-[#1C1C1E] shadow-xs'
                      : 'text-slate-500 hover:text-black'
                  }`}
                >
                  Auditorías ({cargasPendientes.length})
                </button>
                <button
                  onClick={() => setTabCola('solicitudes')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tabCola === 'solicitudes'
                      ? 'bg-white text-[#1C1C1E] shadow-xs'
                      : 'text-slate-500 hover:text-black'
                  }`}
                >
                  Tokens ({solicitudesPendientes.length})
                </button>
              </div>

              <span className="text-[11px] text-slate-400 uppercase font-mono font-bold">
                Prioridad
              </span>
            </div>

            {/* Lista Tabular de Cargas por Auditar */}
            {tabCola === 'cargas' && (
              <div className="divide-y divide-black/[0.04] mt-2">
                {cargasPendientes.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#1C1C1E]">
                      Auditorías al día
                    </p>
                    <p className="text-xs text-slate-500">
                      No hay cargas pendientes de verificación fotográfica.
                    </p>
                  </div>
                ) : (
                  cargasPendientes.slice(0, 4).map((carga) => (
                    <div
                      key={carga.id}
                      className="py-3 flex items-center justify-between hover:bg-black/[0.02] px-2 rounded-xl transition-all group cursor-pointer"
                      onClick={() => setVistaActiva('admin-validacion')}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#1C1C1E] bg-black/[0.05] px-2 py-0.5 rounded-md">
                            {carga.vehiculoPlaca || 'FLOTA'}
                          </span>
                          <span className="text-xs font-bold text-[#1C1C1E] truncate">
                            {carga.conductorNombre || 'Conductor'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-slate-700">{carga.litros} L</span>
                          <span>•</span>
                          <span className="font-mono">₡{Number(carga.totalPagado).toLocaleString()}</span>
                          <span>•</span>
                          <span className="truncate">{carga.estacion}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {carga.estadoValidacion === 'REQUIERE_REVISION' ? (
                          <span className="text-[10px] font-bold text-[#C97700] bg-[#FF9500]/15 px-2.5 py-0.5 rounded-full">
                            Revisión
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#007AFF] transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Lista Tabular de Solicitudes de Autorización */}
            {tabCola === 'solicitudes' && (
              <div className="divide-y divide-black/[0.04] mt-2">
                {solicitudesPendientes.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-[#1C1C1E]">
                      Sin solicitudes en espera
                    </p>
                    <p className="text-xs text-slate-500">
                      Todos los tokens han sido emitidos o completados.
                    </p>
                  </div>
                ) : (
                  solicitudesPendientes.slice(0, 4).map((sol) => (
                    <div
                      key={sol.id}
                      className="py-3 flex items-center justify-between hover:bg-black/[0.02] px-2 rounded-xl transition-all group cursor-pointer"
                      onClick={() => setVistaActiva('admin-solicitudes')}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-[#1C1C1E] bg-black/[0.05] px-2 py-0.5 rounded-md">
                            {sol.vehiculoPlaca || 'UNIDAD'}
                          </span>
                          <span className="text-xs font-bold text-[#1C1C1E] truncate">
                            {sol.conductorNombre}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-bold text-[#248A3D]">
                            {sol.litrosSolicitados} Litros
                          </span>
                          <span>•</span>
                          <span className="truncate">{sol.estacionSugerida || 'Bomba'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#007AFF] bg-[#007AFF]/10 px-2.5 py-0.5 rounded-full">
                          Emitir
                        </span>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#007AFF] transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Enlace al pie del panel para ir a la vista completa */}
          <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-400">
              {tabCola === 'cargas'
                ? `${cargasPendientes.length} cargas registradas en espera`
                : `${solicitudesPendientes.length} conductores esperando autorización`}
            </span>
            <button
              onClick={() =>
                setVistaActiva(
                  tabCola === 'cargas' ? 'admin-validacion' : 'admin-solicitudes'
                )
              }
              className="text-xs font-bold text-[#007AFF] hover:underline flex items-center space-x-1"
            >
              <span>Abrir Módulo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
