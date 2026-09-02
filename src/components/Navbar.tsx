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
    <header id="app-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 text-slate-900 w-full">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-13">
          {/* Logo y Nombre */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-mobile-menu-toggle"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Botón Desktop para Ocultar / Mostrar Menú Lateral */}
            {onToggleSidebar && (
              <button
                id="btn-desktop-sidebar-toggle"
                onClick={onToggleSidebar}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition-colors"
                title={sidebarCollapsed ? "Desplegar barra lateral" : "Colapsar barra lateral"}
              >
                {sidebarCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-slate-700" />
                    <span className="text-xs text-slate-700">Expandir</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-500">Colapsar</span>
                  </>
                )}
              </button>
            )}

            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none"
              onClick={() => setVistaActiva(usuario?.rol === 'ADMIN' ? 'admin-dashboard' : 'conductor-home')}
            >
              <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-base text-slate-900 tracking-tight">FlotaControl</span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Sparkles className="w-3 h-3 mr-1 text-slate-600" />
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
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                vistaActiva === 'pruebas-unitarias'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
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
                className={`relative p-1.5 rounded-md transition-colors border ${
                  dropdownNotifOpen || vistaActiva === 'centro-notificaciones'
                    ? 'bg-slate-100 text-slate-900 border-slate-300'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
                title="Avisos y Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidasCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-slate-900 text-white font-bold text-[9px] flex items-center justify-center">
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
                    className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-md z-50 p-2.5 animate-in fade-in duration-100"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-slate-700" />
                        <span className="text-xs font-semibold text-slate-900">Notificaciones</span>
                      </div>
                      <button
                        onClick={() => {
                          setVistaActiva('centro-notificaciones');
                          setDropdownNotifOpen(false);
                        }}
                        className="text-[11px] text-slate-600 hover:text-slate-900 font-medium flex items-center"
                      >
                        Ver todas <ArrowRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No hay avisos pendientes.</p>
                      ) : (
                        notificaciones.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              api.marcarNotificacionLeida(n.id);
                              if (n.accionUrl) setVistaActiva(n.accionUrl);
                              setDropdownNotifOpen(false);
                            }}
                            className={`p-2 rounded-md text-left cursor-pointer transition-colors border ${
                              n.leido
                                ? 'bg-slate-50/50 border-slate-100 text-slate-600'
                                : 'bg-slate-50 border-slate-200 text-slate-900 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-medium truncate pr-2 text-slate-900">{n.titulo}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-medium uppercase ${
                                  n.prioridad === 'URGENTE'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {n.prioridad}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.contenido}</p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
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
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors text-left"
              >
                <UserAvatar
                  nombre={usuario?.nombre}
                  rol={usuario?.rol}
                  size="xs"
                  showRoleBadge={true}
                />

                <div className="hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-medium text-slate-900">{usuario?.nombre}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium uppercase ${
                        usuario?.rol === 'ADMIN'
                          ? 'bg-slate-100 text-slate-800 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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
                    className="absolute right-0 mt-1.5 w-76 bg-white border border-slate-200 rounded-lg shadow-md z-50 p-1.5 animate-in fade-in duration-100"
                  >
                    <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                      <p className="text-xs font-semibold text-slate-900">
                        Cambiar Rol / Cuenta
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Selecciona un usuario de prueba
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
                            className={`w-full flex items-start space-x-2.5 p-2 rounded-md transition-colors text-left ${
                              isCurrent
                                ? 'bg-slate-100 text-slate-900'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <UserAvatar
                              nombre={demo.nombre}
                              rol={demo.rol}
                              size="xs"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-900 truncate">
                                  {demo.nombre}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-medium uppercase ${
                                    demo.rol === 'ADMIN'
                                      ? 'bg-slate-200 text-slate-800'
                                      : 'bg-emerald-50 text-emerald-800'
                                  }`}
                                >
                                  {demo.rol}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {demo.descripcion}
                              </p>
                            </div>
                            {isCurrent && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 mt-0.5 flex-shrink-0" />
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
