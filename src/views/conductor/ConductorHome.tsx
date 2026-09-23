/**
 * Pantalla Principal de Conductor (Cabina Operativa Mobile PWA)
 * Diseño industrial, alta legibilidad táctil, arquitectura sobria y sin elementos infantiles
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Send,
  Camera,
  CheckCircle2,
  Clock,
  ChevronRight,
  Gauge,
  History,
  Fuel,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Vehiculo, SolicitudAutorizacion, CargaCombustible } from '../../types';
import { SolicitarCargaModal } from './SolicitarCargaModal';
import { UserAvatar } from '../../components/UserAvatar';
import { DigitalBarcode } from '../../components/DigitalBarcode';

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

  const solicitudAprobada = solicitudes.find((s) => s.estado === 'APROBADA');
  const solicitudPendiente = solicitudes.find((s) => s.estado === 'PENDIENTE');

  return (
    <div className="w-full max-w-md mx-auto space-y-3.5 pb-24 pt-1">
      {/* 1. Barra de Identidad del Conductor */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3">
        <div className="flex items-center space-x-2.5">
          <UserAvatar nombre={usuario?.nombre} rol={usuario?.rol} size="sm" showRoleBadge={true} />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {usuario?.nombre || 'Conductor Asignado'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              {usuario?.licencia || 'LIC-B3-2025'} · Turno Activo
            </span>
          </div>
        </div>

        <button
          onClick={() => setVistaActiva('conductor-cargas')}
          className="flex items-center space-x-1 text-xs font-medium text-slate-700 hover:text-slate-900 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 transition-colors"
        >
          <History className="w-3.5 h-3.5 text-slate-500" />
          <span>Historial</span>
        </button>
      </div>

      {/* 2. Banner de Token Aprobado (Pase de Despacho Digital con Código de Barras en Colores) */}
      {solicitudAprobada && (
        <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-400 text-[10px] font-mono font-semibold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Pase de Despacho Autorizado</span>
              </div>
              <div className="text-xl font-mono font-bold tracking-widest text-white">
                {solicitudAprobada.codigoAutorizacion}
              </div>
              <p className="text-[11px] text-slate-300">
                Límite: <span className="text-emerald-400 font-mono font-semibold">{solicitudAprobada.litrosSolicitados} Litros</span> · Mostrar en bomba
              </p>
            </div>

            <button
              onClick={() => setVistaActiva('conductor-registrar')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-md transition-colors flex items-center space-x-1 flex-shrink-0"
            >
              <span>Subir Docs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Código de barras visual con acento de color para escaneo en bomba */}
          <div className="bg-white rounded-md p-2.5 flex flex-col items-center justify-center border border-emerald-300 shadow-xs">
            <DigitalBarcode
              code={solicitudAprobada.codigoAutorizacion || 'AUT-2025'}
              colorTheme="emerald"
              size="sm"
              showText={true}
              subtext={`${solicitudAprobada.litrosSolicitados}L · BOMBA`}
              className="w-full max-w-[260px] border-none p-0 shadow-none"
            />
          </div>
        </div>
      )}

      {/* Alerta de Solicitud en Proceso */}
      {solicitudPendiente && !solicitudAprobada && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600 animate-spin" />
            <span className="font-medium">
              Solicitud de {solicitudPendiente.litrosSolicitados} L en espera de token central
            </span>
          </div>
          <span className="font-mono text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 font-medium">
            EN ESPERA
          </span>
        </div>
      )}

      {/* 3. Ficha de la Unidad Asignada */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div
          onClick={() => setVistaActiva('conductor-vehiculo')}
          className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-mono font-medium text-slate-500 block">
                Unidad Asignada
              </span>
              <h2 className="text-xs font-semibold text-slate-900 truncate">
                {vehiculo?.marca} {vehiculo?.modelo}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded">
              {vehiculo?.placa || 'PLACA'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Especificaciones Rápidas de la Unidad */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/50 p-3 text-center">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
              Odómetro
            </span>
            <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
              {vehiculo?.odometroActual ? Number(vehiculo.odometroActual).toLocaleString() : 0} km
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
              Combustible
            </span>
            <span className="text-xs font-medium text-slate-800">
              {vehiculo?.tipoCombustible || 'Diesel'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-0.5">
              Tanque
            </span>
            <span className="text-xs font-mono font-medium text-slate-800 tabular-nums">
              {vehiculo?.capacidadTanqueLitros || 80} L
            </span>
          </div>
        </div>
      </div>

      {/* 4. Acciones Tácticas Principales */}
      <div className="space-y-2 pt-1">
        <button
          id="btn-conductor-subir-docs"
          onClick={() => setVistaActiva('conductor-registrar')}
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center justify-center space-x-2 transition-colors border border-slate-800"
        >
          <Camera className="w-4 h-4 text-slate-300" />
          <span>Registrar Carga de Combustible (IA)</span>
        </button>

        <button
          id="btn-conductor-solicitar-token"
          onClick={() => setModalSolicitarOpen(true)}
          className="w-full h-11 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-md text-xs font-medium flex items-center justify-center space-x-2 transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-slate-600" />
          <span>Solicitar Token de Despacho</span>
        </button>
      </div>

      {/* 5. Resumen de Último Registro */}
      {ultimaCarga && (
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">
              Última Carga Registrada
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {new Date(ultimaCarga.fecha).toLocaleDateString('es-CR')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {ultimaCarga.estacion || 'Estación Local'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {ultimaCarga.litros} L · ₡{Number(ultimaCarga.totalPagado).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center space-x-1">
              {ultimaCarga.estadoValidacion === 'VALIDADO' ? (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                  Certificada
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                  En Auditoría
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Solicitud de Carga */}
      {modalSolicitarOpen && (
        <SolicitarCargaModal
          vehiculo={vehiculo}
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
