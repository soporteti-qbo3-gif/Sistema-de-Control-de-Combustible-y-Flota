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
import { apiRouter } from './server/routes';
import { middlewareAutenticacion, AuthenticatedRequest } from './server/auth';

// Prevención de SSRF: rechazar URLs dirigidas a localhost, 127.0.0.1 o rangos privados (10.x, 192.168.x, 172.16-31.x)
function containsForbiddenSSRF(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const ssrfPattern = /(?:https?:\/\/|ftp:\/\/|file:\/\/)?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|::1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/|$|\s|[?#])/i;
  return ssrfPattern.test(text);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares para parsing de JSON con límite máximo de 10mb
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Limitador de peticiones por usuario autenticado para el proxy de Gemini (10 req/min por usuario)
  const geminiUserLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: any) => {
      return req.user?.userId || req.user?.id || req.user?.email || req.ip || 'anonymous';
    },
    message: {
      error: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes al proxy de Gemini por usuario. Por favor intente más tarde.',
    },
  });

  // Endpoint de salud del servidor
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Control de Combustible y Flota API',
      version: '1.0.0',
    });
  });

  // Endpoint Proxy Seguro para Google Gemini API (@google/genai)
  // Aplica: 1) Verificación JWT (quién llama), 2) Rate limit por usuario, 3) Prevención SSRF y 4) Tope de payload
  app.post('/api/gemini', middlewareAutenticacion, geminiUserLimiter, async (req: AuthenticatedRequest, res) => {
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
