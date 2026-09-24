# Changelog
Todas las modificaciones notables en este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.7.1] - 2026-09-24

### Corrección de Compatibilidad con iFrame y Acceso de Demostración
- **Desbloqueo de Visualización en iFrame (`server.ts`):**
  - Desactivada la restricción de `frameguard` (`X-Frame-Options: SAMEORIGIN`) y `frame-ancestors 'self'` en la configuración de Helmet, permitiendo que la aplicación se renderice correctamente en el entorno de visualización incrustado de AI Studio y Cloud Run.
  - Ajustada la política de CORS para aceptar peticiones originadas desde los dominios dinámicos de Cloud Run (`run.app`).
- **Facilidad de Acceso y Evaluación en `LoginPage.tsx`:**
  - Incorporado un panel de acceso rápido con botones para autocompletar credenciales de evaluación con un solo clic (Administrador: `admin@flota.com` / Conductor: `carlos.mendoza@flota.com`).
  - Estandarizadas las contraseñas base en entorno de prueba/evaluación (`AdminFlota2026!` y `Conductor2026!`), eliminando bloqueos de inicio de sesión por claves generadas aleatoriamente no visibles.

## [2.7.0] - 2026-09-23

### Rediseño Visual y Experiencia de Usuario (UI/UX - Estética SaaS Linear / Notion)
- **Sistema de Tokens Semánticos Tailwind v4 (`src/index.css`):**
  - Implementación de tokens estructurados con directiva `@theme` y `@custom-variant dark`: niveles semánticos de fondo (`canvas`, `canvas-subtle`, `canvas-muted`), superficie (`surface`, `surface-subtle`, `surface-muted`), bordes y texto.
  - Paleta de acento de marca sobria basada en azul-índigo (`#4F46E5` / `#6366F1`) y tokens funcionales de estado (`success`, `warning`, `danger`).
  - Mantenimiento estricto de tipografía: `'JetBrains Mono'` con `tabular-nums` para finanzas, odómetros y litros, y `'Plus Jakarta Sans'` para interfaz de usuario.
  - Soporte de navegación accesible con contorno `focus-visible` sobrio en todos los interactivos.
- **Componentes Base Compartidos (`src/components/ui/`):**
  - `Button`: Variantes (`primary`, `secondary`, `ghost`, `danger`), tamaños con target táctil en móvil `>=44px`, estado de carga (`loading`) con spinner integrado y desactivación accesible.
  - `Card` y subcomponentes (`CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`): Bordes sutiles, sombra suave y radio consistente.
  - `Badge`: Variantes semánticas específicas del negocio (`PENDIENTE`, `APROBADA`, `APROBADO`, `VALIDADO`, `RECHAZADO`, `REQUIERE_REVISION`, `ANOMALIA`), con indicador visual y tipografía mono.
  - `EmptyState`: Iconografía contenida, título, descripción y botón de acción opcional.
  - `ErrorState`: Mensaje contextual de error y botón de acción "Reintentar".
  - `Skeleton` y `CardSkeleton`: Efecto pulse con bordes redondeados para cargas de contenido, eliminando spinners bloqueantes indefinidos.
  - `PageHeader`: Título principal, subtítulo, badges informativos y zona de acciones a la derecha.
- **Modo Oscuro Integral y Persistencia:**
  - Creación de `ThemeContext` con soporte de persistencia en `localStorage` (`'flota_theme'`), soporte de detección nativa de `prefers-color-scheme`, y alternancia mediante selector de sol/luna en Navbar y LoginPage.
  - Paleta oscura refinada estilo Linear (fondos en `slate-950` y `slate-900`, evitando negro puro y manteniendo contraste WCAG).
- **Actualización del Shell de la Aplicación:**
  - `Navbar`: Cabecera estilizada con efecto blur, alternador sol/luna, dropdown de notificaciones y menú de cuenta de usuario con soporte de teclado.
  - `Sidebar`: Navegación con ítem activo claro (fondo sutil e indicador visual lateral definido, sin gris plomizo) y diseño adaptable.
  - `BottomNav`: Barra táctil PWA móvil con touch target `>=44px`, indicación visual activa y badges numéricos contrastantes.
  - `LoginPage`: Rediseño completo con soporte de modo oscuro, inputs adaptados, botón primario con spinner integrado y manejo de errores mediante `ErrorState`.
  - `NotFound`: Página 404 modernizada con componentes UI, conservando selectores de prueba.
- **Accesibilidad y Cierre por Teclado:**
  - Integración de cierre con tecla `Escape` en modales, drawer lateral móvil y menús dropdown.
  - Cobertura de tests unitarios completa en `src/components/ui/ui-components.test.tsx` (10 tests específicos para componentes y hook de tema).

## [2.6.2] - 2026-09-23

### Seguridad en Autorización de Endpoints y Sesiones
- **Protección RBAC de Caja Chica:**
  - Aplicado middleware `requiereAdmin` a todos los endpoints operativos y de consulta de Caja Chica (`GET /cajas-chicas`, `GET /cajas-chicas/metricas`, `GET /cajas-chicas/movimientos`, `GET /cajas-chicas/arqueos`, `GET /cajas-chicas/:id`, `PUT /cajas-chicas/:id`, `POST /cajas-chicas/:id/egreso`, `POST /cajas-chicas/:id/vales`, `POST /cajas-chicas/vales/:valeId/liquidar`, `POST /cajas-chicas/:id/reposicion`, `POST /cajas-chicas/:id/arqueo`).
- **Seguridad en Registro de Cargas (`POST /api/cargas`):**
  - Eliminada la fuga del código de autorización esperado en respuestas de error. Al no coincidir el código, responde 400 con mensaje genérico: *"El código de autorización ingresado no es válido o no corresponde a una solicitud activa."*
  - Validación de titularidad de solicitud: un conductor solo puede registrar cargas contra sus propias solicitudes de despacho (error 403 en caso contrario).
  - Integrado rate limiter específico (`cargasRateLimiter`) limitando a 30 intentos por IP cada 15 minutos para mitigar ataques de fuerza bruta sobre códigos de autorización.
  - Generación de códigos `AUT-xxxxx` actualizada con `crypto.randomInt(10000, 100000)` para aleatoriedad criptográficamente segura (en `POST /solicitudes` y `autorizarSolicitudAtomic`).
- **Control de Acceso a Odómetro y Solicitudes:**
  - `POST /api/odometro/lecturas`: restricción para que solo administradores o el conductor específicamente asignado al vehículo puedan registrar lecturas (403 si el conductor no está asignado).
  - `POST /api/solicitudes`: restricción para que los conductores únicamente puedan solicitar cargas para su vehículo asignado (403 si el vehículo no le pertenece).
- **Ajustes de Sesión y Repositorio:**
  - Expiración de tokens JWT reducida de 30 días a 12 horas en `server/auth.ts`, limitando la ventana de vida a una jornada laboral típica.
  - Reincorporado `dist-server/` en `.gitignore`.
- **Suite de Pruebas Automatizadas:**
  - Creado `server/autorizacion.test.ts` con cobertura completa para los escenarios de autorización de rol conductor, verificación de mensajes genéricos sin fuga de tokens y control de acceso a recursos vehiculares.

## [2.6.1] - 2026-09-23

### Correcciones y Sanitización de Usuarios
- **Resolución de Errores de Type-Check:**
  - Restaurado el campo anti-fraude `esSimulado?: boolean` en la interfaz `DatosExtraidosIA` tanto en `server/types.ts` como en `src/types.ts`.
  - Definida e implementada la función `toPublicUser` y tipo `PublicUser` en `server/auth.ts` para excluir estrictamente `passwordHash` y `tempPassword` de cualquier respuesta de API de usuarios.
- **Sanitización de Respuestas en Creación de Usuarios:**
  - Endpoints `POST /usuarios/admin` y `POST /usuarios/conductor` en `server/routes.ts` ahora retornan `usuario: toPublicUser(...)` junto con `tempPasswordGenerada` como propiedad separada de un solo uso, con aclaración de expiración en 72 horas.
  - Vistas `GestionAdministradores.tsx` y `GestionConductores.tsx` actualizadas para leer preferentemente `res.tempPasswordGenerada` al mostrar la clave temporal al administrador.
- **Protección de Persistencia Local:**
  - Añadidas las reglas `data.json` y `data.json.tmp.*` en `.gitignore` y `.dockerignore` para prevenir la inclusión inadvertida de la base de datos local en control de versiones o imágenes de contenedor.

## [2.6.0] - 2026-09-23

### Seguridad y Autenticación (Refactorización Integral)
- **Pantalla de Autenticación Centralizada (`LoginPage`):**
  - Implementación de interfaz de inicio de sesión obligatoria (`/src/views/auth/LoginPage.tsx`) con diseño empresarial responsivo en Tailwind y slate.
  - Flujo forzado de cambio de contraseña cuando `debeCambiarPassword === true`, solicitando la clave anterior/temporal y confirmación de nueva clave (mínimo 6 caracteres).
  - Eliminación absoluta del inicio automático de sesión; la aplicación siempre abre en pantalla de login si no existe token válido.
- **Limpieza de Credenciales Demo en Frontend:**
  - Eliminación completa de `DEMO_PASSWORDS` y del método `cambiarUsuarioDemo` en `src/context/AuthContext.tsx`.
  - Reemplazo del selector de usuarios demo en `Navbar.tsx` por un menú de perfil de usuario con botón de cierre de sesión (`logout`).
  - Eliminación de todas las contraseñas hardcodeadas en texto plano en la aplicación cliente (`src/`).
- **Seguridad en Backend y Generación de Claves:**
  - Generación aleatoria criptográfica con `crypto.randomBytes(9).toString('base64url')` para contraseñas temporales en `crearAdmin`, `crearConductor` y `inicializarDatos` en `server/db.ts`, con expiración a 72 horas.
  - Soporte para variable de entorno `ADMIN_SEED_PASSWORD`. En caso de no existir, se genera una clave temporal aleatoria para el Administrador Principal impresa una sola vez en consola durante el arranque.
  - Mitigación de enumeración de cuentas en `POST /api/auth/login`: respuestas genéricas `401 Credenciales inválidas.` tanto si el correo no existe como si la clave es incorrecta.
- **Documentación:**
  - Documentación de `ADMIN_SEED_PASSWORD` en `.env.example` y guía paso a paso en `README.md` para obtener y cambiar la contraseña inicial del administrador.
