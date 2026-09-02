/**
 * Ficha Técnica y Estado de la Unidad Asignada al Conductor
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Gauge,
  Fuel,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Camera,
  Upload,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Vehiculo, Mantenimiento } from '../../types';

export const MiVehiculo: React.FC = () => {
  const { usuario } = useAuth();
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [fotoModalOpen, setFotoModalOpen] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const vehs = await api.getVehiculos();
        const miVeh = vehs.find((v) => v.id === usuario?.vehiculoAsignadoId) || vehs[0];
        setVehiculo(miVeh || null);

        if (miVeh) {
          const mants = await api.getMantenimientos(miVeh.id);
          setMantenimientos(mants);
        }
      } catch (e) {
        console.error('Error cargando ficha del vehículo:', e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [usuario]);

  const handleSubirFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !vehiculo) return;

    setSubiendoFoto(true);
    setMensajeExito(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const vehActualizado = await api.actualizarFotoVehiculo(vehiculo.id, base64);
        setVehiculo(vehActualizado);
        setMensajeExito('¡Fotografía de la unidad actualizada correctamente!');
        setTimeout(() => setMensajeExito(null), 4000);
      } catch (err: any) {
        alert(`Error al guardar la fotografía: ${err.message}`);
      } finally {
        setSubiendoFoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (cargando) {
    return <div className="p-12 text-center text-slate-500 text-xs font-medium">Cargando ficha del vehículo...</div>;
  }

  if (!vehiculo) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
        No tienes una unidad asignada actualmente.
      </div>
    );
  }

  const kmFaltantesMantenimiento = (vehiculo.proximoMantenimientoKm || 0) - vehiculo.odometroActual;
  const mantenimientoProximo = kmFaltantesMantenimiento <= 1000;

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Notificación de éxito */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded-lg flex items-center space-x-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Hero Card: Información Principal y Fotografía Original del Carro */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Imagen de Portada / Fotografía Real */}
        <div className="relative h-44 sm:h-56 bg-slate-900 overflow-hidden flex items-center justify-center group">
          {vehiculo.imagenUrl ? (
            <img
              src={vehiculo.imagenUrl}
              alt={`${vehiculo.marca} ${vehiculo.modelo}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setFotoModalOpen(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-1.5 text-slate-600" />
              <span className="text-xs">Sin fotografía original registrada</span>
            </div>
          )}

          {/* Badge y Botón para tomar o subir foto */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-4 pointer-events-none">
            <div className="pointer-events-auto">
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-medium border border-white/10 mb-1">
                <span>Fotografía Original</span>
              </span>
              <h1 className="text-lg sm:text-xl font-semibold text-white leading-tight">
                {vehiculo.marca} {vehiculo.modelo}
              </h1>
              <p className="text-xs text-slate-300">
                Año {vehiculo.anio} • {vehiculo.tipoVehiculo || 'Vehículo'} • Placa:{' '}
                <span className="font-mono font-semibold text-white">{vehiculo.placa}</span>
              </p>
            </div>

            <div className="flex items-center space-x-1.5 pointer-events-auto">
              {vehiculo.imagenUrl && (
                <button
                  onClick={() => setFotoModalOpen(true)}
                  className="p-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white transition-colors"
                  title="Ver en tamaño completo"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              <label className="cursor-pointer bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-md font-medium text-xs flex items-center space-x-1.5 transition-colors">
                <Camera className="w-3.5 h-3.5 text-slate-700" />
                <span>{subiendoFoto ? 'Subiendo...' : 'Subir Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={subiendoFoto}
                  className="hidden"
                  onChange={handleSubirFoto}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Resumen Bar */}
        <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/50 text-xs">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            {vehiculo.numeroSerie && (
              <span className="font-mono font-medium bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                Serie #{vehiculo.numeroSerie}
              </span>
            )}
            <span className="text-slate-600">
              Ubicación: <strong className="text-slate-900">{vehiculo.ubicacion || 'Sede Central'}</strong>
            </span>
            <span className="text-slate-600">
              Estado: <strong className="text-emerald-700">{vehiculo.estado}</strong>
            </span>
          </div>

          {mantenimientoProximo && (
            <div className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md flex items-center space-x-1.5 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Servicio preventivo próximo ({kmFaltantesMantenimiento} km)</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Especificaciones Técnicas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center">
            <Gauge className="w-3.5 h-3.5 mr-1 text-slate-500" />
            {vehiculo.tipoControlMedicion === 'HORAS' || vehiculo.controlaKilometraje === 'Por horas'
              ? 'Horómetro Actual'
              : 'Odómetro Actual'}
          </span>
          <p className="text-base font-mono font-semibold text-slate-900">
            {vehiculo.odometroActual.toLocaleString('es-CR')}{' '}
            <span className="text-xs font-sans font-normal text-slate-500">
              {vehiculo.tipoControlMedicion === 'HORAS' || vehiculo.controlaKilometraje === 'Por horas' ? 'hrs' : 'km'}
            </span>
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">
            Inicial: {vehiculo.odometroInicial.toLocaleString('es-CR')}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center">
            <Fuel className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Capacidad Tanque
          </span>
          <p className="text-base font-mono font-semibold text-slate-900">{vehiculo.capacidadTanqueLitros} L</p>
          <span className="text-[10px] text-slate-400 block">{vehiculo.tipoCombustible}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Rendimiento Teórico
          </span>
          <p className="text-base font-mono font-semibold text-emerald-700">{vehiculo.rendimientoTeoricoKmL} km/L</p>
          <span className="text-[10px] text-slate-400 block">Parámetro de fábrica</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-0.5">
          <span className="text-[11px] font-medium text-slate-500 flex items-center">
            <Wrench className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Próximo Servicio
          </span>
          <p className="text-base font-mono font-semibold text-slate-900">
            {vehiculo.proximoMantenimientoKm?.toLocaleString('es-CR')} km
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">En {kmFaltantesMantenimiento.toLocaleString('es-CR')} km</span>
        </div>
      </div>

      {/* Bitácora de Mantenimientos Recientes de la Unidad */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2.5">
          <Wrench className="w-4 h-4 text-slate-700" />
          <h2 className="text-sm font-semibold text-slate-900">Historial de Mantenimientos Realizados</h2>
        </div>

        {mantenimientos.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            No hay mantenimientos registrados aún para esta unidad.
          </p>
        ) : (
          <div className="space-y-2">
            {mantenimientos.map((m) => (
              <div
                key={m.id}
                className="bg-slate-50/60 border border-slate-200 rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-900">{m.tipo}</span>
                    <span className="text-[10px] font-mono bg-white text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                      {m.odometroKm.toLocaleString('es-CR')} km
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{m.descripcion}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Taller: <span className="text-slate-700">{m.taller}</span> • Fecha: {new Date(m.fecha).toLocaleDateString('es-CR')}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono font-medium text-slate-900 block">₡{Math.round(m.costo).toLocaleString('es-CR')} CRC</span>
                  <span className="text-[10px] text-slate-400">Registrado por: {m.registradoPor}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL FOTOGRAFÍA EN ALTA RESOLUCIÓN */}
      {fotoModalOpen && vehiculo.imagenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
          onClick={() => setFotoModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-semibold text-slate-900">
                  Fotografía Original: {vehiculo.marca} {vehiculo.modelo} ({vehiculo.placa})
                </h3>
              </div>
              <button
                onClick={() => setFotoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={vehiculo.imagenUrl}
                alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                className="w-full max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">Unidad registrada en el sistema de flota</span>
              <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-md font-medium text-xs flex items-center space-x-1.5 transition-colors">
                <Camera className="w-3.5 h-3.5 text-slate-300" />
                <span>{subiendoFoto ? 'Subiendo...' : 'Cambiar Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={subiendoFoto}
                  className="hidden"
                  onChange={handleSubirFoto}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
