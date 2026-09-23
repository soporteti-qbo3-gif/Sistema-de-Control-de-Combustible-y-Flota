/**
 * Barra Superior de Navegación Ejecutiva
 * Top Bar Contract: Brand mark sólido + Contexto Operativo + Acciones Directas
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  ChevronDown,
  Bell,
  CheckCircle2,
  FlaskConical,
  Menu,
  X,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  const { usuario, logout } = useAuth();
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
    const interval = setInterval(cargarNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const noLeidasCount = notificaciones.filter((n) => !n.leido).length;

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-900 w-full">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-13">
          {/* Zona 1: Marca e Identidad Operativa */}
          <div className="flex items-center space-x-3">
            <button
              id="btn-mobile-menu-toggle"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Toggle Menú Lateral en Desktop */}
            {onToggleSidebar && (
              <button
                id="btn-desktop-sidebar-toggle"
                onClick={onToggleSidebar}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs font-medium transition-colors"
                title={sidebarCollapsed ? "Desplegar menú lateral" : "Colapsar menú lateral"}
              >
                {sidebarCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-3.5 h-3.5 text-slate-600" />
                    <span className="text-[11px]">Menú</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px]">Ocultar</span>
                  </>
                )}
              </button>
            )}

            <div
              className="flex items-center space-x-2.5 cursor-pointer select-none"
              onClick={() => setVistaActiva(usuario?.rol === 'ADMIN' ? 'admin-dashboard' : 'conductor-home')}
            >
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-900 tracking-tight">FlotaControl</span>
                  <span className="hidden md:inline-block font-mono text-[10px] text-slate-500 uppercase tracking-wider">
                    Enterprise
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-normal leading-none hidden sm:block">
                  Gestión Operativa de Flota y Combustible
                </p>
              </div>
            </div>
          </div>

          {/* Zona 2: Acciones Rápidas & Cuenta */}
          <div className="flex items-center space-x-2">
            {/* Botón Pruebas Unitarias */}
            <button
              id="btn-nav-unit-tests"
              onClick={() => setVistaActiva('pruebas-unitarias')}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors border ${
                vistaActiva === 'pruebas-unitarias'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Suite de pruebas automatizadas"
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
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
                title="Avisos y Notificaciones"
              >
                <Bell className="w-4 h-4" />
                {noLeidasCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-4 px-1 rounded bg-rose-600 text-white font-mono font-medium text-[9px] flex items-center justify-center">
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
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1 mb-2">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3.5 h-3.5 text-slate-700" />
                        <span className="text-xs font-semibold text-slate-900">Notificaciones del Sistema</span>
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

                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {notificaciones.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">No hay avisos pendientes.</p>
                      ) : (
                        notificaciones.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              api.marcarNotificacionLeida(n.id);
                              if (n.accionUrl) setVistaActiva(n.accionUrl);
                              setDropdownNotifOpen(false);
                            }}
                            className={`p-2.5 rounded-md text-left cursor-pointer transition-colors border ${
                              n.leido
                                ? 'bg-slate-50 border-slate-100 text-slate-600'
                                : 'bg-blue-50/40 border-blue-200/60 text-slate-900'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium truncate pr-2 text-slate-900">{n.titulo}</span>
                              <span className="text-[10px] font-mono text-slate-500 uppercase">
                                {n.prioridad}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.contenido}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block font-mono">
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

            {/* Selector de Usuario y Rol */}
            <div className="relative">
              <button
                id="btn-user-demo-dropdown"
                onClick={() => {
                  setDropdownUserOpen(!dropdownUserOpen);
                  setDropdownNotifOpen(false);
                }}
                className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-md transition-colors text-left"
              >
                <UserAvatar
                  nombre={usuario?.nombre}
                  rol={usuario?.rol}
                  size="xs"
                  showRoleBadge={true}
                />

                <div className="hidden sm:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-900">{usuario?.nombre}</span>
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      {usuario?.rol === 'ADMIN' ? 'Admin' : 'Conductor'}
                    </span>
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Menú Dropdown de Usuario / Sesión Activa */}
              {dropdownUserOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownUserOpen(false)} />
                  <div
                    id="dropdown-user-menu"
                    className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-3"
                  >
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                      <UserAvatar
                        nombre={usuario?.nombre || 'Usuario'}
                        rol={usuario?.rol || 'CONDUCTOR'}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {usuario?.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {usuario?.email}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-medium ${
                            usuario?.rol === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {usuario?.rol === 'ADMIN' ? 'Administrador' : 'Conductor'}
                        </span>
                      </div>
                    </div>

                    {usuario?.telefonoContacto && (
                      <div className="py-2 text-[11px] text-slate-600 border-b border-slate-100">
                        <span className="text-slate-400">Teléfono:</span> {usuario.telefonoContacto}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        id="btn-logout"
                        onClick={() => {
                          setDropdownUserOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md hover:bg-rose-50 text-rose-700 text-xs font-medium transition-colors border border-rose-100 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Cerrar Sesión</span>
                      </button>
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
