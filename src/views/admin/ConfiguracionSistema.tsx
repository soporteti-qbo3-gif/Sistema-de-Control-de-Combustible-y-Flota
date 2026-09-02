/**
 * Pantalla de Configuración del Sistema (Días Laborables, Feriados y Estaciones de Servicio)
 * Diseño compacto sin scroll excesivo, chips interactivos y edición en línea
 */

import React, { useState } from 'react';
import {
  Settings,
  Calendar as CalendarIcon,
  Fuel,
  Check,
  Plus,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface Estacion {
  id: string;
  nombre: string;
  ubicacion: string;
  tipoCombustible: string[];
  activa: boolean;
}

export const ConfiguracionSistema: React.FC = () => {
  // 1. Días laborables de la empresa
  const [diasLaborables, setDiasLaborables] = useState<string[]>([
    'LUN',
    'MAR',
    'MIE',
    'JUE',
    'VIE',
    'SAB',
  ]);

  const todosDias = [
    { id: 'LUN', label: 'Lunes' },
    { id: 'MAR', label: 'Martes' },
    { id: 'MIE', label: 'Miércoles' },
    { id: 'JUE', label: 'Jueves' },
    { id: 'VIE', label: 'Viernes' },
    { id: 'SAB', label: 'Sábado' },
    { id: 'DOM', label: 'Domingo' },
  ];

  const toggleDia = (id: string) => {
    if (diasLaborables.includes(id)) {
      setDiasLaborables(diasLaborables.filter((d) => d !== id));
    } else {
      setDiasLaborables([...diasLaborables, id]);
    }
  };

  // 2. Feriados Oficiales Costa Rica 2025/2026
  const [feriados, setFeriados] = useState<
    { fecha: string; nombre: string; deLey: boolean }[]
  >([
    { fecha: '2025-01-01', nombre: 'Año Nuevo', deLey: true },
    { fecha: '2025-04-11', nombre: 'Día de Juan Santamaría', deLey: true },
    { fecha: '2025-04-17', nombre: 'Jueves Santo', deLey: true },
    { fecha: '2025-04-18', nombre: 'Viernes Santo', deLey: true },
    { fecha: '2025-05-01', nombre: 'Día del Trabajador', deLey: true },
    { fecha: '2025-07-25', nombre: 'Anexión del Partido de Nicoya', deLey: true },
    { fecha: '2025-08-02', nombre: 'Día de la Virgen de los Ángeles', deLey: false },
    { fecha: '2025-08-15', nombre: 'Día de la Madre', deLey: true },
    { fecha: '2025-09-15', nombre: 'Día de la Independencia', deLey: true },
    { fecha: '2025-12-01', nombre: 'Abolición del Ejército', deLey: true },
    { fecha: '2025-12-25', nombre: 'Navidad', deLey: true },
  ]);

  const [nuevoFeriadoFecha, setNuevoFeriadoFecha] = useState('');
  const [nuevoFeriadoNombre, setNuevoFeriadoNombre] = useState('');

  const agregarFeriado = () => {
    if (!nuevoFeriadoFecha || !nuevoFeriadoNombre) return;
    setFeriados([
      ...feriados,
      { fecha: nuevoFeriadoFecha, nombre: nuevoFeriadoNombre, deLey: true },
    ]);
    setNuevoFeriadoFecha('');
    setNuevoFeriadoNombre('');
  };

  const eliminarFeriado = (index: number) => {
    setFeriados(feriados.filter((_, i) => i !== index));
  };

  // 3. Estaciones de Servicio Autorizadas
  const [estaciones, setEstaciones] = useState<Estacion[]>([
    {
      id: '1',
      nombre: 'Bomba Nosara Central',
      ubicacion: 'Nosara, Guanacaste',
      tipoCombustible: ['Diesel', 'Gasolina Regular', 'Gasolina Premium'],
      activa: true,
    },
    {
      id: '2',
      nombre: 'Delta Garza',
      ubicacion: 'Garza, Nicoya',
      tipoCombustible: ['Diesel', 'Gasolina Regular'],
      activa: true,
    },
    {
      id: '3',
      nombre: 'JSM Nicoya',
      ubicacion: 'Nicoya Centro',
      tipoCombustible: ['Diesel', 'Gasolina Regular', 'Gasolina Premium', 'Gas LP'],
      activa: true,
    },
    {
      id: '4',
      nombre: 'Servicentro Samara Beach',
      ubicacion: 'Sámara, Guanacaste',
      tipoCombustible: ['Diesel', 'Gasolina Regular'],
      activa: false,
    },
  ]);

  const [nuevaEstacion, setNuevaEstacion] = useState({
    nombre: '',
    ubicacion: '',
    tipoCombustible: 'Diesel',
  });

  const toggleEstacionActiva = (id: string) => {
    setEstaciones(
      estaciones.map((e) => (e.id === id ? { ...e, activa: !e.activa } : e))
    );
  };

  const agregarEstacion = () => {
    if (!nuevaEstacion.nombre || !nuevaEstacion.ubicacion) return;
    setEstaciones([
      ...estaciones,
      {
        id: String(Date.now()),
        nombre: nuevaEstacion.nombre,
        ubicacion: nuevaEstacion.ubicacion,
        tipoCombustible: [nuevaEstacion.tipoCombustible],
        activa: true,
      },
    ]);
    setNuevaEstacion({ nombre: '', ubicacion: '', tipoCombustible: 'Diesel' });
  };

  return (
    <div className="space-y-4 w-full max-w-6xl mx-auto pb-16">
      {/* Header Compacto */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">
              Parámetros y Configuración Operativa
            </h1>
            <p className="text-xs text-slate-500">
              Días laborales, calendario de feriados oficiales y estaciones autorizadas en Costa Rica
            </p>
          </div>
        </div>
      </div>

      {/* Grid de 3 Módulos de Ajuste Compactos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Módulo 1: Días Laborables */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-100">
              <Clock className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Jornadas y Días Laborables</h2>
            </div>
            <p className="text-xs text-slate-500 mt-2 mb-3">
              Define los días hábiles para el cálculo automático de turnos y validación de consumos:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {todosDias.map((d) => {
                const activo = diasLaborables.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDia(d.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activo
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {activo && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">Estado actual:</span> {diasLaborables.length} de 7 días seleccionados para monitoreo de rutas activas.
          </div>
        </div>

        {/* Módulo 2: Calendario Feriados */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Feriados y No Laborables</h2>
            </div>
            <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
              {feriados.length} Registrados
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {feriados.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-md bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{f.nombre}</span>
                  <span className="text-[10px] font-mono text-slate-500">{f.fecha}</span>
                </div>
                <button
                  onClick={() => eliminarFeriado(i)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Eliminar feriado"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Formulario Compacto para Agregar Feriado */}
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
            <input
              type="date"
              value={nuevoFeriadoFecha}
              onChange={(e) => setNuevoFeriadoFecha(e.target.value)}
              className="px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400"
            />
            <input
              type="text"
              placeholder="Nombre feriado..."
              value={nuevoFeriadoNombre}
              onChange={(e) => setNuevoFeriadoNombre(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400"
            />
            <button
              onClick={agregarFeriado}
              className="p-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              title="Agregar feriado"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Módulo 3: Estaciones de Combustible Autorizadas */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Fuel className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Estaciones de Servicio</h2>
            </div>
            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
              {estaciones.filter((e) => e.activa).length} Activas
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {estaciones.map((e) => (
              <div
                key={e.id}
                className={`flex items-center justify-between p-2 rounded-md border text-xs transition-colors ${
                  e.activa
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold text-slate-900 truncate">{e.nombre}</span>
                    {e.activa ? (
                      <span className="text-[9px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Activa
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        Pausada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{e.ubicacion}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleEstacionActiva(e.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    e.activa
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  {e.activa ? 'Pausar' : 'Activar'}
                </button>
              </div>
            ))}
          </div>

          {/* Formulario Rápido Estación */}
          <div className="pt-2 border-t border-slate-100 flex items-center space-x-2">
            <input
              type="text"
              placeholder="Nueva Bomba"
              value={nuevaEstacion.nombre}
              onChange={(e) =>
                setNuevaEstacion({ ...nuevaEstacion, nombre: e.target.value })
              }
              className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400"
            />
            <input
              type="text"
              placeholder="Ubicación"
              value={nuevaEstacion.ubicacion}
              onChange={(e) =>
                setNuevaEstacion({ ...nuevaEstacion, ubicacion: e.target.value })
              }
              className="w-24 px-2 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400"
            />
            <button
              onClick={agregarEstacion}
              className="p-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              title="Agregar estación"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
