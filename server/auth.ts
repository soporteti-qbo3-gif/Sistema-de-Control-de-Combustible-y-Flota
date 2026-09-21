/**
 * Módulo de Autenticación y Autorización JWT
 */

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Usuario } from './types';
import { db } from './db';
import { JWT_SECRET } from './config';

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

// 🔒 SEGURIDAD (1.4): Serializador estricto para prevenir fuga de hashes y contraseñas temporales
export function toPublicUser(u: Usuario): Omit<Usuario, 'passwordHash' | 'tempPassword' | 'tempPasswordHash'> {
  const { passwordHash, tempPassword, tempPasswordHash, ...publicUser } = u;
  return publicUser;
}

// 🔒 SEGURIDAD: Función de utilidad para mitigación de IDOR (Insecure Direct Object References).
// Retorna true si el rol es 'ADMIN' o si el userId coincide estrictamente con recursoOwnerId.
export function verificarPropiedadRecurso(
  userId: string,
  recursoOwnerId: string,
  rol: string
): boolean {
  if (!userId || !recursoOwnerId) return false;
  // 🔒 SEGURIDAD: Privilegio jerárquico global para ADMIN
  if (rol === 'ADMIN') return true;
  // 🔒 SEGURIDAD: Verificación estricta de titularidad del recurso para evitar acceso horizontal no autorizado
  return userId === recursoOwnerId;
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
  // 🔒 SEGURIDAD: Firma de tokens exclusivamente con clave criptográfica del entorno
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verificarToken(token: string): TokenPayload | null {
  if (!token || token === 'null' || token === 'undefined' || typeof token !== 'string') {
    return null;
  }
  try {
    // 🔒 SEGURIDAD: Verificación estricta de firma y expiración mediante JWT_SECRET.
    // NUNCA aceptar tokens expirados.
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (_error: any) {
    return null;
  }
}

export function middlewareAutenticacion(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  // 🔒 SEGURIDAD: Validación estricta de encabezado de autorización Bearer
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado. Token no proporcionado o formato inválido.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const payload = verificarToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Token expirado o no válido.' });
    return;
  }

  // 🔒 SEGURIDAD (5.1): Búsqueda ESTRICTA por userId. Jamás fallback por email.
  const targetId = payload.userId || payload.id;
  const usuario = targetId ? db.usuarios.find((u) => u.id === targetId && u.activo) : undefined;

  if (!usuario) {
    res.status(401).json({ error: 'Usuario no encontrado o desactivado por la administración.' });
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
  if (req.user?.rol !== 'ADMIN') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador.' });
    return;
  }
  next();
}

export function requiereAdminPrincipal(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.rol !== 'ADMIN' || !req.user?.esAdminPrincipal) {
    res.status(403).json({
      error: 'Acceso denegado. Se requieren privilegios de Administrador Principal.',
    });
    return;
  }
  next();
}
