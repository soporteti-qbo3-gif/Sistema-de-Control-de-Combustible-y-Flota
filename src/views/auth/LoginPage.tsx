/**
 * Pantalla de Autenticación Central y Cambio Obligatorio de Contraseña
 * FlotaControl OS - Estilo SaaS Moderno (Linear/Notion) con Modo Oscuro y Skeleton
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import {
  Truck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowRight,
  LogOut,
  KeyRound,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { Button, ErrorState } from '../../components/ui';

export const LoginPage: React.FC = () => {
  const { usuario, login, logout, actualizarUsuarioActual } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Estados del Formulario de Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState<string | null>(null);

  // Contraseña temporal ingresada para pre-llenar en cambio de clave si aplica
  const [passwordIngresada, setPasswordIngresada] = useState('');

  // Estados del Formulario de Cambio Obligatorio de Contraseña
  const [passwordAnterior, setPasswordAnterior] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassNuevo, setShowPassNuevo] = useState(false);
  const [showPassConfirm, setShowPassConfirm] = useState(false);
  const [cargandoCambio, setCargandoCambio] = useState(false);
  const [errorCambio, setErrorCambio] = useState<string | null>(null);
  const [exitoCambio, setExitoCambio] = useState(false);

  // Manejador del Login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLogin(null);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      setErrorLogin('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setCargandoLogin(true);
    try {
      setPasswordIngresada(password);
      setPasswordAnterior(password);
      await login(emailTrim, password);
    } catch (err: any) {
      setErrorLogin(
        err?.message === 'USUARIO_SUSPENDIDO'
          ? 'Esta cuenta ha sido suspendida. Contacte al Administrador.'
          : 'Credenciales inválidas. Por favor verifique sus datos.'
      );
    } finally {
      setCargandoLogin(false);
    }
  };

  // Manejador de Cambio Obligatorio de Contraseña
  const handleSubmitCambioPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCambio(null);

    if (passwordNuevo.length < 6) {
      setErrorCambio('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordNuevo !== passwordConfirm) {
      setErrorCambio('Las contraseñas no coinciden. Verifique ambas claves.');
      return;
    }

    setCargandoCambio(true);
    try {
      await api.cambiarPassword({
        passwordAnterior: passwordAnterior || passwordIngresada,
        passwordNuevo,
      });

      setExitoCambio(true);
      await actualizarUsuarioActual();
    } catch (err: any) {
      setErrorCambio(err.message || 'Error al actualizar la contraseña temporal.');
    } finally {
      setCargandoCambio(false);
    }
  };

  const debeCambiar = usuario?.debeCambiarPassword;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 dark:text-slate-100 transition-colors duration-150">
      {/* Botón flotante superior para cambio de tema */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-label="Alternar tema"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
        {/* Cabecera Corporativa de Flota */}
        <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
                <span>FlotaControl OS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 uppercase">
                  v2.6.2
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de Combustible y Parque Automotor
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 sm:p-7">
          {debeCambiar ? (
            /* Vista de Cambio Obligatorio de Contraseña */
            <div>
              <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 mb-5 text-amber-900 dark:text-amber-200">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    Cambio Obligatorio de Contraseña
                  </h2>
                  <p className="text-xs text-amber-700 dark:text-amber-400/90 mt-1 leading-relaxed">
                    Por seguridad operativa, debe reemplazar la clave temporal por una contraseña personal definitiva (mínimo 6 caracteres).
                  </p>
                </div>
              </div>

              {/* Ficha del Usuario Activo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg mb-5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{usuario?.nombre}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{usuario?.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                  {usuario?.rol}
                </span>
              </div>

              {errorCambio && (
                <div id="error-cambio-password" className="mb-4">
                  <ErrorState
                    title="Error al cambiar contraseña"
                    message={errorCambio}
                    onRetry={() => setErrorCambio(null)}
                    retryLabel="Intentar nuevamente"
                  />
                </div>
              )}

              {exitoCambio && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Contraseña actualizada. Ingresando al sistema...</span>
                </div>
              )}

              <form onSubmit={handleSubmitCambioPassword} className="space-y-4">
                {/* Contraseña Temporal o Anterior */}
                <div>
                  <label
                    htmlFor="password-anterior"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Contraseña Temporal / Actual
                  </label>
                  <div className="relative">
                    <input
                      id="password-anterior"
                      type="password"
                      value={passwordAnterior}
                      onChange={(e) => setPasswordAnterior(e.target.value)}
                      placeholder="Ingrese la contraseña temporal"
                      required
                      className="w-full h-11 px-3 pl-10 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-900 dark:text-slate-100 transition-colors"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label
                    htmlFor="password-nuevo"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Nueva Contraseña Personal <span className="text-slate-400 font-normal">(mín. 6 caracteres)</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password-nuevo"
                      type={showPassNuevo ? 'text' : 'password'}
                      value={passwordNuevo}
                      onChange={(e) => setPasswordNuevo(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      required
                      className="w-full h-11 px-3 pl-10 pr-10 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-900 dark:text-slate-100 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassNuevo(!showPassNuevo)}
                      className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[40px] focus:outline-hidden"
                      aria-label={showPassNuevo ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassNuevo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label
                    htmlFor="password-confirm"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password-confirm"
                      type={showPassConfirm ? 'text' : 'password'}
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Repita la nueva contraseña"
                      minLength={6}
                      required
                      className="w-full h-11 px-3 pl-10 pr-10 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-900 dark:text-slate-100 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassConfirm(!showPassConfirm)}
                      className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[40px] focus:outline-hidden"
                      aria-label={showPassConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de Guardar y Confirmar */}
                <Button
                  id="btn-confirmar-cambio-password"
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={cargandoCambio}
                  disabled={exitoCambio}
                  className="w-full mt-2"
                >
                  Guardar y Acceder al Sistema
                </Button>

                {/* Opción para Salir */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-2 cursor-pointer focus:outline-hidden rounded"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar sesión y volver al login</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Vista Normal de Iniciar Sesión */
            <div>
              <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Inicio de Sesión
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ingrese sus credenciales de operador o administrador asignadas.
                </p>
              </div>

              {errorLogin && (
                <div id="error-login-message" className="mb-4">
                  <ErrorState
                    title="No se pudo iniciar sesión"
                    message={errorLogin}
                    onRetry={() => setErrorLogin(null)}
                    retryLabel="Intentar nuevamente"
                  />
                </div>
              )}

              <form onSubmit={handleSubmitLogin} className="space-y-4">
                {/* Atajos de Credenciales Demo / Evaluación */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      Credenciales de evaluación:
                    </span>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      Clic para autocompletar
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('admin@flota.com');
                        setPassword('AdminFlota2026!');
                        setErrorLogin(null);
                      }}
                      className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Administrador</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">admin@flota.com</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('carlos.mendoza@flota.com');
                        setPassword('Conductor2026!');
                        setErrorLogin(null);
                      }}
                      className="text-left p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Conductor</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">carlos.mendoza...</p>
                    </button>
                  </div>
                </div>

                {/* Campo Correo Electrónico */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@flota.com"
                      required
                      disabled={cargandoLogin}
                      className="w-full h-11 px-3 pl-10 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors disabled:opacity-60"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      disabled={cargandoLogin}
                      className="w-full h-11 px-3 pl-10 pr-10 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 dark:focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors disabled:opacity-60"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer min-h-[40px] focus:outline-hidden"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de Enviar */}
                <Button
                  id="btn-login-submit"
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={cargandoLogin}
                  className="w-full mt-2"
                >
                  <span className="flex items-center gap-1.5">
                    Iniciar Sesión <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Pie de Página Informativo */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/60 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Acceso restringido a personal y conductores autorizados de la empresa.
          </p>
        </div>
      </div>
    </div>
  );
};
