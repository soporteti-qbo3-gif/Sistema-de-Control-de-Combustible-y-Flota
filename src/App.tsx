/**
 * Componente Principal de la Aplicación y Enrutador de Vistas PWA
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Vistas Administrativas
import { AdminDashboard } from './views/admin/AdminDashboard';
import { SolicitudesAutorizacion } from './views/admin/SolicitudesAutorizacion';
import { ValidacionCargas } from './views/admin/ValidacionCargas';
import { GestionVehiculos } from './views/admin/GestionVehiculos';
import { GestionConductores } from './views/admin/GestionConductores';
import { GestionAdministradores } from './views/admin/GestionAdministradores';
import { GestionMantenimientos } from './views/admin/GestionMantenimientos';
import { GestionSaldosPrepago } from './views/admin/GestionSaldosPrepago';
import { ReportesComparativas } from './views/admin/ReportesComparativas';
import { CentroNotificaciones } from './views/admin/CentroNotificaciones';
import { ConfiguracionSistema } from './views/admin/ConfiguracionSistema';
import { PruebasUnitarias } from './views/admin/PruebasUnitarias';

// Vistas del Conductor (PWA Mobile First)
import { ConductorHome } from './views/conductor/ConductorHome';
import { RegistrarCarga } from './views/conductor/RegistrarCarga';
import { MisCargas } from './views/conductor/MisCargas';
import { MiVehiculo } from './views/conductor/MiVehiculo';

import { BottomNav } from './components/BottomNav';
import { api } from './services/api';
import { SolicitudAutorizacion, CargaCombustible } from './types';
import { PanelLeftOpen } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { usuario, cargando } = useAuth();
  const [vistaActiva, setVistaActiva] = useState<string>('admin-dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [solicitudes, setSolicitudes] = useState<SolicitudAutorizacion[]>([]);
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);

  // Ocultar automáticamente la barra lateral al entrar a la sección de vehículos para maximizar el ancho del catálogo
  useEffect(() => {
    if (vistaActiva === 'admin-vehiculos') {
      setSidebarCollapsed(true);
    }
  }, [vistaActiva]);

  // Sincronizar vista predeterminada según el rol del usuario autenticado
  useEffect(() => {
    if (usuario) {
      if (usuario.rol === 'CONDUCTOR') {
        if (!vistaActiva.startsWith('conductor-') && vistaActiva !== 'centro-notificaciones' && vistaActiva !== 'pruebas-unitarias') {
          setVistaActiva('conductor-home');
        }
      } else {
        if (vistaActiva.startsWith('conductor-')) {
          setVistaActiva('admin-dashboard');
        }
      }
    }
  }, [usuario]);

  // Carga periódica de conteos para insignias de notificación
  const sincronizarConteos = async () => {
    try {
      const [sols, crgs] = await Promise.all([api.getSolicitudes(), api.getCargas()]);
      setSolicitudes(sols);
      setCargas(crgs);
    } catch (e) {
      console.warn('Error sincronizando métricas en app:', e);
    }
  };

  useEffect(() => {
    sincronizarConteos();
    const interval = setInterval(sincronizarConteos, 10000);
    return () => clearInterval(interval);
  }, [usuario]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-700">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-stone-500">Iniciando FlotaControl...</p>
        </div>
      </div>
    );
  }

  const solicitudesPendientesCount = solicitudes.filter((s) => s.estado === 'PENDIENTE').length;
  const cargasPendientesCount = cargas.filter(
    (c) => c.estadoValidacion === 'PENDIENTE' || c.estadoValidacion === 'REQUIERE_REVISION'
  ).length;

  const renderVista = () => {
    switch (vistaActiva) {
      // Vistas Admin
      case 'admin-dashboard':
        return <AdminDashboard setVistaActiva={setVistaActiva} />;
      case 'admin-solicitudes':
        return <SolicitudesAutorizacion />;
      case 'admin-validacion':
        return <ValidacionCargas />;
      case 'admin-vehiculos':
        return <GestionVehiculos />;
      case 'admin-conductores':
        return <GestionConductores />;
      case 'admin-administradores':
        return <GestionAdministradores />;
      case 'admin-mantenimientos':
        return <GestionMantenimientos />;
      case 'admin-saldos':
        return <GestionSaldosPrepago />;
      case 'admin-reportes':
        return <ReportesComparativas />;
      case 'admin-configuracion':
        return <ConfiguracionSistema />;
      case 'centro-notificaciones':
        return <CentroNotificaciones setVistaActiva={setVistaActiva} />;
      case 'pruebas-unitarias':
        return <PruebasUnitarias />;

      // Vistas Conductor
      case 'conductor-home':
        return <ConductorHome setVistaActiva={setVistaActiva} />;
      case 'conductor-registrar':
        return <RegistrarCarga setVistaActiva={setVistaActiva} />;
      case 'conductor-cargas':
        return <MisCargas />;
      case 'conductor-vehiculo':
        return <MiVehiculo />;

      default:
        return usuario?.rol === 'ADMIN' ? (
          <AdminDashboard setVistaActiva={setVistaActiva} />
        ) : (
          <ConductorHome setVistaActiva={setVistaActiva} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans antialiased selection:bg-stone-900 selection:text-white relative">
      {/* Header Fijo Compacto */}
      <Navbar
        vistaActiva={vistaActiva}
        setVistaActiva={setVistaActiva}
        solicitudesPendientesCount={solicitudesPendientesCount}
        cargasPendientesCount={cargasPendientesCount}
        mobileMenuOpen={mobileMenuOpen}
        onOpenMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Contenedor Principal (Sidebar + Área de Contenido a pantalla completa) */}
      <div className="flex-1 flex w-full relative z-10">
        <Sidebar
          vistaActiva={vistaActiva}
          setVistaActiva={setVistaActiva}
          solicitudesPendientesCount={solicitudesPendientesCount}
          cargasPendientesCount={cargasPendientesCount}
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 p-2.5 sm:p-4 lg:p-5 min-w-0 overflow-y-auto pb-20 lg:pb-6">
          {renderVista()}
        </main>

        {/* Botón flotante para restaurar / desplegar la barra lateral en modo pantalla ancha */}
        {sidebarCollapsed && (
          <button
            id="btn-floating-open-sidebar"
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed left-4 bottom-6 z-30 items-center space-x-2 bg-stone-950 text-white hover:bg-stone-800 text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-stone-700 transition-all hover:scale-105 active:scale-95 group"
            title="Desplegar menú lateral a su normalidad"
          >
            <PanelLeftOpen className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>Desplegar Menú</span>
          </button>
        )}
      </div>

      {/* Barra de Navegación Inferior (Bottom Navigation) Mobile-First PWA */}
      <BottomNav
        vistaActiva={vistaActiva}
        setVistaActiva={setVistaActiva}
        solicitudesPendientesCount={solicitudesPendientesCount}
        cargasPendientesCount={cargasPendientesCount}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
