# Changelog
Todas las modificaciones notables en este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
