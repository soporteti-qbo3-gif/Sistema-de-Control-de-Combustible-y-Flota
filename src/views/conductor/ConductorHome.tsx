/**
 * Pantalla Principal de Conductor (Mobile-First Cockpit)
 * Diseño industrial, sin tarjetas anidadas ni elementos genéricos.
 * Alta legibilidad bajo luz de sol y optimizado para pantallas táctiles de campo.
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
  TrendingUp,
  KeyRound,
  History,
  ShieldCheck,
  Fuel,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Vehiculo, SolicitudAutorizacion, CargaCombustible } from '../../types';
import { SolicitarCargaModal } from './SolicitarCargaModal';
import { UserAvatar } from '../../components/UserAvatar';

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
    <div className="w-full max-w-md mx-auto space-y-4 pb-24 pt-1">
      {/* 1. Barra de Identidad del Conductor (Limpia, con Large Title y Perfil) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-3">
          <UserAvatar nombre={usuario?.nombre} rol={usuario?.rol} size="md" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[#1C1C1E] leading-tight">
                {usuario?.nombre || 'Conductor de Flota'}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#34C759] ring-4 ring-[#34C759]/20" title="En servicio activo" />
            </div>
            <span className="text-xs font-mono text-slate-500">
              {usuario?.licencia || 'LIC-B3-2025'} • Activo
            </span>
          </div>
        </div>

        <button
          onClick={() => setVistaActiva('conductor-cargas')}
          className="apple-press-feedback flex items-center space-x-1 text-xs font-bold text-[#007AFF] px-3 py-1.5 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/15 transition-all"
        >
          <History className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Historial</span>
        </button>
      </div>

      {/* 2. Banner de Token Aprobado (Estilo tarjeta iOS Wallet) */}
      {solicitudAprobada && (
        <div className="bg-[#1C1C1E] text-white rounded-2xl p-4 shadow-md border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#34C759]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-[#34C759] text-[11px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Autorización Lista para Carga</span>
              </div>
              <div className="text-2xl font-mono font-bold tracking-wider text-white mt-1">
                {solicitudAprobada.codigoAutorizacion}
              </div>
              <p className="text-xs text-slate-400">
                Hasta {solicitudAprobada.litrosSolicitados} Litros • Estación recomendada
              </p>
            </div>

            <button
              onClick={() => setVistaActiva('conductor-registrar')}
              className="apple-press-feedback px-3.5 py-2.5 bg-[#34C759] hover:bg-[#30B752] text-black text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-xs"
            >
              <span>Subir Docs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Alerta de Solicitud en Proceso */}
      {solicitudPendiente && !solicitudAprobada && (
        <div className="bg-[#FF9500]/10 border border-[#FF9500]/25 rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-4 h-4 text-[#FF9500] animate-spin" />
            <span className="font-semibold text-[#8F5200]">
              Solicitud de {solicitudPendiente.litrosSolicitados}L en espera de token
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#C97700] bg-[#FF9500]/20 px-2 py-0.5 rounded-full font-bold">
            PENDIENTE
          </span>
        </div>
      )}

      {/* 3. Ficha Inset Grouped de la Unidad Asignada */}
      <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-xs">
        {/* Cabecera de la Unidad */}
        <div
          onClick={() => setVistaActiva('conductor-vehiculo')}
          className="p-4 flex items-center justify-between hover:bg-black/[0.015] transition-colors cursor-pointer border-b border-black/[0.06]"
        >
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-black/[0.05] border border-black/[0.06] flex items-center justify-center text-[#1C1C1E] flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                Unidad Asignada
              </span>
              <h2 className="text-sm font-bold text-[#1C1C1E] truncate">
                {vehiculo?.marca} {vehiculo?.modelo}
              </h2>
              <span className="text-xs text-slate-500">
                Serie #{vehiculo?.numeroSerie || '1'} • Mod. {vehiculo?.anio || 2022}
              </span>
            </div>
          </div>

          <span className="text-xs font-mono font-bold bg-[#1C1C1E] text-white px-3 py-1.5 rounded-lg flex-shrink-0 tracking-wide shadow-2xs">
            {vehiculo?.placa || 'PENDIENTE'}
          </span>
        </div>

        {/* Ribbon de Métricas Operativas de la Unidad */}
        <div className="grid grid-cols-3 divide-x divide-black/[0.06] py-3.5 bg-black/[0.015] text-center">
          <div className="px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Odómetro</span>
            <div className="text-sm font-mono font-bold text-[#1C1C1E] mt-0.5">
              {vehiculo?.odometroActual ? Number(vehiculo.odometroActual).toLocaleString() : '0'}
              <span className="text-[10px] text-slate-400 ml-0.5">km</span>
            </div>
          </div>

          <div className="px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tipo</span>
            <div className="text-sm font-bold text-[#1C1C1E] mt-0.5 truncate">
              {vehiculo?.tipoCombustible || 'Diesel'}
            </div>
          </div>

          <div className="px-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tanque</span>
            <div className="text-sm font-mono font-bold text-[#1C1C1E] mt-0.5">
              {vehiculo?.capacidadTanqueLitros || 100}
              <span className="text-[10px] text-slate-400 ml-0.5">L</span>
            </div>
          </div>
        </div>

        {/* Último Registro */}
        <div className="px-4 py-2.5 bg-white border-t border-black/[0.06] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-[#34C759] flex-shrink-0" />
            <span className="truncate">
              Último despacho: ₡{Number(ultimaCarga?.totalPagado || 0).toLocaleString()} (
              {ultimaCarga?.rendimientoKmL ? `${ultimaCarga.rendimientoKmL.toFixed(1)} km/L` : 'Normal'}
              )
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 flex-shrink-0 ml-1">
            {ultimaCarga?.estacion || 'Bomba Nosara'}
          </span>
        </div>
      </div>

      {/* 4. Acciones Tácticas Principales (Botones táctiles Apple HIG min-h 48px) */}
      <div className="space-y-2.5 pt-1">
        <button
          id="btn-conductor-solicitar"
          onClick={() => setModalSolicitarOpen(true)}
          className="apple-press-feedback w-full h-12 bg-[#007AFF] hover:bg-[#0066D6] text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs"
        >
          <Send className="w-4 h-4 text-white" />
          <span>Solicitar Autorización de Carga</span>
        </button>

        <button
          id="btn-conductor-subir-docs"
          onClick={() => setVistaActiva('conductor-registrar')}
          className="apple-press-feedback w-full h-12 bg-white hover:bg-black/[0.02] text-[#1C1C1E] border border-black/[0.08] rounded-2xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs"
        >
          <Camera className="w-4 h-4 text-slate-600" />
          <span>Subir Factura y Odómetro (Cámara)</span>
        </button>
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
