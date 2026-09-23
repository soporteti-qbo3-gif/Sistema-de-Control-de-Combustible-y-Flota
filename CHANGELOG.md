# Changelog
Todas las modificaciones notables en este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
