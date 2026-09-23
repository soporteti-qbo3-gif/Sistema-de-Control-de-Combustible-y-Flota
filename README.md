# PagSurr - Sistema de Control de Combustible y Gestión de Flota

Plataforma empresarial Progressive Web App (PWA) de alta disponibilidad para la gestión integral de flotas vehiculares, control de saldos prepago por estación de combustible, autorizaciones de carga en tiempo real con tokens digitales, y extracción automática de comprobantes y odómetros mediante Google Gemini AI a través de un proxy backend seguro.

---

## 🛡️ Arquitectura y Principios DevSecOps

El proyecto implementa prácticas avanzadas de seguridad y calidad de software:

- **Aislamiento de Secretos (Zero Trust en Frontend):** La variable `GEMINI_API_KEY` se aloja exclusivamente en el servidor backend (Node.js/Express) y nunca se expone en los bundles del navegador ni en definiciones de Vite (`vite.config.ts`).
- **Proxy Backend Seguro:** Todas las interacciones con `@google/genai` se realizan mediante el endpoint `/api/gemini`, validando esquemas y evitando abusos o suplantación de credenciales.
- **Resiliencia UI con Error Boundary:** Captura de excepciones en tiempo de ejecución para evitar caídas de pantalla en blanco y ofrecer recuperación inmediata al usuario.
- **Rutas Catch-All Seguras:** Manejo robusto de errores 404 mediante un componente `NotFound` dedicado.
- **Contenedores no privilegiados:** Dockerfile multietapa con usuario no root (`pagsurr`) y escaneo de salud integrado (`HEALTHCHECK`).

---

## 📋 Requisitos Previos

- **Node.js:** Versión 20.x o superior (LTS recomendada).
- **Gestor de Paquetes:** npm 10.x o superior.
- **Docker & Docker Compose:** Opcional pero recomendado para entornos de producción y pruebas aisladas.

---

## 🔑 Variables de Entorno

Copia el archivo `.env.example` a `.env` antes de ejecutar la aplicación:

```bash
cp .env.example .env
```

| Variable | Tipo | Ámbito | Descripción | Valor por Defecto |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Numérico | Servidor | Puerto de escucha para el servidor Express y producción. | `3000` |
| `VITE_API_URL` | URL | Cliente/Vite | URL base de la API consumida por el cliente frontend. | `http://localhost:3000/api` |
| `VITE_SITE_URL` | URL | Cliente/Vite | URL canónica del sitio para resolución de hosts y metadatos. | `http://localhost:3000` |
| `ADMIN_SEED_PASSWORD` | Secreto | Servidor | Contraseña inicial para el administrador principal en el primer arranque. Si se omite, se genera aleatoria y se imprime en consola. | *(Opcional / Aleatoria)* |
| `GEMINI_API_KEY` | Secreto | **Servidor (Exclusivo)** | Clave de API de Google AI Studio Gemini. **NUNCA exponer en cliente**. | *(Requerido para IA)* |

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Modo Desarrollo
Inicia el servidor backend Express con recarga en caliente y middleware Vite:
```bash
npm run dev
```
Accede a la aplicación en: [http://localhost:3000](http://localhost:3000)

### 🔐 Obtención de la Contraseña Inicial del Administrador
Durante el primer arranque del servidor (inicialización de base de datos):
1. **Con variable de entorno:** Si defines `ADMIN_SEED_PASSWORD` en `.env`, se utilizará dicho valor para `admin@flota.com`.
2. **Generación automática segura:** Si dejas `ADMIN_SEED_PASSWORD` vacía o no la defines, el servidor genera automáticamente una clave temporal aleatoria segura (`crypto.randomBytes`) y la imprime **una única vez** en la terminal:
   ```text
   ================================================================
   🔑 [SEGURIDAD] CONTRASEÑA INICIAL DEL ADMINISTRADOR PRINCIPAL
   Usuario: admin@flota.com
   Contraseña Temporal: <clave-generada>
   AVISO: Esta contraseña es temporal. Cámbiala en el primer ingreso.
   ================================================================
   ```
3. **Primer Ingreso Obligatorio:** Al abrir la URL, la aplicación muestra siempre la pantalla de login. Tras ingresar con la contraseña temporal, el sistema exige inmediatamente el cambio por una clave personal definitiva (mínimo 6 caracteres) para acceder al panel operativo.

### 3. Verificación de Calidad y Linter
Ejecuta la validación de tipos TypeScript y las reglas de ESLint:
```bash
npm run lint
```

### 4. Formateo de Código (Prettier)
Aplica las reglas de formato a todo el código fuente:
```bash
npm run format
```

### 5. Pruebas Automatizadas (Vitest)
Ejecuta la suite de pruebas unitarias y de integración:
```bash
npm run test
```

### 6. Compilación de Producción
Genera los artefactos optimizados del cliente en `dist/` y empaqueta el servidor con `esbuild`:
```bash
npm run build
```

### 7. Ejecución en Producción
```bash
npm start
```

### 8. Limpieza Multiplataforma
Elimina los directorios de compilación de forma segura en Windows, Linux y macOS:
```bash
npm run clean
```

---

## 🐳 Despliegue con Docker y Docker Compose

### Levantar con Docker Compose
```bash
# Construir la imagen y arrancar el contenedor en segundo plano
docker compose up --build -d

# Visualizar los registros en tiempo real
docker compose logs -f app

# Detener los contenedores
docker compose down
```

### Construcción y Ejecución Manual con Docker
```bash
# Construir la imagen multietapa
docker build -t pagsurr-fleet:latest .

# Ejecutar el contenedor con las variables de entorno
docker run -d \
  --name pagsurr-instance \
  -p 3000:3000 \
  -e GEMINI_API_KEY="tu-api-key-aqui" \
  -e VITE_API_URL="http://localhost:3000/api" \
  -e VITE_SITE_URL="http://localhost:3000" \
  pagsurr-fleet:latest
```

---

## 🛠️ Estructura del Proyecto

```
├── .github/
│   └── workflows/
│       └── ci.yml             # Pipeline de Integración Continua (GitHub Actions)
├── server/
│   ├── index.ts               # Servidor Express, proxy Gemini y servicio estático
│   ├── routes.ts              # Endpoints de autenticación, flota y combustible
│   ├── db.ts                  # Persistencia y simulación de base de datos
│   └── ia_extractor.ts        # Lógica de extracción multimodal con IA
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx  # Captura de errores de renderizado en React
│   │   ├── Navbar.tsx         # Barra superior de navegación y perfiles
│   │   └── Sidebar.tsx        # Navegación lateral reactiva
│   ├── pages/
│   │   └── NotFound.tsx       # Página 404 para rutas inexistentes
│   ├── views/                 # Vistas de Administrador y Conductor
│   ├── App.tsx                # Enrutador principal y layout
│   └── main.tsx               # Entry point de React 19
├── .env.example               # Plantilla segura de variables de entorno
├── .eslintrc.cjs              # Configuración estándar de ESLint
├── .prettierrc                # Configuración de formateo Prettier
├── Dockerfile                 # Construcción multietapa optimizada para producción
├── docker-compose.yml         # Orquestación de servicios en contenedores
├── package.json               # Dependencias y scripts del proyecto
├── vite.config.ts             # Configuración segura de Vite con alias @ -> ./src
└── vitest.config.ts           # Configuración del motor de pruebas Vitest
```
