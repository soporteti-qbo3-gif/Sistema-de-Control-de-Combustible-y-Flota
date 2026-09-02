/**
 * Servidor Principal Express + Vite
 * Configurado para puerto 3000 y host 0.0.0.0
 * Integra Proxy Gemini (@google/genai) seguro y Vite Middleware
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { apiRouter } from './server/routes';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares para parsing de JSON con soporte de imágenes Base64 de alta resolución
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  app.post('/api/gemini', async (req, res) => {
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
