/**
 * Módulo de Reportes Ejecutivos, Comparativas de Rendimiento y Exportación (Admin)
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Award,
  AlertTriangle,
  Fuel,
  Truck,
  DollarSign,
  Layers,
} from 'lucide-react';
import { api } from '../../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const ReportesComparativas: React.FC = () => {
  const [datosReporte, setDatosReporte] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [metricaGrafico, setMetricaGrafico] = useState<'rendimiento' | 'gasto' | 'kilometros'>('rendimiento');

  const PALETA_VEHICULOS = [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Ámbar
    '#8B5CF6', // Violeta
    '#EC4899', // Rosa
    '#06B6D4', // Cyan
    '#F97316', // Naranja
    '#6366F1', // Índigo
    '#14B8A6', // Teal
    '#84CC16', // Lima
  ];

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const data = await api.getDashboard();
        setDatosReporte(data);
      } catch (e) {
        console.error('Error cargando reportes:', e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const exportarCSV = () => {
    if (!datosReporte?.rankingEficiencia) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Placa,Modelo,Rendimiento Real (km/L),Rendimiento Teorico (km/L),Costo Total (CRC),Km Totales\n';

    datosReporte.rankingEficiencia.forEach((item: any) => {
      csvContent += `${item.placa},"${item.modelo}",${item.rendimientoReal},${item.rendimientoTeorico},${item.gastoTotal},${item.kmTotales}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_flota_combustible_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarJSON = () => {
    if (!datosReporte) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datosReporte, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonStr);
    link.setAttribute('download', `datos_flota_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (cargando) {
    return <div className="p-8 text-center text-slate-500 text-xs">Generando comparativas y reportes...</div>;
  }

  const ranking = datosReporte?.rankingEficiencia || [];

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header con Botones de Exportación */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">Reportes y Comparativas de Flota</h1>
            <p className="text-xs text-slate-500">
              Auditoría de rendimientos reales vs teóricos, análisis de desvíos y exportación de datos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportarCSV}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Descargar CSV / Excel</span>
          </button>

          <button
            onClick={exportarJSON}
            className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Gráficos Comparativos: Rendimiento y Distribución de Inversión */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gráfico Comparativo: Rendimiento Real vs Teórico por Vehículo con Colores */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {metricaGrafico === 'rendimiento' && 'Comparativa de Rendimiento por Unidad (km/L)'}
                {metricaGrafico === 'gasto' && 'Gasto Total de Combustible por Unidad (CRC ₡)'}
                {metricaGrafico === 'kilometros' && 'Kilómetros / Horas Recorridas por Unidad'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {metricaGrafico === 'rendimiento' && 'Rendimiento estándar teórico (Azul) vs Real auditado (Verde / Ámbar / Rojo)'}
                {metricaGrafico === 'gasto' && 'Inversión monetaria acumulada en combustible por placa'}
                {metricaGrafico === 'kilometros' && 'Distancia total acumulada según odómetro'}
              </p>
            </div>

            {/* Selector de Métrica */}
            <div className="bg-slate-100 p-0.5 rounded-md flex items-center border border-slate-200 text-[11px] font-medium self-start sm:self-auto">
              <button
                onClick={() => setMetricaGrafico('rendimiento')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  metricaGrafico === 'rendimiento'
                    ? 'bg-white text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rendimiento (km/L)
              </button>
              <button
                onClick={() => setMetricaGrafico('gasto')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  metricaGrafico === 'gasto'
                    ? 'bg-white text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gasto (₡)
              </button>
              <button
                onClick={() => setMetricaGrafico('kilometros')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  metricaGrafico === 'kilometros'
                    ? 'bg-white text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kilometraje (km)
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {metricaGrafico === 'rendimiento' ? (
                <BarChart data={ranking} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="placa" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} unit=" km/L" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    formatter={(val: any) => [`${val} km/L`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} iconType="circle" />
                  <Bar
                    dataKey="rendimientoTeorico"
                    name="Rendimiento Teórico"
                    fill="#475569"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="rendimientoReal"
                    name="Rendimiento Real"
                    radius={[4, 4, 0, 0]}
                  >
                    {ranking.map((entry: any, index: number) => {
                      const desvio =
                        entry.rendimientoTeorico > 0
                          ? ((entry.rendimientoReal - entry.rendimientoTeorico) /
                              entry.rendimientoTeorico) *
                            100
                          : 0;
                      const color =
                        desvio >= 0
                          ? '#059669'
                          : desvio >= -20
                          ? '#d97706'
                          : '#e11d48';
                      return <Cell key={`rend-cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              ) : metricaGrafico === 'gasto' ? (
                <BarChart data={ranking} margin={{ top: 15, right: 15, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="placa" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}k`}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    formatter={(val: any) => [`₡${Number(val).toLocaleString('es-CR')} CRC`, 'Gasto Total']}
                  />
                  <Bar dataKey="gastoTotal" name="Gasto Total (₡)" radius={[4, 4, 0, 0]}>
                    {ranking.map((_entry: any, index: number) => (
                      <Cell
                        key={`gasto-cell-${index}`}
                        fill={PALETA_VEHICULOS[index % PALETA_VEHICULOS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart data={ranking} margin={{ top: 15, right: 15, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="placa" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} unit=" km" tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '6px 10px',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('es-CR')} km`, 'Kilometraje']}
                  />
                  <Bar dataKey="kmTotales" name="Kilómetros Totales" radius={[4, 4, 0, 0]}>
                    {ranking.map((_entry: any, index: number) => (
                      <Cell
                        key={`km-cell-${index}`}
                        fill={PALETA_VEHICULOS[(index + 3) % PALETA_VEHICULOS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Leyenda de Auditoría para Gráfico de Rendimiento */}
          {metricaGrafico === 'rendimiento' && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] pt-1 text-slate-600">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#475569] inline-block" />
                <span>Teórico Estándar</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#059669] inline-block" />
                <span>Real Óptimo (≥ Estándar)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#d97706] inline-block" />
                <span>Variación Leve (-1% a -20%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#e11d48] inline-block" />
                <span>Desvío Crítico (&lt; -20%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Gráfico 2: Distribución de Gasto por Unidad */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Distribución de Gasto</h2>
            <p className="text-[11px] text-slate-500">Inversión en combustible por vehículo</p>
          </div>

          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ranking}
                  dataKey="gastoTotal"
                  nameKey="placa"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={68}
                  paddingAngle={3}
                >
                  {ranking.map((_entry: any, index: number) => {
                    const colores = ['#059669', '#0284c7', '#d97706', '#7c3aed', '#db2777', '#0d9488'];
                    return <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '6px 10px',
                  }}
                  formatter={(val: any) => [`₡${Number(val).toLocaleString('es-CR')} CRC`, 'Inversión']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t border-slate-100">
            {ranking.slice(0, 4).map((r: any, idx: number) => {
              const colores = ['bg-emerald-600', 'bg-sky-600', 'bg-amber-600', 'bg-violet-600'];
              return (
                <div key={r.placa} className="flex items-center space-x-1.5 truncate">
                  <div className={`w-2 h-2 rounded-full ${colores[idx % colores.length]} flex-shrink-0`} />
                  <span className="font-mono text-slate-700 truncate font-medium">{r.placa}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla de Ranking y Tabla de Desviaciones */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">Tabla Maestra de Eficiencia y Gasto por Unidad</h2>
          </div>
          <span className="text-xs text-slate-500">Total {ranking.length} unidades evaluadas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-3.5 py-2.5 font-medium">Placa / Modelo</th>
                <th className="px-3.5 py-2.5 font-medium">Rendimiento Real</th>
                <th className="px-3.5 py-2.5 font-medium">Rendimiento Teórico</th>
                <th className="px-3.5 py-2.5 font-medium">Desviación %</th>
                <th className="px-3.5 py-2.5 font-medium">Km Recorridos</th>
                <th className="px-3.5 py-2.5 font-medium">Gasto Total</th>
                <th className="px-3.5 py-2.5 font-medium">Estado Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ranking.map((row: any, idx: number) => {
                const desvio =
                  row.rendimientoTeorico > 0
                    ? ((row.rendimientoReal - row.rendimientoTeorico) / row.rendimientoTeorico) * 100
                    : 0;
                const alerta = desvio < -20;

                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-900">{row.placa}</div>
                      <div className="text-[10px] text-slate-500">{row.modelo}</div>
                    </td>

                    <td className="px-3.5 py-2.5 font-mono font-semibold text-emerald-700">
                      {row.rendimientoReal} km/L
                    </td>

                    <td className="px-3.5 py-2.5 font-mono text-slate-500">
                      {row.rendimientoTeorico} km/L
                    </td>

                    <td className="px-3.5 py-2.5">
                      <span
                        className={`font-mono font-semibold ${
                          desvio >= 0
                            ? 'text-emerald-700'
                            : desvio >= -15
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {desvio > 0 ? `+${desvio.toFixed(1)}%` : `${desvio.toFixed(1)}%`}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 font-mono text-slate-700">
                      {row.kmTotales.toLocaleString('es-CR')} km
                    </td>

                    <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-900">
                      ₡{Math.round(row.gastoTotal).toLocaleString('es-CR')} CRC
                    </td>

                    <td className="px-3.5 py-2.5">
                      {alerta ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 flex items-center w-max">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Revisar Desvío
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Rango Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
