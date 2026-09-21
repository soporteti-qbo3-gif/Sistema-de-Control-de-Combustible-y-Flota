/**
 * Configuración Centralizada del Servidor y Validación de Variables de Entorno
 * Utiliza Zod para garantizar consistencia y seguridad en tiempo de arranque.
 */

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('Control de Flota <alertas@flota.com>'),
  VITE_SITE_URL: z.string().default('http://localhost:3000'),
  DATA_DIR: z.string().optional(),
  DATA_FILE: z.string().optional(),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ [CONFIG] Error validando variables de entorno:', parseResult.error.format());
  throw new Error('Configuración inválida del servidor');
}

export const config = parseResult.data;

// 🔒 SEGURIDAD CRÍTICA: En producción, JWT_SECRET es estrictamente obligatorio sin fallback hardcodeado
if (config.NODE_ENV === 'production') {
  if (!config.JWT_SECRET || config.JWT_SECRET.trim() === '') {
    throw new Error(
      '❌ [SEGURIDAD CRÍTICA] JWT_SECRET es obligatorio en entorno de producción. Genere una clave con: openssl rand -base64 48'
    );
  }
}

// Clave JWT centralizada: en producción no permite fallback; en desarrollo se utiliza clave de desarrollo no secreta
export const JWT_SECRET: string =
  config.JWT_SECRET ||
  (config.NODE_ENV === 'production'
    ? (() => {
        throw new Error('JWT_SECRET no definido en producción');
      })()
    : 'dev_local_testing_secret_key_flota_2026_unsecure');
