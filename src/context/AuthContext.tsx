/**
 * Contexto de Autenticación y Gestión de Sesiones de Flota
 * Control de acceso estricto basado en credenciales verificadas
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => void;
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

  // Escuchar eventos de sesión expirada para limpiar estado
  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setUsuario(null);
    };
    window.addEventListener('flota_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('flota_auth_expired', handleAuthExpired);
    };
  }, []);

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
        // Sin token válido: mantener sesión cerrada
        setUsuario(null);
        setToken(null);
      }
    } catch (err) {
      console.warn('Sesión previa no válida o expirada:', err);
      localStorage.removeItem('flota_token');
      localStorage.removeItem('flota_user_email');
      setUsuario(null);
      setToken(null);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUsuario();
  }, []);

  const login = async (email: string, password: string): Promise<Usuario> => {
    if (!email || !password) {
      throw new Error('El correo electrónico y la contraseña son requeridos.');
    }
    setCargando(true);
    try {
      const resp = await api.login(email.trim(), password);
      localStorage.setItem('flota_token', resp.token);
      localStorage.setItem('flota_user_email', resp.usuario.email);
      setToken(resp.token);
      setUsuario(resp.usuario);
      return resp.usuario;
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('flota_token');
    localStorage.removeItem('flota_user_email');
    setToken(null);
    setUsuario(null);
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
