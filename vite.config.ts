import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Configuración canónica de hostname y URLs para evitar fugas de dominios estáticos obsoletos
    server: {
      host: '0.0.0.0',
      port: Number(env.PORT) || 3000,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      host: '0.0.0.0',
      port: Number(env.PORT) || 3000,
    },
    // Configuración canónica de URL del sitio
    define: {
      __SITE_URL__: JSON.stringify(env.VITE_SITE_URL || 'http://localhost:3000'),
    },
  };
});
