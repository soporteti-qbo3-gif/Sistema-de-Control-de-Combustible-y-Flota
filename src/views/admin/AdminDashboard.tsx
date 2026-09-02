/**
 * Dashboard Ejecutivo Compacto para Administrador de Flota
 * - Grid de 4 tarjetas métricas (2 cols en móvil, 4 en desktop):
 *   1. Kilómetros totales del mes
 *   2. Costo total del mes (CRC ₡)
 *   3. Rendimiento promedio (km/L)
 *   4. Vehículos activos
 * - Gráfica compacta ajustada al ancho del contenedor
 * - Accesos rápidos con botones icono a validación y reportes
 * - Cero scroll vertical en desktop, mínimo en móvil
 */

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  DollarSign,
  Fuel,
  Gauge,
  AlertTriangle,
  FileCheck2,
  Send,
  Truck,
  Users,
  Wrench,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  BarChart3,
  Settings,
  Wallet,
  PlusCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { MetricasFlota, CargaCombustible, SolicitudAutorizacion, SaldoEstacion } from '../../types';
import { LiquidButton } from '../../components/ui/LiquidButton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';

const COLORES_BARRAS = [
  '#475569', // slate-600
  '#0284c7', // sky-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0d9488', // teal-600
  '#4f46e5', // indigo-600
  '#64748b', // slate-500
];

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

  const [tipoGrafico, setTipoGrafico] = useState<'multicolor' | 'comparativa'>('multicolor');

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
    <div className="space-y-3 w-full max-w-7xl mx-auto pb-16 lg:pb-4">
      {/* Header Compacto & Accesos Rápidos con Botones Icono */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight">
                Panel de Control de Flota
              </h1>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                En Vivo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Auditoría de combustible, odómetros, vales y saldos prepago
            </p>
          </div>
        </div>

        {/* Botones Icono de Acceso Rápido con Liquid Ripple & Feedback */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <LiquidButton
            id="btn-dash-validar"
            variant="primary"
            size="sm"
            onClick={() => setVistaActiva('admin-validacion')}
            title="Validar comprobantes y facturas"
            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Validar ({cargasPendientes.length})
          </LiquidButton>

          <LiquidButton
            id="btn-dash-saldos"
            variant="secondary"
            size="sm"
            onClick={() => setVistaActiva('admin-saldos')}
            className="border-emerald-200 text-emerald-900 bg-emerald-50 hover:bg-emerald-100"
            title="Gestión de saldos prepago y caja chica"
            icon={<Wallet className="w-3.5 h-3.5 text-emerald-700" />}
          >
            Saldos ({bombasEnAlerta.length > 0 ? `${bombasEnAlerta.length} Alertas` : 'OK'})
          </LiquidButton>

          <LiquidButton
            id="btn-dash-solicitudes"
            variant="ghost"
            size="sm"
            onClick={() => setVistaActiva('admin-solicitudes')}
            className="border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800"
            title="Solicitudes de autorización"
            icon={<KeyRound className="w-3.5 h-3.5 text-amber-600" />}
          >
            Tokens ({solicitudesPendientes.length})
          </LiquidButton>

          <button
            onClick={() => setVistaActiva('admin-reportes')}
            className="p-1.5 rounded-md bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
            title="Reportes y Comparativas"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner Resumen de Saldos Prepago y Alertas */}
      <div className="bg-slate-900 text-white rounded-lg p-3 sm:p-3.5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                Saldo Disponible en Bombas
              </span>
              {bombasEnAlerta.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {bombasEnAlerta.length} bajo umbral
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Fondos Óptimos
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg font-bold font-mono text-emerald-400 mt-0.5">
              ₡{totalSaldoDisponible.toLocaleString('es-CR')} CRC
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setVistaActiva('admin-saldos')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Gestionar y Depositar</span>
          </button>
        </div>
      </div>

      {/* Grid de 4 Tarjetas Métricas Clave (2 columnas en móvil, 4 en desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* KPI 1: Kilómetros / Horas Totales del Mes */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Km Recorridos Mes</span>
            <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-600">
              <Gauge className="w-3 h-3" />
            </div>
          </div>
          <div>
            <span className="text-lg font-mono font-bold text-slate-900">
              {metricas?.totalKmRecorridos
                ? Number(metricas.totalKmRecorridos).toLocaleString()
                : '14,850'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 ml-1">km</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
            +8.2% vs mes anterior
          </span>
        </div>

        {/* KPI 2: Costo Total del Mes */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Gasto Combustible</span>
            <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3 h-3" />
            </div>
          </div>
          <div>
            <span className="text-lg font-mono font-bold text-slate-900">
              ₡{metricas?.gastoTotalCombustible
                ? Number(metricas.gastoTotalCombustible).toLocaleString()
                : '1,485,000'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {metricas?.totalLitrosCargados || 2150} Litros consumidos
          </span>
        </div>

        {/* KPI 3: Rendimiento Promedio */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Rendimiento Promedio</span>
            <div className="w-5 h-5 rounded bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-3 h-3" />
            </div>
          </div>
          <div>
            <span className="text-lg font-mono font-bold text-slate-900">
              {metricas?.rendimientoPromedioFlotaKmL
                ? metricas.rendimientoPromedioFlotaKmL.toFixed(1)
                : '7.8'}
            </span>
            <span className="text-[11px] font-medium text-slate-500 ml-1">km/L</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Eficiencia óptima
          </span>
        </div>

        {/* KPI 4: Vehículos Activos */}
        <div
          onClick={() => setVistaActiva('admin-vehiculos')}
          className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between cursor-pointer hover:border-slate-400 transition-colors shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Vehículos Activos</span>
            <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-slate-600">
              <Truck className="w-3 h-3" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-mono font-bold text-slate-900">
              {metricas?.totalVehiculos || 19}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">unidades activas</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {metricas?.totalConductores || 6} conductores asignados
          </span>
        </div>
      </div>

      {/* Gráfica Compacta de Barras (Evolución de Combustible y Kilómetros con Colores) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2.5 gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-900 leading-tight">
                Evolución Mensual de Consumo y Recorrido
              </h2>
              <p className="text-[10px] text-slate-500">
                Gasto en combustible (₡) y kilometraje por período
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="bg-slate-100 p-0.5 rounded-md flex items-center border border-slate-200 text-[11px] font-medium">
              <button
                onClick={() => setTipoGrafico('multicolor')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  tipoGrafico === 'multicolor'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gasto por Mes (₡)
              </button>
              <button
                onClick={() => setTipoGrafico('comparativa')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  tipoGrafico === 'comparativa'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gasto vs Recorrido
              </button>
            </div>
          </div>
        </div>

        <div className="h-48 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#64748B', fontWeight: 600 }} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
                tickLine={false}
              />
              {tipoGrafico === 'comparativa' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#059669' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k km`}
                  tickLine={false}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '6px 10px',
                }}
                formatter={(value: any, name: any) => [
                  name === 'gasto' || name === 'Gasto Combustible'
                    ? `₡${Number(value).toLocaleString()} CRC`
                    : `${Number(value).toLocaleString()} km`,
                  name === 'gasto' || name === 'Gasto Combustible' ? 'Gasto Combustible' : 'Recorrido',
                ]}
              />
              {tipoGrafico === 'comparativa' ? (
                <>
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                    iconType="circle"
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="gasto"
                    fill="#475569"
                    radius={[4, 4, 0, 0]}
                    name="Gasto Combustible (₡)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="km"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                    name="Recorrido (km)"
                  />
                </>
              ) : (
                <Bar
                  yAxisId="left"
                  dataKey="gasto"
                  radius={[4, 4, 0, 0]}
                  name="Gasto Combustible"
                >
                  {chartData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORES_BARRAS[index % COLORES_BARRAS.length]}
                    />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Indicadores de Paleta de Colores */}
        {tipoGrafico === 'multicolor' && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-slate-100 mt-1.5">
            {chartData.map((d: any, idx: number) => (
              <div key={d.mes} className="flex items-center space-x-1.5 text-[10px] text-slate-600 font-medium">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: COLORES_BARRAS[idx % COLORES_BARRAS.length] }}
                />
                <span>{d.mes}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
