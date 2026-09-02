/**
 * Pantalla Principal de Conductor (Mobile-First PWA)
 * Optimizado para pantallas de 360px sin scroll vertical excesivo.
 * Resumen ultra-compacto de unidad, odómetro, costo/rendimiento y 2 botones de acción rápida.
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Fuel,
  Send,
  Camera,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Gauge,
  DollarSign,
  TrendingUp,
  FilePlus,
  KeyRound,
  Droplets,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Vehiculo, SolicitudAutorizacion, CargaCombustible } from '../../types';
import { SolicitarCargaModal } from './SolicitarCargaModal';
import { UserAvatar } from '../../components/UserAvatar';
import { LiquidButton } from '../../components/ui/LiquidButton';

interface ConductorHomeProps {
  setVistaActiva: (v: string) => void;
}

export const ConductorHome: React.FC<ConductorHomeProps> = ({ setVistaActiva }) => {
  const { usuario } = useAuth();
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudAutorizacion[]>([]);
  const [ultimaCarga, setUltimaCarga] = useState<CargaCombustible | null>(null);
  const [modalSolicitarOpen, setModalSolicitarOpen] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [vehiculosData, solData, cargasData] = await Promise.all([
        api.getVehiculos(),
        api.getSolicitudes(),
        api.getCargas(),
      ]);

      const miVehiculo =
        vehiculosData.find((v) => v.id === usuario?.vehiculoAsignadoId) ||
        vehiculosData[0];
      setVehiculo(miVehiculo || null);
      setSolicitudes(solData);
      if (cargasData.length > 0) {
        setUltimaCarga(cargasData[0]);
      }
    } catch (e) {
      console.error('Error cargando datos de conductor:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [usuario]);

  // Solicitud aprobada activa o pendiente
  const solicitudAprobada = solicitudes.find((s) => s.estado === 'APROBADA');
  const solicitudPendiente = solicitudes.find((s) => s.estado === 'PENDIENTE');

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-between space-y-4 pb-20 lg:pb-6 min-h-[calc(100vh-6rem)]">
      <div className="space-y-3">
        {/* Header Compacto del Conductor */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UserAvatar nombre={usuario?.nombre} rol={usuario?.rol} size="sm" />
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-semibold text-slate-900 leading-tight">
                  {usuario?.nombre || 'Conductor Flota'}
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Activo" />
              </div>
              <p className="text-[11px] text-slate-500">
                Licencia: <span className="font-mono text-slate-800">{usuario?.licencia || 'LIC-B3-2025'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setVistaActiva('conductor-cargas')}
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Ver Historial"
          >
            <Clock className="w-4 h-4" />
          </button>
        </div>

        {/* Alerta de Solicitud Aprobada con Código QR / Token */}
        {solicitudAprobada && (
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-emerald-700 text-white flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-semibold text-emerald-800 tracking-wider">
                  Carga Aprobada Lista
                </span>
                <p className="text-xs font-mono font-semibold text-emerald-950">
                  TOKEN: {solicitudAprobada.codigoAutorizacion}
                </p>
              </div>
            </div>
            <button
              onClick={() => setVistaActiva('conductor-registrar')}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
            >
              <span>Subir Docs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Alerta de Solicitud Pendiente */}
        {solicitudPendiente && !solicitudAprobada && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-700 animate-spin" />
              <span className="text-xs font-medium text-amber-900">
                Solicitud en revisión ({solicitudPendiente.litrosSolicitados}L)
              </span>
            </div>
            <span className="text-[10px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              Pendiente
            </span>
          </div>
        )}

        {/* 1. Tarjeta: Vehículo Asignado */}
        <div
          onClick={() => setVistaActiva('conductor-vehiculo')}
          className="bg-white border border-slate-200 rounded-lg p-3.5 hover:border-slate-300 transition-colors cursor-pointer overflow-hidden relative group"
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-3 min-w-0">
              {vehiculo?.imagenUrl ? (
                <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-100">
                  <img
                    src={vehiculo.imagenUrl}
                    alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 block">
                  Vehículo Asignado
                </span>
                <h2 className="text-sm font-semibold text-slate-900 leading-tight truncate">
                  {vehiculo?.marca} {vehiculo?.modelo}
                </h2>
                <span className="text-[10px] text-slate-500">Año {vehiculo?.anio || 2022}</span>
              </div>
            </div>
            <span className="text-xs font-mono font-medium bg-slate-900 text-white px-2 py-0.5 rounded-md flex-shrink-0">
              {vehiculo?.placa || 'PENDIENTE'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-100 text-center">
            <div className="p-1.5 bg-slate-50 rounded-md">
              <span className="text-[10px] text-slate-500 block">No. Serie</span>
              <span className="text-xs font-medium font-mono text-slate-800">
                #{vehiculo?.numeroSerie || '1'}
              </span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-md">
              <span className="text-[10px] text-slate-500 block">Combustible</span>
              <span className="text-xs font-medium text-slate-800 truncate block">
                {vehiculo?.tipoCombustible || 'Diesel'}
              </span>
            </div>
            <div className="p-1.5 bg-slate-50 rounded-md">
              <span className="text-[10px] text-slate-500 block">Tanque</span>
              <span className="text-xs font-medium text-slate-800">
                {vehiculo?.capacidadTanqueLitros || 100} L
              </span>
            </div>
          </div>
        </div>

        {/* 2. Grid Compacto: Odómetro y Último Costo / Rendimiento */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Odómetro Actual */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
              <Gauge className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-medium">Odómetro Actual</span>
            </div>
            <div>
              <span className="text-base font-mono font-semibold text-slate-900">
                {vehiculo?.odometroActual
                  ? Number(vehiculo.odometroActual).toLocaleString()
                  : '0'}
              </span>
              <span className="text-[10px] text-slate-500 ml-1 font-medium">
                {vehiculo?.tipoControlMedicion === 'HORAS' ? 'hrs' : 'km'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-normal mt-1">
              Lectura verificada
            </span>
          </div>

          {/* Último Costo y Rendimiento */}
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px] font-medium">Último Consumo</span>
            </div>
            <div>
              <span className="text-base font-mono font-semibold text-slate-900">
                ₡{ultimaCarga?.totalPagado ? Number(ultimaCarga.totalPagado).toLocaleString() : '0'}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {ultimaCarga?.rendimientoKmL ? `${ultimaCarga.rendimientoKmL.toFixed(1)} km/L` : 'Rendimiento estándar'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {ultimaCarga?.estacion || 'Bomba Nosara'}
            </span>
          </div>
        </div>
      </div>

      {/* Botones de Acción Primarios e Inmediatos (Touch-Friendly min-height 44px) */}
      <div className="space-y-2.5 pt-2">
        {/* Acción Principal 1: Solicitar Autorización */}
        <LiquidButton
          id="btn-conductor-solicitar"
          variant="primary"
          size="lg"
          onClick={() => setModalSolicitarOpen(true)}
          className="w-full text-xs sm:text-sm font-bold shadow-md"
          icon={<Send className="w-4 h-4 text-emerald-400" />}
        >
          Solicitar Autorización de Carga
        </LiquidButton>

        {/* Acción Secundaria 2: Subir Factura y Odómetro */}
        <LiquidButton
          id="btn-conductor-subir-docs"
          variant="secondary"
          size="lg"
          onClick={() => setVistaActiva('conductor-registrar')}
          className="w-full text-xs sm:text-sm font-medium"
          icon={<Camera className="w-4 h-4 text-slate-600" />}
        >
          Subir Factura y Odómetro
        </LiquidButton>
      </div>

      {/* Modal de Solicitud de Carga Rápida */}
      {modalSolicitarOpen && (
        <SolicitarCargaModal
          isOpen={modalSolicitarOpen}
          vehiculo={vehiculo}
          vehiculoAsignado={vehiculo}
          onClose={() => setModalSolicitarOpen(false)}
          onSuccess={() => {
            setModalSolicitarOpen(false);
            cargarDatos();
          }}
        />
      )}
    </div>
  );
};
