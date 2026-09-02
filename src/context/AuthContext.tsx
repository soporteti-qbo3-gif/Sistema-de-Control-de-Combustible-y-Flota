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

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  cambiarUsuarioDemo: (email: string) => Promise<void>;
  actualizarUsuarioActual: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('flota_token'));
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarUsuario = async () => {
    try {
      const storedToken = localStorage.getItem('flota_token');
      if (storedToken) {
        const u = await api.getMe();
        setUsuario(u);
      } else {
        // Por defecto iniciar con Conductor para probar el flujo móvil, o Admin si prefiere
        await cambiarUsuarioDemo('admin@flota.com');
      }
    } catch (err) {
      console.warn('Sesión previa no válida, restableciendo a demo:', err);
      localStorage.removeItem('flota_token');
      await cambiarUsuarioDemo('admin@flota.com');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuario();
  }, []);

  const login = async (email: string) => {
    setCargando(true);
    try {
      const resp = await api.login(email);
      localStorage.setItem('flota_token', resp.token);
      setToken(resp.token);
      setUsuario(resp.usuario);
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('flota_token');
    setToken(null);
    setUsuario(null);
  };

  const cambiarUsuarioDemo = async (email: string) => {
    setCargando(true);
    try {
      const resp = await api.login(email);
      localStorage.setItem('flota_token', resp.token);
      setToken(resp.token);
      setUsuario(resp.usuario);
    } catch (e) {
      console.error('Error al cambiar usuario demo:', e);
    } finally {
      setCargando(false);
    }
  };

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
