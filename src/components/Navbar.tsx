/**
 * Barra Superior de Navegación con Notificaciones en Vivo y Selector de Rol
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ShieldCheck,
  User,
  ChevronDown,
  Sparkles,
  Bell,
  CheckCircle2,
  RefreshCw,
  FlaskConical,
  Menu,
  X,
  Send,
  AlertTriangle,
  Key,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { api } from '../services/api';
import { NotificacionSistema } from '../types';
import { UserAvatar } from './UserAvatar';

interface NavbarProps {
  vistaActiva: string;
  setVistaActiva: (v: string) => void;
  solicitudesPendientesCount?: number;
  cargasPendientesCount?: number;
  onOpenMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  vistaActiva,
  setVistaActiva,
  solicitudesPendientesCount = 0,
  cargasPendientesCount = 0,
  onOpenMobileMenu,
  mobileMenuOpen,
  sidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const { usuario, cambiarUsuarioDemo } = useAuth();
  const [dropdownUserOpen, setDropdownUserOpen] = useState(false);
  const [dropdownNotifOpen, setDropdownNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionSistema[]>([]);

  const cargarNotifs = async () => {
    try {
      const data = await api.getNotificaciones();
      setNotificaciones(data.slice(0, 6));
    } catch (e) {
      console.warn('Error al cargar notificaciones en navbar:', e);
    }
  };

  useEffect(() => {
    cargarNotifs();
    const interval = setInterval(cargarNotifs, 8000);
    return () => clearInterval(interval);
  }, []);

  const noLeidasCount = notificaciones.filter((n) => !n.leido).length;

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.08] text-[#1C1C1E] w-full transition-all">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-mobile-menu-toggle"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-black/[0.05] active:scale-95 transition-all focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Botón Desktop para Ocultar / Mostrar Menú Lateral */}
            {onToggleSidebar && (
              <button
                id="btn-desktop-sidebar-toggle"
                onClick={onToggleSidebar}
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-slate-700 hover:text-black hover:bg-black/[0.05] border border-black/[0.08] text-xs font-semibold active:scale-95 transition-all shadow-xs"
                title={sidebarCollapsed ? "Desplegar barra lateral" : "Colapsar barra lateral"}
              >
                {sidebarCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-[#007AFF]" />
                    <span className="text-xs text-[#007AFF]">Expandir</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-600">Colapsar</span>
                  </>
                )}
              </button>
            )}

            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none group"
              onClick={() => setVistaActiva(usuario?.rol === 'ADMIN' ? 'admin-dashboard' : 'conductor-home')}
            >
              <div className="w-8 h-8 rounded-xl bg-[#007AFF] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-[#1C1C1E] tracking-tight">FlotaControl</span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#007AFF]/10 text-[#007AFF]">
                    <Sparkles className="w-3 h-3 mr-1 text-[#007AFF]" />
                    IA Gemini
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-none hidden sm:block">
                  Control de combustible • Odómetros • Tokens • CRC
                </p>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas y Selector de Usuario Demo */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Botón Pruebas Unitarias */}
            <button
              id="btn-nav-unit-tests"
              onClick={() => setVistaActiva('pruebas-unitarias')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:scale-95 transition-all ${
                vistaActiva === 'pruebas-unitarias'
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'bg-black/[0.04] text-slate-700 hover:bg-black/[0.08]'
              }`}
              title="Suite de pruebas de validación"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Pruebas</span>
            </button>

            {/* Campana de Notificaciones con Dropdown */}
            <div className="relative">
              <button
                id="btn-nav-notificaciones"
                onClick={() => {
                  setDropdownNotifOpen(!dropdownNotifOpen);
                  setDropdownUserOpen(false);
                }}
                className={`relative p-2 rounded-xl transition-all active:scale-95 border ${
                  dropdownNotifOpen || vistaActiva === 'centro-notificaciones'
                    ? 'bg-black/[0.08] text-slate-900 border-black/20'
                    : 'bg-white text-slate-700 hover:bg-black/[0.04] border-black/[0.08]'
                }`}
                title="Avisos y Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidasCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF3B30] text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                    {noLeidasCount}
                  </span>
                )}
              </button>

              {/* Menú flotante de Notificaciones */}
              {dropdownNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownNotifOpen(false)} />
                  <div
                    id="dropdown-notificaciones-panel"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5 px-1 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-4 h-4 text-[#007AFF]" />
                        <span className="text-xs font-bold text-[#1C1C1E]">Notificaciones</span>
                      </div>
                      <button
                        onClick={() => {
                          setVistaActiva('centro-notificaciones');
                          setDropdownNotifOpen(false);
                        }}
                        className="text-[11px] text-[#007AFF] hover:underline font-semibold flex items-center"
                      >
                        Ver todas <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-5">No hay avisos pendientes.</p>
                      ) : (
                        notificaciones.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              api.marcarNotificacionLeida(n.id);
                              if (n.accionUrl) setVistaActiva(n.accionUrl);
                              setDropdownNotifOpen(false);
                            }}
                            className={`p-2.5 rounded-xl text-left cursor-pointer transition-all border ${
                              n.leido
                                ? 'bg-black/[0.02] border-black/[0.04] text-slate-600'
                                : 'bg-[#007AFF]/[0.04] border-[#007AFF]/20 text-[#1C1C1E] font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold truncate pr-2 text-[#1C1C1E]">{n.titulo}</span>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  n.prioridad === 'URGENTE'
                                    ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                                    : 'bg-black/[0.05] text-slate-700'
                                }`}
                              >
                                {n.prioridad}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.contenido}</p>
                            <span className="text-[9px] text-slate-400 mt-1.5 block font-mono">
                              {new Date(n.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Selector de Rol y Usuario Demo */}
            <div className="relative">
              <button
                id="btn-user-demo-dropdown"
                onClick={() => {
                  setDropdownUserOpen(!dropdownUserOpen);
                  setDropdownNotifOpen(false);
                }}
                className="flex items-center space-x-2 bg-white hover:bg-black/[0.03] border border-black/[0.08] px-2.5 py-1.5 rounded-xl active:scale-95 transition-all text-left shadow-xs"
              >
                <UserAvatar
                  nombre={usuario?.nombre}
                  rol={usuario?.rol}
                  size="xs"
                  showRoleBadge={true}
                />

                <div className="hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-bold text-[#1C1C1E]">{usuario?.nombre}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        usuario?.rol === 'ADMIN'
                          ? 'bg-[#007AFF]/10 text-[#007AFF]'
                          : 'bg-[#34C759]/10 text-[#248A3D]'
                      }`}
                    >
                      {usuario?.rol === 'ADMIN' ? 'Admin' : 'Conductor'}
                    </span>
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Menú Dropdown de Cambio Rápido de Usuario */}
              {dropdownUserOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownUserOpen(false)} />
                  <div
                    id="dropdown-demo-users"
                    className="absolute right-0 mt-2 w-76 bg-white/95 backdrop-blur-xl border border-black/[0.08] rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="px-2.5 py-2 border-b border-black/[0.06] mb-1.5">
                      <p className="text-xs font-bold text-[#1C1C1E]">
                        Cambiar Rol / Cuenta
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Selecciona un usuario del sistema
                      </p>
                    </div>

                    <div className="space-y-1">
                      {DEMO_USERS.map((demo) => {
                        const isCurrent = usuario?.email === demo.email;
                        return (
                          <button
                            key={demo.email}
                            id={`btn-select-user-${demo.rol.toLowerCase()}-${demo.email.split('@')[0]}`}
                            onClick={async () => {
                              await cambiarUsuarioDemo(demo.email);
                              setDropdownUserOpen(false);
                              if (demo.rol === 'ADMIN') {
                                setVistaActiva('admin-dashboard');
                              } else {
                                setVistaActiva('conductor-home');
                              }
                            }}
                            className={`w-full flex items-start space-x-2.5 p-2 rounded-xl transition-all text-left ${
                              isCurrent
                                ? 'bg-[#007AFF] text-white shadow-xs'
                                : 'hover:bg-black/[0.04] text-slate-700'
                            }`}
                          >
                            <UserAvatar
                              nombre={demo.nombre}
                              rol={demo.rol}
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold truncate ${isCurrent ? 'text-white' : 'text-[#1C1C1E]'}`}>
                                  {demo.nombre}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                    isCurrent
                                      ? 'bg-white/20 text-white'
                                      : demo.rol === 'ADMIN'
                                      ? 'bg-black/[0.06] text-slate-800'
                                      : 'bg-[#34C759]/15 text-[#248A3D]'
                                  }`}
                                >
                                  {demo.rol}
                                </span>
                              </div>
                              <p className={`text-[11px] truncate mt-0.5 ${isCurrent ? 'text-white/80' : 'text-slate-500'}`}>
                                {demo.descripcion}
                              </p>
                            </div>
                            {isCurrent && (
                              <CheckCircle2 className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
