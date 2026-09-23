/**
 * Componente Principal de la Aplicación y Enrutador de Vistas PWA
 * Refactorizado con ErrorBoundary y Enrutamiento Catch-All Seguro (NotFound)
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Skeleton, CardSkeleton } from './components/ui';

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
import { ConductorHome as Home } from './views/conductor/ConductorHome';
import { RegistrarCarga } from './views/conductor/RegistrarCarga';
import { MisCargas } from './views/conductor/MisCargas';
import { MiVehiculo } from './views/conductor/MiVehiculo';

// Páginas y Componentes del Sistema
import { NotFound } from './components/NotFound';
import { LoginPage } from './views/auth/LoginPage';

import { BottomNav } from './components/BottomNav';
import { api } from './services/api';
import { SolicitudAutorizacion, CargaCombustible } from './types';
import { PanelLeftOpen } from 'lucide-react';

/**
 * Rutas declarativas para compatibilidad estándar con React Router
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home setVistaActiva={() => {}} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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
    if (usuario) {
      sincronizarConteos();
      const interval = setInterval(sincronizarConteos, 10000);
      return () => clearInterval(interval);
    }
  }, [usuario]);

  // Soporte de accesibilidad: tecla Escape cierra menús modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col justify-center max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
        <CardSkeleton rows={4} className="mt-2" />
      </div>
    );
  }

  // Si no hay usuario autenticado o debe cambiar su contraseña temporal, mostrar la pantalla de autenticación
  if (!usuario || usuario.debeCambiarPassword) {
    return <LoginPage />;
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
        return <Home setVistaActiva={setVistaActiva} />;
      case 'conductor-registrar':
        return <RegistrarCarga setVistaActiva={setVistaActiva} />;
      case 'conductor-cargas':
        return <MisCargas />;
      case 'conductor-vehiculo':
        return <MiVehiculo />;

      // Ruta Catch-all segura para vistas no encontradas
      default:
        return (
          <NotFound
            onGoHome={() =>
              setVistaActiva(usuario?.rol === 'ADMIN' ? 'admin-dashboard' : 'conductor-home')
            }
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white relative transition-colors duration-150">
      {/* Header Fijo con Top Bar Contract */}
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

        <main className="flex-1 p-3 sm:p-5 lg:p-6 min-w-0 overflow-y-auto pb-24 lg:pb-8">
          {renderVista()}
        </main>

        {/* Botón flotante para restaurar / desplegar la barra lateral en modo pantalla ancha */}
        {sidebarCollapsed && (
          <button
            id="btn-floating-open-sidebar"
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex fixed left-5 bottom-6 z-30 items-center space-x-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium px-3.5 py-2.5 rounded-lg shadow-md border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            title="Desplegar menú lateral"
          >
            <PanelLeftOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
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
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainLayout />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
