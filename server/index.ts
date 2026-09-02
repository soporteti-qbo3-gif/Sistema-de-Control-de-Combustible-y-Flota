/**
 * Servidor Express Backend con Proxy Seguro para Google Gemini API
 * Protege la GEMINI_API_KEY en el servidor y sirve el build de producción.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { apiRouter } from './routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware de parsing con capacidad para payloads y capturas fotográficas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
