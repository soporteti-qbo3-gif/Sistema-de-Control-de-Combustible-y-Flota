/**
 * Módulo de Observabilidad y Monitoreo de Errores con Sentry
 * Configuración segura con inicialización lazy y fallback silencioso si no hay DSN.
 */

import * as Sentry from '@sentry/node';
import type express from 'express';

let sentryInitialized = false;

/**
 * Inicializa Sentry en la aplicación Node.js / Express
 */
export function initSentry(app?: express.Express): boolean {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn || dsn.trim() === '' || dsn === 'MY_SENTRY_DSN') {
    console.info('ℹ️ [Sentry] SENTRY_DSN no configurado. Modo de observabilidad simulado/local activo.');
    sentryInitialized = false;
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: 'pagsurr-fleet-control@1.0.0',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      integrations: [],
    });

    if (app && typeof Sentry.setupExpressErrorHandler === 'function') {
      Sentry.setupExpressErrorHandler(app);
    }

    sentryInitialized = true;
    console.log('✅ [Sentry] Observabilidad y rastreo de errores inicializados correctamente.');
    return true;
  } catch (error: any) {
    console.error('⚠️ [Sentry] Error al inicializar Sentry SDK:', error?.message || error);
    sentryInitialized = false;
    return false;
  }
}

/**
 * Indica si Sentry está activado y funcionando
 */
export function isSentryConfigured(): boolean {
  return sentryInitialized;
}

/**
 * Captura una excepción en Sentry con contexto enriquecido
 */
export function captureException(error: unknown, context?: Record<string, any>): string | undefined {
  console.error('[EXCEPTION_TRACKED]', {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    context,
  });

  if (sentryInitialized) {
    return Sentry.captureException(error, {
      extra: context,
    });
  }

  return undefined;
}

/**
 * Captura un mensaje o evento de advertencia/información en Sentry
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
): string | undefined {
  if (level === 'error') {
    console.error(`[SENTRY_MSG:${level.toUpperCase()}] ${message}`, context);
  } else if (level === 'warning') {
    console.warn(`[SENTRY_MSG:${level.toUpperCase()}] ${message}`, context);
  } else {
    console.log(`[SENTRY_MSG:${level.toUpperCase()}] ${message}`, context);
  }

  if (sentryInitialized) {
    return Sentry.captureMessage(message, {
      level,
      extra: context,
    });
  }

  return undefined;
}

/**
 * Configura el middleware de manejo de errores de Sentry en Express
 */
export function setupSentryErrorHandler(app: express.Express): void {
  if (sentryInitialized && typeof Sentry.setupExpressErrorHandler === 'function') {
    Sentry.setupExpressErrorHandler(app);
  }
}
