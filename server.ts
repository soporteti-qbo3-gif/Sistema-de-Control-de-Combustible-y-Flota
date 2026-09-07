/**
 * Servidor Principal Express + Vite
 * Configurado para puerto 3000 y host 0.0.0.0
 * Integra Proxy Gemini (@google/genai) seguro y Vite Middleware
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { apiRouter } from './server/routes';
import { initSentry, isSentryConfigured, setupSentryErrorHandler, captureException } from './server/sentry';
import { isResendConfigured } from './server/resend';
import { db } from './server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'flota_control_jwt_super_secret_2026';

/**
 * Middleware simple de verificación de token JWT en encabezado Authorization
 */
function verifyToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Token no proporcionado o formato inválido (se requiere Bearer <token>).',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (_err) {
    res.status(401).json({
      error: 'INVALID_TOKEN',
      message: 'Token expirado o no válido.',
    });
  }
}

// Prevención de SSRF: rechazar URLs dirigidas a localhost, 127.0.0.1 o rangos privados (10.x, 192.168.x, 172.16-31.x)
function containsForbiddenSSRF(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const ssrfPattern = /(?:https?:\/\/|ftp:\/\/|file:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|::1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/|$|\s|[?#])/i;
  return ssrfPattern.test(text);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // 🛡️ Inicialización de observabilidad y rastreo de errores con Sentry
  initSentry(app);

  // Middlewares para parsing de JSON con límite reducido de 50mb a 10mb
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Limitador de peticiones para el proxy de Gemini (10 req/min)
  const geminiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes al proxy de Gemini. Por favor intente más tarde.',
    },
  });

  // 🩺 Endpoint de salud robusto de observabilidad del servidor y subsistemas
  app.get('/api/health', (_req, res) => {
    const uptimeSegundos = process.uptime();
    const horas = Math.floor(uptimeSegundos / 3600);
    const minutos = Math.floor((uptimeSegundos % 3600) / 60);
    const segundos = Math.floor(uptimeSegundos % 60);
    const uptimeLegible = `${horas}h ${minutos}m ${segundos}s`;

    const mem = process.memoryUsage();

    const subsistemas = {
      baseDatos: {
        estado: 'SALUDABLE',
        tipo: 'Local JSON Store / Repositorio Flota',
        registros: {
          vehiculos: db.vehiculos?.length || 0,
          cargas: db.cargas?.length || 0,
          usuarios: db.usuarios?.length || 0,
          bombasPrepago: db.bombas?.length || 0,
          solicitudes: db.solicitudes?.length || 0,
          lecturasOdometro: db.lecturasOdometro?.length || 0,
        },
      },
      observabilidad: {
        sentry: {
          configurado: isSentryConfigured(),
          modo: isSentryConfigured() ? 'PRODUCCION_ACTIVO' : 'LOCAL_SIMULADO',
        },
      },
      notificacionesEmail: {
        resend: {
          configurado: isResendConfigured(),
          modo: isResendConfigured() ? 'PRODUCCION_ACTIVO' : 'LOCAL_SIMULADO',
        },
      },
      inteligenciaArtificial: {
        gemini: {
          configurado: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
          modeloPrincipal: 'gemini-3.8-flash',
        },
      },
    };

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      servicio: 'Control de Combustible y Flota API',
      version: '1.0.0',
      entorno: process.env.NODE_ENV || 'development',
      tiempoActivo: {
        segundos: Number(uptimeSegundos.toFixed(2)),
        formato: uptimeLegible,
      },
      rendimientoSistema: {
        nodeVersion: process.version,
        plataforma: process.platform,
        arquitectura: process.arch,
        memoria: {
          heapUsadoMB: Number((mem.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotalMB: Number((mem.heapTotal / 1024 / 1024).toFixed(2)),
          rssMB: Number((mem.rss / 1024 / 1024).toFixed(2)),
          externaMB: Number((mem.external / 1024 / 1024).toFixed(2)),
        },
      },
      subsistemas,
    });
  });

  // Endpoint Proxy Seguro para Google Gemini API (@google/genai)
  // Aplica: 1) verifyToken, 2) rateLimit de 10 req/min, 3) payload máximo 10mb
  app.post('/api/gemini', verifyToken, geminiLimiter, async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error: 'CONFIG_ERROR',
          message: 'La variable de entorno GEMINI_API_KEY no está configurada en el servidor.',
        });
        return;
      }

      const { prompt, model = 'gemini-3.8-flash', systemInstruction, imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!prompt && !imageBase64) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Se requiere al menos un prompt de texto o una imagen en base64.',
        });
        return;
      }

      // Prevención de SSRF (Puntos 4 y 7): rechazar URLs que apunten a localhost, 127.0.0.1 o rangos privados
      if (prompt && containsForbiddenSSRF(prompt)) {
        res.status(403).json({
          error: 'SSRF_BLOCKED',
          message: 'Solicitud rechazada: El prompt contiene URLs que apuntan a localhost o rangos de red privada restringidos (Prevención SSRF).',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'pagsurr-backend-proxy',
          },
        },
      });

      let contents: any;
      if (imageBase64) {
        contents = [
          {
            inlineData: {
              data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ''),
              mimeType,
            },
          },
        ];
        if (prompt) {
          contents.push(prompt);
        }
      } else {
        contents = prompt;
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      res.json({
        success: true,
        text: response.text,
        model,
      });
    } catch (err: any) {
      console.error('[GEMINI_PROXY_ERROR]', { message: err.message, timestamp: new Date().toISOString() });
      res.status(500).json({
        error: 'GEMINI_API_ERROR',
        message: err?.message || 'Error al comunicarse con la API de Google Gemini.',
      });
    }
  });

  // Montar rutas de la API REST
  app.use('/api', apiRouter);

  // 🛡️ Middleware de captura de errores con Sentry
  setupSentryErrorHandler(app);

  // Manejador global de excepciones para la API
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    captureException(err, { location: 'global_express_error_handler' });
    res.status(err.status || 500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'Error interno inesperado en el servidor.',
    });
  });

  // Integración con Vite para desarrollo o servir estáticos en producción
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de Flota y Combustible ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
