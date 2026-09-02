/**
 * Módulo Administrativo: Gestión de Conductores y Asignación de Vehículos
 * Permite agregar, editar, suspender y eliminar conductores cumpliendo las políticas de auditoría.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Truck,
  Phone,
  Mail,
  Shield,
  Edit2,
  CheckCircle,
  XCircle,
  X,
  CreditCard,
  UserCheck,
  UserX,
  RefreshCw,
  Trash2,
  KeyRound,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../../services/api';
import { Usuario, Vehiculo } from '../../types';
import { UserAvatar } from '../../components/UserAvatar';

export const GestionConductores: React.FC = () => {
  const [conductores, setConductores] = useState<Usuario[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVOS' | 'SUSPENDIDOS'>('TODOS');

  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [conductorEditando, setConductorEditando] = useState<Usuario | null>(null);
  const [modalEliminar, setModalEliminar] = useState<Usuario | null>(null);
  const [modalTempPass, setModalTempPass] = useState<{ nombre: string; email: string; pass: string } | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefonoContacto: '',
    licencia: '',
    vehiculoAsignadoId: '',
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
      const [conds, vehs] = await Promise.all([api.getConductores(), api.getVehiculos()]);
      setConductores(conds);
      setVehiculos(vehs);
    } catch (e: any) {
      console.error('Error cargando conductores:', e);
      setErrorMsg('Error al conectar con el servidor.');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalAbierto(false);
        setModalEliminar(null);
        setModalTempPass(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const abrirCrear = () => {
    setConductorEditando(null);
    const passSugerido = `Chofer#${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      nombre: '',
      email: '',
      telefonoContacto: '',
      licencia: '',
      vehiculoAsignadoId: '',
      tempPassword: passSugerido,
      activo: true,
    });
    setErrorMsg(null);
    setModalAbierto(true);
  };

  const abrirEditar = (cond: Usuario) => {
    setConductorEditando(cond);
    setFormData({
      nombre: cond.nombre,
      email: cond.email,
      telefonoContacto: cond.telefonoContacto || cond.telefonoWhatsapp || '',
      licencia: cond.licencia || '',
      vehiculoAsignadoId: cond.vehiculoAsignadoId || '',
      tempPassword: '',
      activo: cond.activo,
    });
    setErrorMsg(null);
    setModalAbierto(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setGuardando(true);

    try {
      if (conductorEditando) {
        await api.updateUsuario(conductorEditando.id, {
          nombre: formData.nombre,
          email: formData.email,
          telefonoContacto: formData.telefonoContacto,
          licencia: formData.licencia || undefined,
          vehiculoAsignadoId: formData.vehiculoAsignadoId || undefined,
          activo: formData.activo,
          tempPassword: formData.tempPassword || undefined,
        });
        notificarExito(`Conductor ${formData.nombre} actualizado exitosamente.`);
      } else {
        const res = await api.createConductorUser({
          nombre: formData.nombre,
          email: formData.email,
          telefonoContacto: formData.telefonoContacto,
          licencia: formData.licencia || undefined,
          vehiculoAsignadoId: formData.vehiculoAsignadoId || undefined,
          tempPassword: formData.tempPassword,
          activo: formData.activo,
        });

        notificarExito(`Conductor ${res.usuario.nombre} registrado exitosamente.`);
        if (res.usuario.tempPassword) {
          setModalTempPass({
            nombre: res.usuario.nombre,
            email: res.usuario.email,
            pass: res.usuario.tempPassword,
          });
        }
      }
      setModalAbierto(false);
      await cargarDatos();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar conductor.');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleSuspension = async (cond: Usuario) => {
    try {
      if (cond.activo) {
        await api.suspenderUsuario(cond.id);
        notificarExito(`Conductor ${cond.nombre} suspendido. No podrá ingresar al sistema ni subir cargas.`);
      } else {
        await api.activarUsuario(cond.id);
        notificarExito(`Conductor ${cond.nombre} reactivado exitosamente.`);
      }
      await cargarDatos();
    } catch (err: any) {
      notificarError(err.message || 'Error al cambiar estado del conductor.');
    }
  };

  const handleConfirmarEliminar = async () => {
    if (!modalEliminar) return;
    setGuardando(true);
    try {
      const res = await api.deleteUsuario(modalEliminar.id);
      setModalEliminar(null);
      notificarExito(res.message || 'Operación realizada correctamente.');
      await cargarDatos();
    } catch (err: any) {
      notificarError(err.message || 'Error al eliminar conductor.');
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

  const conductoresFiltrados = conductores.filter((c) => {
    if (filtroEstado === 'ACTIVOS' && !c.activo) return false;
    if (filtroEstado === 'SUSPENDIDOS' && c.activo) return false;

    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.licencia && c.licencia.toLowerCase().includes(q)) ||
      (c.telefonoContacto && c.telefonoContacto.includes(q))
    );
  });

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-stone-200 p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Gestión del Personal y Conductores</h1>
              <p className="text-xs text-stone-500">
                Control de choferes autorizados, licencias de conducir, asignación de unidades y estados de suspensión.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="btn-nuevo-conductor"
            onClick={abrirCrear}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Conductor</span>
          </button>
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

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-stone-200 p-3 rounded-xl shadow-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo, licencia o teléfono..."
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
              Todos ({conductores.length})
            </button>
            <button
              onClick={() => setFiltroEstado('ACTIVOS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroEstado === 'ACTIVOS' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              Activos ({conductores.filter((c) => c.activo).length})
            </button>
            <button
              onClick={() => setFiltroEstado('SUSPENDIDOS')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filtroEstado === 'SUSPENDIDOS' ? 'bg-white text-rose-800 shadow-xs' : 'hover:text-stone-900'
              }`}
            >
              Suspendidos ({conductores.filter((c) => !c.activo).length})
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Conductores */}
      {cargando ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl text-stone-500 text-xs shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-700" />
          Cargando personal de conducción...
        </div>
      ) : conductoresFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-2xl text-stone-500 text-xs shadow-xs">
          <Users className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          No se encontraron conductores con los filtros actuales.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conductoresFiltrados.map((cond) => {
            const vehiculoAsignado = vehiculos.find((v) => v.id === cond.vehiculoAsignadoId);

            return (
              <div
                key={cond.id}
                id={`card-conductor-${cond.id}`}
                className={`bg-white border rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between ${
                  cond.activo ? 'border-stone-200 hover:border-stone-300' : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <UserAvatar nombre={cond.nombre} rol={cond.rol} size="lg" />
                      <div>
                        <h3 className="text-sm font-bold text-stone-900">{cond.nombre}</h3>
                        <span className="text-[11px] text-stone-500 flex items-center mt-0.5">
                          <Mail className="w-3 h-3 mr-1 text-stone-400" />
                          {cond.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => abrirEditar(cond)}
                        className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 transition-all border border-stone-200 shadow-xs"
                        title="Editar conductor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setModalEliminar(cond)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all border border-rose-200 shadow-xs"
                        title="Eliminar o desactivar conductor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 pt-3 border-t border-stone-100 text-xs">
                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center">
                        <Phone className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        Teléfono Móvil:
                      </span>
                      <span className="font-mono text-stone-900">{cond.telefonoContacto || cond.telefonoWhatsapp || 'N/A'}</span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center">
                        <CreditCard className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        Licencia:
                      </span>
                      <span className="font-mono font-semibold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                        {cond.licencia || 'En trámite'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-stone-700">
                      <span className="text-stone-500 flex items-center">
                        <Truck className="w-3.5 h-3.5 mr-1 text-stone-400" />
                        Vehículo Asignado:
                      </span>
                      {vehiculoAsignado ? (
                        <span className="font-bold text-stone-900 font-mono">
                          {vehiculoAsignado.placa} ({vehiculoAsignado.marca})
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">Sin unidad fija</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between border-t border-stone-100 text-[11px]">
                  <span
                    className={`inline-flex items-center space-x-1 font-semibold ${
                      cond.activo ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {cond.activo ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Activo en Turno</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5 text-rose-600" />
                        <span>Suspendido</span>
                      </>
                    )}
                  </span>

                  <button
                    onClick={() => handleToggleSuspension(cond)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                      cond.activo
                        ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {cond.activo ? 'Suspender' : 'Reactivar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-stone-200 rounded-2xl shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 flex items-center">
                <Users className="w-4 h-4 mr-2 text-stone-700" />
                {conductorEditando ? 'Editar Conductor' : 'Nuevo Registro de Conductor'}
              </h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
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
                    placeholder="carlos@flota.com"
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
                    placeholder="+506 8888 1234"
                    value={formData.telefonoContacto}
                    onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Número de Licencia</label>
                  <input
                    type="text"
                    placeholder="LIC-FEDERAL-A-12345"
                    value={formData.licencia}
                    onChange={(e) => setFormData({ ...formData, licencia: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Asignar Vehículo</label>
                <select
                  value={formData.vehiculoAsignadoId}
                  onChange={(e) => setFormData({ ...formData, vehiculoAsignadoId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                >
                  <option value="">-- Sin vehículo asignado actualmente --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} • {v.marca} {v.modelo} ({v.tipoCombustible})
                    </option>
                  ))}
                </select>
              </div>

              {!conductorEditando && (
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
              )}

              {conductorEditando && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Restablecer Contraseña Temporal (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Dejar en blanco para mantener la contraseña actual"
                    value={formData.tempPassword}
                    onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="rounded bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="chk-activo" className="text-xs text-stone-700 font-medium">
                  Conductor activo y autorizado para operar unidades
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold disabled:opacity-50 shadow-xs"
                >
                  {guardando ? 'Guardando...' : conductorEditando ? 'Actualizar' : 'Guardar Conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Credenciales Temporales */}
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
              <h3 className="text-base font-bold text-stone-900">Acceso de Conductor Generado</h3>
              <p className="text-xs text-stone-500">
                Comparte las credenciales con <strong>{modalTempPass.nombre}</strong> para ingresar a la App Móvil.
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
                      `Accesos Conductor - Control de Flota:\nUsuario: ${modalTempPass.email}\nContraseña Temporal: ${modalTempPass.pass}`
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
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmación Eliminación / Suspensión */}
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
                <h3 className="text-sm font-bold text-stone-900">Eliminar Conductor</h3>
                <p className="text-xs text-stone-500">{modalEliminar.nombre}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-start space-x-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Política de Integridad de Datos:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Si el conductor cuenta con registros históricos de cargas de combustible, solicitudes de token o mantenimientos asignados, la cuenta se <strong>desactivará automáticamente</strong> para proteger la bitácora contable. Si no tiene historial, se eliminará permanentemente.
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
                {guardando ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
