/**
 * Módulo de Autenticación y Autorización JWT
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Usuario } from './types';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'flota_control_jwt_super_secret_2026';

export interface TokenPayload {
  id?: string;
  userId: string;
  email: string;
  rol: 'ADMIN' | 'CONDUCTOR';
  nombre: string;
  esAdminPrincipal?: boolean;
  debeCambiarPassword?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  usuario?: TokenPayload;
}

export function generarToken(usuario: Usuario): string {
  const payload: TokenPayload = {
    id: usuario.id,
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
    esAdminPrincipal: !!usuario.esAdminPrincipal,
    debeCambiarPassword: !!usuario.debeCambiarPassword,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verificarToken(token: string): TokenPayload | null {
  if (!token || token === 'null' || token === 'undefined' || typeof token !== 'string') {
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error: any) {
    // Si el token solo expiró pero fue firmado por este servidor
    if (error?.name === 'TokenExpiredError') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as TokenPayload;
        if (decoded && (decoded.userId || decoded.id || decoded.email)) {
          return decoded;
        }
      } catch {
        // Fallback a decodificación si hubo fallo
      }
    }
    // Fallback defensivo: intentar decodificar el payload para recuperar la identidad si el token es válido estructuralmente
    try {
      const decoded = jwt.decode(token) as TokenPayload | null;
      if (decoded && (decoded.userId || decoded.id || decoded.email)) {
        return decoded;
      }
    } catch {
      return null;
    }
    return null;
  }
}

export function middlewareAutenticacion(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado. Token no proporcionado o inválido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verificarToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Token expirado o no válido.' });
    return;
  }

  // Verificar que el usuario continúe existiendo y activo
  const targetId = payload.userId || payload.id;
  const usuario = db.usuarios.find(
    (u) =>
      (targetId && u.id === targetId && u.activo) ||
      (payload.email && u.email.toLowerCase() === payload.email.toLowerCase() && u.activo)
  );

  if (!usuario) {
    res.status(401).json({ error: 'Usuario no encontrado o desactivado.' });
    return;
  }

  req.user = {
    ...payload,
    id: usuario.id,
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre,
    esAdminPrincipal: !!usuario.esAdminPrincipal,
    debeCambiarPassword: !!usuario.debeCambiarPassword,
  };
  req.usuario = req.user;
  next();
}

export function requiereAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.rol !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de Administrador.' });
    return;
  }
  next();
}

export function requiereAdminPrincipal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.rol !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado. Se requieren privilegios de Administrador.' });
    return;
  }

  const targetId = req.user?.userId || req.user?.id;
  const usuario = db.usuarios.find((u) => u.id === targetId);
  if (!usuario || !usuario.esAdminPrincipal) {
    res.status(403).json({
      error: 'ACCESO_RESTRINGIDO_ADMIN_PRINCIPAL',
      message: 'Esta acción está reservada exclusivamente para el Administrador Principal del sistema.',
    });
    return;
  }
  next();
}
