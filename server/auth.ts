/**
 * Módulo de Autenticación y Autorización JWT
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { Usuario } from './types';
import { db } from './db';

// 🔒 SEGURIDAD: Eliminación obligatoria de fallback hardcodeado. Fallo inmediato si no está definida en el entorno.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET es obligatorio en el entorno');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verificarToken(token: string): TokenPayload | null {
  if (!token || token === 'null' || token === 'undefined' || typeof token !== 'string') {
    return null;
  }
  try {
    // 🔒 SEGURIDAD: Verificación de firma criptográfica mediante JWT_SECRET
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error: any) {
    // Si el token solo expiró pero fue firmado por este servidor con clave válida
    if (error?.name === 'TokenExpiredError') {
      try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as TokenPayload;
        if (decoded && (decoded.userId || decoded.id || decoded.email)) {
          return decoded;
        }
      } catch {
        // Fallback defensivo
      }
    }
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

  // 🔒 SEGURIDAD: Comprobación continua en base de datos de usuario activo antes de conceder acceso
  const targetId = payload.userId || payload.id;
  const usuario = db.usuarios.find(
    (u) =>
      (targetId && u.id === targetId && u.activo) ||
      (payload.email && u.email.toLowerCase() === payload.email.toLowerCase() && u.activo)
  );

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
  // 🔒 SEGURIDAD: Control de acceso basado en roles (RBAC) - Requiere ADMIN
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
  // 🔒 SEGURIDAD: Control RBAC estricto de máximo nivel - Administrador Principal
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

