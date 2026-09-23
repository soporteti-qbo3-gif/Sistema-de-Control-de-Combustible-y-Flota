/**
 * Dashboard Ejecutivo de Operaciones de Flota & Combustible
 * Diseño industrial, alta densidad informativa, estricto orden visual sin elementos infantiles
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  KeyRound,
  BarChart3,
  Wallet,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Truck,
  Building2,
  ChevronRight,
  Gauge,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '../../services/api';
import { MetricasFlota, CargaCombustible, SolicitudAutorizacion, SaldoEstacion } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface AdminDashboardProps {
  setVistaActiva: (v: string) => void;
}

const COLORES_GRAFICO_MESES = [
  '#2563EB', // Azul corporativo
  '#059669', // Esmeralda vibrante
  '#D97706', // Ámbar intenso
  '#7C3AED', // Violeta dinámico
  '#0284C7', // Azul cian
  '#E11D48', // Carmesí
];

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
    <div className="w-full max-w-7xl mx-auto space-y-4 pb-12">
      {/* 1. Encabezado Ejecutivo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-1 gap-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Operaciones Centrales · Turno Activo
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Control de Flota y Combustible
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real · Conciliación de facturas · Odómetros certificados · Saldos prepago
          </p>
        </div>

        {/* Barra de Acciones Operativas */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setVistaActiva('admin-validacion')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
            <span>Auditar Cargas</span>
            {cargasPendientes.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-800 text-white rounded font-mono text-[10px] font-semibold">
                {cargasPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setVistaActiva('admin-saldos')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              bombasEnAlerta.length > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-slate-500" />
            <span>Saldos Bombas</span>
            {bombasEnAlerta.length > 0 && (
              <span className="font-mono text-[10px] font-bold text-amber-700">
                ({bombasEnAlerta.length})
              </span>
            )}
          </button>

          <button
            onClick={() => setVistaActiva('admin-solicitudes')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Tokens</span>
            {solicitudesPendientes.length > 0 && (
              <span className="px-1 py-0.2 bg-slate-100 text-slate-800 rounded font-mono text-[10px] font-semibold">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setVistaActiva('admin-reportes')}
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Reportes comparativos"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          <button
            onClick={cargarDashboard}
            disabled={cargando}
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Cuadrícula de Métricas Clave (KPIs Ejecutivos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Saldo en Estaciones */}
        <div
          onClick={() => setVistaActiva('admin-saldos')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-emerald-300 transition-colors cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Saldo en Bombas
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
              ₡{totalSaldoDisponible.toLocaleString('es-CR')}
            </div>
            <div className="flex items-center space-x-1.5 mt-1 text-[11px] text-slate-500">
              {bombasEnAlerta.length > 0 ? (
                <span className="text-amber-700 font-medium font-mono text-[10px]">
                  {bombasEnAlerta.length} bajo umbral
                </span>
              ) : (
                <span className="text-emerald-700 font-medium">Fondos óptimos</span>
              )}
              <span aria-hidden="true">·</span>
              <span>3 estaciones</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Recorrido Mensual */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Recorrido Mensual
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Gauge className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
              {metricas?.totalKmRecorridos
                ? Number(metricas.totalKmRecorridos).toLocaleString()
                : '14,850'}
              <span className="text-xs font-normal text-slate-500 ml-1 font-sans">km</span>
            </div>
            <div className="flex items-center space-x-1 mt-1 text-[11px] text-slate-500">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span className="text-emerald-700 font-medium">+8.2%</span>
              <span>vs mes anterior</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Inversión en Combustible */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Combustible Facturado
            </span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
              ₡{metricas?.gastoTotalCombustible
                ? Number(metricas.gastoTotalCombustible).toLocaleString()
                : '1,485,000'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {metricas?.totalLitrosCargados || 2150} L despachados
            </div>
          </div>
        </div>

        {/* KPI 4: Rendimiento Promedio */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Rendimiento Flota
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
              {metricas?.rendimientoPromedioFlotaKmL
                ? metricas.rendimientoPromedioFlotaKmL.toFixed(1)
                : '7.8'}
              <span className="text-xs font-normal text-slate-500 ml-1 font-sans">km/L</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Promedio ponderado en ruta
            </div>
          </div>
        </div>

        {/* KPI 5: Parque Vehicular */}
        <div
          onClick={() => setVistaActiva('admin-vehiculos')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-violet-300 transition-colors cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-500">
              Parque Vehicular
            </span>
            <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-600 border border-violet-200 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
              {metricas?.totalVehiculos || 19}
              <span className="text-xs font-normal text-slate-500 ml-1 font-sans">unidades</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>{metricas?.totalConductores || 6} conductores</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Panel de Análisis y Cola Operativa Inmediata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gráfico de Evolución de Consumo (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Evolución de Gasto y Recorrido
              </h2>
              <p className="text-xs text-slate-500">
                Historial semestral por ciclo de facturación
              </p>
            </div>

            {/* Segmented Control Sobrio */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md text-xs">
              <button
                onClick={() => setVistaGrafico('comparativa')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  vistaGrafico === 'comparativa'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gasto vs Km
              </button>
              <button
                onClick={() => setVistaGrafico('gasto')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  vistaGrafico === 'gasto'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Solo Gasto (₡)
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
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
                    tick={{ fontSize: 10, fill: '#475569' }}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k km`}
                    tickLine={false}
                    axisLine={false}
                  />
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '6px',
                    border: '1px solid #1E293B',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    padding: '8px 12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  }}
                  formatter={(value: any, name: any) => [
                    name === 'Gasto Combustible' || name === 'gasto'
                      ? `₡${Number(value).toLocaleString()} CRC`
                      : `${Number(value).toLocaleString()} km`,
                    name === 'Gasto Combustible' || name === 'gasto'
                      ? 'Inversión Combustible'
                      : 'Kilometraje',
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  iconType="square"
                />
                <Bar
                  yAxisId="left"
                  dataKey="gasto"
                  fill="#2563EB"
                  radius={[3, 3, 0, 0]}
                  name="Inversión Combustible (₡)"
                >
                  {vistaGrafico === 'gasto' &&
                    chartData.map((_, index) => (
                      <Cell
                        key={`cell-gasto-${index}`}
                        fill={COLORES_GRAFICO_MESES[index % COLORES_GRAFICO_MESES.length]}
                      />
                    ))}
                </Bar>
                {vistaGrafico === 'comparativa' && (
                  <Bar
                    yAxisId="right"
                    dataKey="km"
                    fill="#10B981"
                    radius={[3, 3, 0, 0]}
                    name="Recorrido (km)"
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cola de Atención Inmediata (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
                <button
                  onClick={() => setTabCola('cargas')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    tabCola === 'cargas'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Auditorías ({cargasPendientes.length})
                </button>
                <button
                  onClick={() => setTabCola('solicitudes')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    tabCola === 'solicitudes'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tokens ({solicitudesPendientes.length})
                </button>
              </div>

              <span className="text-[10px] font-mono text-slate-400 uppercase font-medium">
                Prioridad
              </span>
            </div>

            {/* Cola: Auditorías */}
            {tabCola === 'cargas' && (
              <div className="divide-y divide-slate-100 mt-1">
                {cargasPendientes.length === 0 ? (
                  <div className="py-10 text-center space-y-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-800">
                      Sin auditorías pendientes
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Todas las facturas y odómetros han sido certificados.
                    </p>
                  </div>
                ) : (
                  cargasPendientes.slice(0, 4).map((carga) => (
                    <div
                      key={carga.id}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1.5 rounded transition-colors group cursor-pointer"
                      onClick={() => setVistaActiva('admin-validacion')}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-medium text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {carga.vehiculoPlaca || 'FLOTA'}
                          </span>
                          <span className="text-xs font-medium text-slate-900 truncate">
                            {carga.conductorNombre || 'Conductor'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono font-medium text-slate-700">{carga.litros} L</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">₡{Number(carga.totalPagado).toLocaleString()}</span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{carga.estacion}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {carga.estadoValidacion === 'REQUIERE_REVISION' ? (
                          <span className="text-[10px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Revisión
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            Pendiente
                          </span>
                        )}
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Cola: Solicitudes */}
            {tabCola === 'solicitudes' && (
              <div className="divide-y divide-slate-100 mt-1">
                {solicitudesPendientes.length === 0 ? (
                  <div className="py-10 text-center space-y-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                    <p className="text-xs font-medium text-slate-800">
                      Sin solicitudes en espera
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Todos los tokens de carga han sido autorizados.
                    </p>
                  </div>
                ) : (
                  solicitudesPendientes.slice(0, 4).map((sol) => (
                    <div
                      key={sol.id}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1.5 rounded transition-colors group cursor-pointer"
                      onClick={() => setVistaActiva('admin-solicitudes')}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-medium text-slate-800 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {sol.vehiculoPlaca || 'UNIDAD'}
                          </span>
                          <span className="text-xs font-medium text-slate-900 truncate">
                            {sol.conductorNombre}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono font-medium text-emerald-700">
                            {sol.litrosSolicitados} Litros
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{sol.estacionSugerida || 'Bomba sugerida'}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                          Emitir
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Enlace al pie */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              {tabCola === 'cargas'
                ? `${cargasPendientes.length} cargas por auditar`
                : `${solicitudesPendientes.length} solicitudes en espera`}
            </span>
            <button
              onClick={() =>
                setVistaActiva(
                  tabCola === 'cargas' ? 'admin-validacion' : 'admin-solicitudes'
                )
              }
              className="text-xs font-medium text-slate-900 hover:underline flex items-center space-x-1"
            >
              <span>Ver Módulo Completo</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
