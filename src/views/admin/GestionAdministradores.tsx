/**
 * Módulo Administrativo: Gestión de Administradores y Permisos de Seguridad
 * Exclusivo para el Administrador Principal y supervisión de accesos
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Search,
  Phone,
  Mail,
  Shield,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  UserCheck,
  UserX,
  RefreshCw,
  KeyRound,
  AlertTriangle,
  Trash2,
  Lock,
  Copy,
  Check,
  Calendar,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { Usuario } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../../components/UserAvatar';

export const GestionAdministradores: React.FC = () => {
  const { usuario: usuarioActual } = useAuth();
  const esAdminPrincipal = !!usuarioActual?.esAdminPrincipal;

  const [administradores, setAdministradores] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'SUSPENDIDOS'>('TODOS');

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null);
  const [modalTempPass, setModalTempPass] = useState<{ nombre: string; email: string; pass: string } | null>(null);

  // Formulario Crear / Editar
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefonoContacto: '',
    tempPassword: '',
    activo: true,
  });

  const [guardando, setGuardando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const usuarios = await api.getUsuarios({ rol: 'ADMIN' });
      setAdministradores(usuarios);
    } catch (e: any) {
      setErrorMsg(e.message || 'Error cargando lista de administradores.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const notificarExito = (msg: string) => {
    setExitoMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setExitoMsg(null), 5000);
  };

  const notificarError = (msg: string) => {
    setErrorMsg(msg);
    setExitoMsg(null);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  const abrirCrear = () => {
    // Generar clave temporal aleatoria fácil de comunicar
    const passSugerido = `FlotaAdmin#${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      nombre: '',
      email: '',
      telefonoContacto: '',
      tempPassword: passSugerido,
      activo: true,
    });
    setErrorMsg(null);
    setModalCrear(true);
  };

  const abrirEditar = (admin: Usuario) => {
    setModalEditar(admin);
    setFormData({
      nombre: admin.nombre,
      email: admin.email,
      telefonoContacto: admin.telefonoContacto || '',
      tempPassword: '',
      activo: admin.activo,
    });
    setErrorMsg(null);
  };

  const handleCrearAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setGuardando(true);

    try {
      const res = await api.createAdmin(formData);
      setModalCrear(false);
      notificarExito(`Administrador ${res.usuario.nombre} registrado exitosamente.`);
      
      if (res.usuario.tempPassword) {
        setModalTempPass({
          nombre: res.usuario.nombre,
          email: res.usuario.email,
          pass: res.usuario.tempPassword,
        });
      }
      
      await cargarDatos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al crear administrador.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEditarAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditar) return;
    setErrorMsg(null);
    setGuardando(true);

    try {
      await api.updateUsuario(modalEditar.id, {
        nombre: formData.nombre,
        email: formData.email,
        telefonoContacto: formData.telefonoContacto,
        activo: formData.activo,
        tempPassword: formData.tempPassword || undefined,
      });

      setModalEditar(null);
      notificarExito(`Datos del administrador ${formData.nombre} actualizados correctamente.`);
      await cargarDatos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar administrador.');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleSuspension = async (admin: Usuario) => {
    if (admin.esAdminPrincipal) {
      notificarError('No es posible suspender la cuenta del Administrador Principal.');
      return;
    }

    try {
      if (admin.activo) {
        await api.suspenderUsuario(admin.id);
        notificarExito(`Administrador ${admin.nombre} suspendido. Su acceso al sistema ha sido bloqueado.`);
      } else {
        await api.activarUsuario(admin.id);
        notificarExito(`Administrador ${admin.nombre} reactivado exitosamente.`);
      }
      await cargarDatos();
    } catch (err: any) {
      notificarError(err.message || 'Error al modificar estado del administrador.');
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);
    try {
      const res = await api.deleteUsuario(modalEliminar.id);
      setModalEliminar(null);
      notificarExito(res.message || 'Operación completada.');
      await cargarDatos();
    } catch (err: any) {
      notificarError(err.message || 'Error al procesar la eliminación.');
      setModalEliminar(null);
    } finally {
      setGuardando(false);
    }
  };

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const adminsFiltrados = administradores.filter((adm) => {
    if (filtroEstado === 'ACTIVOS' && !adm.activo) return false;
    if (filtroEstado === 'SUSPENDIDOS' && adm.activo) return false;

    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      adm.nombre.toLowerCase().includes(q) ||
      adm.email.toLowerCase().includes(q) ||
      (adm.telefonoContacto && adm.telefonoContacto.includes(q))
    );
  });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Banner Superior */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-stone-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Gestión de Administradores y Seguridad</h1>
              <p className="text-xs text-stone-500">
                Control de cuentas con privilegios administrativos, asignación de contraseñas temporales y auditoría de accesos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {esAdminPrincipal ? (
            <button
              id="btn-nuevo-admin"
              onClick={abrirCrear}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Crear Administrador</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 text-xs flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Modo Lectura (Solo Admin Principal puede editar)</span>
            </div>
          )}
        </div>
      </div>

      {/* Alertas */}
      {exitoMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center space-x-2 shadow-xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{exitoMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center space-x-2 shadow-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-stone-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo electrónico o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 text-xs font-semibold text-stone-700">
            <button
              onClick={() => setFiltroEstado('TODOS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroEstado === 'TODOS' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              Todos ({administradores.length})
            </button>
            <button
              onClick={() => setFiltroEstado('ACTIVOS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroEstado === 'ACTIVOS' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              Activos ({administradores.filter((a) => a.activo).length})
            </button>
            <button
              onClick={() => setFiltroEstado('SUSPENDIDOS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroEstado === 'SUSPENDIDOS' ? 'bg-white text-rose-800 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              Suspendidos ({administradores.filter((a) => !a.activo).length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Administradores */}
      {cargando ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl text-stone-500 text-xs shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-700" />
          Cargando cuentas administrativas...
        </div>
      ) : adminsFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl text-stone-500 text-xs shadow-xs">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          No se encontraron administradores con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminsFiltrados.map((admin) => {
            const esElUsuarioActual = admin.id === usuarioActual?.id;

            return (
              <div
                key={admin.id}
                id={`card-admin-${admin.id}`}
                className={`bg-white border rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between ${
                  admin.esAdminPrincipal
                    ? 'border-stone-400 ring-1 ring-stone-900/5'
                    : admin.activo
                    ? 'border-stone-200 hover:border-stone-300'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <UserAvatar nombre={admin.nombre} rol={admin.rol} size="lg" />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="text-sm font-bold text-stone-900">{admin.nombre}</h3>
                          {esElUsuarioActual && (
                            <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded-md font-semibold">
                              (Tú)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-stone-500 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1 text-stone-400" />
                          {admin.email}
                        </span>
                      </div>
                    </div>

                    {esAdminPrincipal && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => abrirEditar(admin)}
                          className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 transition-all border border-stone-200 shadow-xs"
                          title="Editar administrador"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!admin.esAdminPrincipal && (
                          <button
                            onClick={() => setModalEliminar(admin)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all border border-rose-200 shadow-xs"
                            title="Eliminar o desactivar administrador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Etiquetas de Rol */}
                  <div className="flex items-center gap-2 mt-3">
                    {admin.esAdminPrincipal ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold bg-stone-900 text-white px-2.5 py-1 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
                        Administrador Principal
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200">
                        <Shield className="w-3.5 h-3.5 text-stone-600 mr-1" />
                        Administrador
                      </span>
                    )}

                    {admin.debeCambiarPassword && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                        <KeyRound className="w-3 h-3 mr-0.5 text-amber-600" />
                        Clave Temporal
                      </span>
                    )}
                  </div>

                  {/* Datos del contacto */}
                  <div className="space-y-2 mt-4 pt-3 border-t border-stone-100 text-xs">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        Teléfono Móvil:
                      </span>
                      <span className="font-mono text-stone-900">{admin.telefonoContacto || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        Último Acceso:
                      </span>
                      <span className="text-stone-600 font-mono text-[11px]">
                        {admin.ultimoAcceso
                          ? new Date(admin.ultimoAcceso).toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' })
                          : 'Sin registro'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer de la tarjeta con acciones de suspensión */}
                <div className="pt-3 flex items-center justify-between border-t border-stone-100 text-[11px]">
                  <span
                    className={`inline-flex items-center space-x-1 font-semibold ${
                      admin.activo ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {admin.activo ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Activo en Sistema</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5 text-rose-600" />
                        <span>Acceso Suspendido</span>
                      </>
                    )}
                  </span>

                  {esAdminPrincipal && !admin.esAdminPrincipal && (
                    <button
                      onClick={() => handleToggleSuspension(admin)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        admin.activo
                          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {admin.activo ? 'Suspender' : 'Reactivar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Nuevo Administrador */}
      {modalCrear && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          onClick={() => setModalCrear(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-stone-900" />
                Registrar Nuevo Administrador
              </h3>
              <button
                onClick={() => setModalCrear(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Se creará la cuenta con privilegios administrativos y se asignará una contraseña temporal para su primer inicio de sesión.
            </p>

            <form onSubmit={handleCrearAdmin} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ana Lucía Rojas"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="ana.rojas@flota.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Teléfono Móvil *</label>
                  <input
                    type="text"
                    required
                    placeholder="+506 8899 0011"
                    value={formData.telefonoContacto}
                    onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Contraseña Temporal *</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.tempPassword}
                      onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 pr-8 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono font-bold"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600">
                <span className="font-semibold text-stone-800">Nota de Seguridad:</span> El usuario deberá ingresar con esta clave temporal y el sistema le solicitará cambiarla obligatoriamente en su primer ingreso.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalCrear(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold disabled:opacity-50 shadow-xs flex items-center space-x-1.5"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Crear Administrador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Administrador */}
      {modalEditar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          onClick={() => setModalEditar(null)}
        >
          <div
            className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center">
                <Edit2 className="w-4 h-4 mr-2 text-stone-700" />
                Editar Administrador: {modalEditar.nombre}
              </h3>
              <button
                onClick={() => setModalEditar(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditarAdmin} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Teléfono Móvil *</label>
                <input
                  type="text"
                  required
                  value={formData.telefonoContacto}
                  onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Restablecer Contraseña Temporal (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Dejar en blanco para mantener la actual"
                  value={formData.tempPassword}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>

              {!modalEditar.esAdminPrincipal && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-admin-activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    className="rounded bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <label htmlFor="chk-admin-activo" className="text-xs text-stone-700 font-medium">
                    Cuenta activa con acceso concedido al panel administrativo
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalEditar(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold disabled:opacity-50 shadow-xs"
                >
                  {guardando ? 'Guardando...' : 'Actualizar Administrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Credenciales Generadas */}
      {modalTempPass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          onClick={() => setModalTempPass(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-stone-900">Credenciales Generadas</h3>
              <p className="text-xs text-stone-500">
                Comparte estos accesos de forma segura con <strong>{modalTempPass.nombre}</strong>.
              </p>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3 font-mono text-xs">
              <div>
                <span className="text-[11px] text-stone-400 block font-sans">Correo de Acceso:</span>
                <strong className="text-stone-900">{modalTempPass.email}</strong>
              </div>
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-stone-400 block font-sans">Contraseña Temporal:</span>
                  <strong className="text-stone-900 text-sm font-bold bg-white px-2 py-0.5 rounded border border-stone-300 inline-block mt-0.5">
                    {modalTempPass.pass}
                  </strong>
                </div>
                <button
                  onClick={() =>
                    copiarAlPortapapeles(
                      `Accesos Sistema de Flota:\nUsuario: ${modalTempPass.email}\nContraseña Temporal: ${modalTempPass.pass}`
                    )
                  }
                  className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-sans font-semibold flex items-center space-x-1 hover:bg-stone-800 shadow-xs"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setModalTempPass(null)}
              className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 shadow-xs"
            >
              Entendido y Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación / Desactivación */}
      {modalEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          onClick={() => setModalEliminar(null)}
        >
          <div
            className="w-full max-w-md bg-white border border-stone-200 rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Eliminar Administrador</h3>
                <p className="text-xs text-stone-500">{modalEliminar.nombre}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-start space-x-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Política de Integridad y Auditoría:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Si el administrador tiene registros históricos asociados (como facturas validadas, depósitos bancarios o autorizaciones de combustible), la cuenta se <strong>desactivará automáticamente</strong> para preservar la trazabilidad contable y legal. Si no tiene historial previo, será eliminado permanentemente.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminar(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={handleConfirmarEliminar}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 shadow-xs"
              >
                {guardando ? 'Procesando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
