/**
 * Servidor Express Backend con Proxy Seguro para Google Gemini API
 * Protege la GEMINI_API_KEY en el servidor y sirve el build de producción.
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// 🔒 SEGURIDAD: Importación de Helmet para cabeceras HTTP seguras y CORS para control estricto de orígenes
import helmet from 'helmet';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { apiRouter } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 🔒 SEGURIDAD: Configuración estricta de Helmet con Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", process.env.VITE_SITE_URL || 'http://localhost:3000'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 🔒 SEGURIDAD: Configuración restrictiva de CORS permitiendo únicamente el origen autorizado en VITE_SITE_URL
const allowedOrigin = process.env.VITE_SITE_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origen (como curl local, SSR, o aplicaciones cliente del mismo host) o del origen autorizado
      if (!origin || origin === allowedOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por política restrictiva CORS de PagSurr/QBO3'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// 🔒 SEGURIDAD: Reducción del límite de payload de 50mb a 5mb para mitigar ataques DoS por agotamiento de memoria
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));


// Healthcheck
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PagSurr Backend API & Gemini Proxy',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Endpoint Proxy Seguro para Google Gemini API (@google/genai)
// NUNCA expone GEMINI_API_KEY al cliente navegador
app.post('/api/gemini', async (req: Request, res: Response): Promise<void> => {
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
    console.error('Error en proxy Gemini:', err);
    res.status(500).json({
      error: 'GEMINI_API_ERROR',
      message: err?.message || 'Error al comunicarse con la API de Google Gemini.',
    });
  }
});

// Montar resto de endpoints de la aplicación
app.use('/api', apiRouter);

// Servir archivos estáticos del build de Vite en producción
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback para Single Page Application (SPA)
app.get('*', (_req: Request, res: Response) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="utf-8" />
            <title>PagSurr</title>
          </head>
          <body>
            <div style="font-family: sans-serif; padding: 2rem; text-align: center;">
              <h2>Servidor en ejecución</h2>
              <p>El backend está listo. Si estás en modo desarrollo, accede a través del servidor Vite.</p>
            </div>
          </body>
        </html>
      `);
    }
  });
});

export function startServer() {
  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor PagSurr escuchando en http://0.0.0.0:${PORT}`);
  });
}

// Ejecutar automáticamente si es llamado directamente
if (process.env.NODE_ENV === 'production') {
  startServer();
}
