# ==============================================================================
# Dockerfile Multietapa - PagSurr Fleet Control
# Seguridad, optimización de tamaño y principio de mínimo privilegio
# ==============================================================================

# ------------------------------------------------------------------------------
# Etapa 1: Construcción (Builder)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias necesarias para compilación nativa si aplica
RUN apk add --no-cache libc6-compat

# Copiar manifiestos de dependencias para aprovechar caché de capas Docker
COPY package.json package-lock.json* ./

# Instalación limpia de dependencias
RUN npm ci

# Copiar código fuente del proyecto
COPY . .

# Deshabilitar telemetría y compilar frontend (Vite) + backend bundled (esbuild)
ENV NODE_ENV=production
RUN npm run build

# ------------------------------------------------------------------------------
# Etapa 2: Entorno de Ejecución en Producción (Runner)
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Añadir curl para healthchecks en contenedores
RUN apk add --no-cache curl

# Crear usuario no privilegiado para cumplimiento DevSecOps
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 pagsurr

# Copiar manifiestos de dependencias e instalar únicamente dependencias de producción
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar artefactos generados en la etapa de build
COPY --from=builder --chown=pagsurr:nodejs /app/dist ./dist
COPY --from=builder --chown=pagsurr:nodejs /app/server ./server

# Asignar propiedad de archivos al usuario sin privilegios
USER pagsurr

# Exponer el puerto de servicio
EXPOSE 3000

# Verificación de estado del servicio
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Iniciar servidor Express de producción
CMD ["node", "dist/server.cjs"]
