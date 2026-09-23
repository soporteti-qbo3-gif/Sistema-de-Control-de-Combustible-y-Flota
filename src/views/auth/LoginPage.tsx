/**
 * Pantalla de Autenticación Central y Cambio Obligatorio de Contraseña
 * FlotaControl OS - Sistema de Control y Gestión de Combustible
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Fuel,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  LogOut,
  KeyRound,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { usuario, login, logout, actualizarUsuarioActual } = useAuth();

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
      // Mensaje de error genérico para no permitir enumeración de cuentas ni vectores de ataque
      setErrorLogin(err?.message === 'USUARIO_SUSPENDIDO'
        ? 'Esta cuenta ha sido suspendida. Contacte al Administrador.'
        : 'Credenciales inválidas. Por favor verifique sus datos.');
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
      // Actualizar el estado del usuario para desbloquear el acceso a la app
      await actualizarUsuarioActual();
    } catch (err: any) {
      setErrorCambio(err.message || 'Error al actualizar la contraseña temporal.');
    } finally {
      setCargandoCambio(false);
    }
  };

  const debeCambiar = usuario?.debeCambiarPassword;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden transition-all">
        {/* Cabecera Corporativa de Flota */}
        <div className="bg-slate-900 text-white px-6 py-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center space-x-2">
                <span>FlotaControl OS</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  v2.6
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de Combustible y Parque Automotor
              </p>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 sm:p-8">
          {debeCambiar ? (
            /* Vista de Cambio Obligatorio de Contraseña */
            <div>
              <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 mb-6 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                    Cambio Obligatorio de Contraseña
                  </h2>
                  <p className="text-xs text-amber-700 mt-1">
                    Por seguridad operativa, debe reemplazar la clave temporal por una contraseña personal definitiva (mínimo 6 caracteres).
                  </p>
                </div>
              </div>

              {/* Ficha del Usuario Activo */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900">{usuario?.nombre}</p>
                  <p className="text-slate-500 font-mono text-[11px]">{usuario?.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-200 text-slate-700 font-semibold">
                  {usuario?.rol}
                </span>
              </div>

              {errorCambio && (
                <div
                  id="error-cambio-password"
                  className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{errorCambio}</span>
                </div>
              )}

              {exitoCambio && (
                <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Contraseña actualizada. Ingresando al sistema...</span>
                </div>
              )}

              <form onSubmit={handleSubmitCambioPassword} className="space-y-4">
                {/* Contraseña Temporal o Anterior */}
                <div>
                  <label
                    htmlFor="password-anterior"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                      className="w-full h-11 px-3 pl-10 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition-colors"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label
                    htmlFor="password-nuevo"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                      className="w-full h-11 px-3 pl-10 pr-10 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassNuevo(!showPassNuevo)}
                      className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[40px] focus:outline-hidden"
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
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                      className="w-full h-11 px-3 pl-10 pr-10 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition-colors"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassConfirm(!showPassConfirm)}
                      className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[40px] focus:outline-hidden"
                      aria-label={showPassConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de Guardar y Confirmar */}
                <button
                  id="btn-confirmar-cambio-password"
                  type="submit"
                  disabled={cargandoCambio || exitoCambio}
                  className="w-full h-11 min-h-[44px] mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {cargandoCambio ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Guardar y Acceder al Sistema</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                {/* Opción para Salir */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="inline-flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors p-2 cursor-pointer focus:outline-hidden rounded"
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
              <div className="mb-6">
                <h2 className="text-base font-bold text-slate-900">
                  Inicio de Sesión
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Ingrese sus credenciales de operador o administrador asignadas.
                </p>
              </div>

              {errorLogin && (
                <div
                  id="error-login-message"
                  className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2.5 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span className="font-medium">{errorLogin}</span>
                </div>
              )}

              <form onSubmit={handleSubmitLogin} className="space-y-4">
                {/* Campo Correo Electrónico */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                      className="w-full h-11 px-3 pl-10 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition-colors disabled:bg-slate-50"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
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
                      className="w-full h-11 px-3 pl-10 pr-10 text-sm border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-slate-900 transition-colors disabled:bg-slate-50"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1 bottom-1 px-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[40px] focus:outline-hidden"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Botón de Enviar */}
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={cargandoLogin}
                  className="w-full h-11 min-h-[44px] mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center space-x-2 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  {cargandoLogin ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Pie de Página Informativo */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500">
            Acceso restringido a personal y conductores autorizados de la empresa.
          </p>
        </div>
      </div>
    </div>
  );
};
