/**
 * Contexto de Autenticación y Gestión de Sesiones de Flota
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario, UserRole } from '../types';
import { api } from '../services/api';

interface DemoUserOption {
  email: string;
  nombre: string;
  rol: UserRole;
  descripcion: string;
  placa?: string;
}

export const DEMO_USERS: DemoUserOption[] = [
  {
    email: 'admin@flota.com',
    nombre: 'Lic. Roberto González',
    rol: 'ADMIN',
    descripcion: 'Administrador General / Jefe de Flota y Operaciones',
  },
  {
    email: 'carlos.mendoza@flota.com',
    nombre: 'Carlos Mendoza',
    rol: 'CONDUCTOR',
    descripcion: 'Conductor Asignado - Toyota Hilux 4x4 (ABC-1234)',
    placa: 'ABC-1234',
  },
  {
    email: 'maria.lopez@flota.com',
    nombre: 'María López',
    rol: 'CONDUCTOR',
    descripcion: 'Conductora Distribución - Nissan Versa (XYZ-5678)',
    placa: 'XYZ-5678',
  },
  {
    email: 'juan.perez@flota.com',
    nombre: 'Juan Pérez',
    rol: 'CONDUCTOR',
    descripcion: 'Conductor Carga Pesada - Ford Super Duty F-350 (TRK-9012)',
    placa: 'TRK-9012',
  },
];

export const DEMO_PASSWORDS: Record<string, string> = {
  'admin@flota.com': 'FlotaAdmin2026!',
  'carlos.mendoza@flota.com': 'Conductor2026!',
  'maria.lopez@flota.com': 'Conductor2026!',
  'juan.perez@flota.com': 'Conductor2026!',
};

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  cambiarUsuarioDemo: (email: string, password?: string) => Promise<void>;
  actualizarUsuarioActual: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('flota_token');
    return t && t !== 'null' && t !== 'undefined' ? t : null;
  });
  const [cargando, setCargando] = useState<boolean>(true);

  // Escuchar renovaciones y cierres de sesión desde el cliente API
  useEffect(() => {
    const handleAuthRenewed = (e: Event) => {
      const customEvt = e as CustomEvent<{ token: string; usuario: Usuario }>;
      if (customEvt.detail?.token) {
        setToken(customEvt.detail.token);
      }
      if (customEvt.detail?.usuario) {
        setUsuario(customEvt.detail.usuario);
      }
    };

    const handleAuthLogout = () => {
      logout();
    };

    window.addEventListener('flota_auth_renewed', handleAuthRenewed);
    window.addEventListener('flota_auth_logout', handleAuthLogout);
    return () => {
      window.removeEventListener('flota_auth_renewed', handleAuthRenewed);
      window.removeEventListener('flota_auth_logout', handleAuthLogout);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('flota_token');
    localStorage.removeItem('flota_user_email');
    setToken(null);
    setUsuario(null);
  };

  const login = async (email: string, password?: string) => {
    setCargando(true);
    try {
      const pass = password || DEMO_PASSWORDS[email.toLowerCase()] || 'FlotaAdmin2026!';
      const resp = await api.login(email, pass);
      localStorage.setItem('flota_token', resp.token);
      localStorage.setItem('flota_user_email', resp.usuario.email);
      setToken(resp.token);
      setUsuario(resp.usuario);
    } finally {
      setCargando(false);
    }
  };

  const cambiarUsuarioDemo = async (email: string, password?: string) => {
    setCargando(true);
    try {
      const pass = password || DEMO_PASSWORDS[email.toLowerCase()] || 'FlotaAdmin2026!';
      const resp = await api.login(email, pass);
      localStorage.setItem('flota_token', resp.token);
      localStorage.setItem('flota_user_email', resp.usuario.email);
      setToken(resp.token);
      setUsuario(resp.usuario);
    } catch (e) {
      console.error('Error al cambiar usuario demo:', e);
      logout();
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuario = async () => {
    try {
      const storedToken = localStorage.getItem('flota_token');
      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined') {
        const u = await api.getMe();
        setUsuario(u);
        setToken(storedToken);
        if (u?.email) {
          localStorage.setItem('flota_user_email', u.email);
        }
      } else {
        // En entorno inicial o demostración, conectar con credenciales demo predeterminadas
        await cambiarUsuarioDemo('admin@flota.com');
      }
    } catch (err) {
      console.warn('Sesión previa no válida o expirada:', err);
      logout();
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuario();
  }, []);

  const actualizarUsuarioActual = async () => {
    try {
      const u = await api.getMe();
      setUsuario(u);
    } catch (e) {
      console.error('Error actualizando usuario:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        cargando,
        login,
        logout,
        cambiarUsuarioDemo,
        actualizarUsuarioActual,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
