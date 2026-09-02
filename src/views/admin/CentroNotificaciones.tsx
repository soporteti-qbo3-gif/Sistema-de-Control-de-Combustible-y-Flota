/**
 * Centro de Avisos, Alertas y Notificaciones en Tiempo Real
 * Bandeja centralizada de comunicación operativa interna
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  Send,
  AlertTriangle,
  Key,
  Wrench,
  Info,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  User,
  PlusCircle,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { NotificacionSistema } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CentroNotificacionesProps {
  setVistaActiva?: (v: string) => void;
}

export const CentroNotificaciones: React.FC<CentroNotificacionesProps> = ({ setVistaActiva }) => {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'ADMIN';

  const [notificaciones, setNotificaciones] = useState<NotificacionSistema[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const [modalNuevoAviso, setModalNuevoAviso] = useState(false);
  const [enviandoAviso, setEnviandoAviso] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Formulario nuevo aviso
  const [nuevoAviso, setNuevoAviso] = useState({
    destinatarioNombre: 'Todos los Conductores',
    destinatarioRol: 'TODOS',
    tipo: 'AVISO_SISTEMA',
    titulo: '',
    contenido: '',
    prioridad: 'NORMAL',
  });

  const cargarNotificaciones = async () => {
    try {
      const data = await api.getNotificaciones();
      setNotificaciones(data);
    } catch (e) {
      console.error('Error al cargar notificaciones:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
    const interval = setInterval(cargarNotificaciones, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalNuevoAviso) {
        setModalNuevoAviso(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalNuevoAviso]);

  const handleMarcarLeida = async (id: string) => {
    try {
      await api.marcarNotificacionLeida(id);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leido: true } : n))
      );
    } catch (e) {
      console.error('Error al marcar leída:', e);
    }
  };

  const handleMarcarTodasLeidas = async () => {
    try {
      await api.marcarTodasLeidas();
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leido: true })));
      setMensajeExito('Todas las notificaciones fueron marcadas como leídas.');
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (e) {
      console.error('Error al marcar todas:', e);
    }
  };

  const handleEnviarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoAviso.titulo || !nuevoAviso.contenido) return;

    setEnviandoAviso(true);
    try {
      await api.enviarNotificacion(nuevoAviso);
      setModalNuevoAviso(false);
      setNuevoAviso({
        destinatarioNombre: 'Todos los Conductores',
        destinatarioRol: 'TODOS',
        tipo: 'AVISO_SISTEMA',
        titulo: '',
        contenido: '',
        prioridad: 'NORMAL',
      });
      setMensajeExito('Aviso emitido exitosamente a toda la flota.');
      setTimeout(() => setMensajeExito(null), 3500);
      await cargarNotificaciones();
    } catch (e: any) {
      alert('Error al emitir aviso: ' + e.message);
    } finally {
      setEnviandoAviso(false);
    }
  };

  // Filtrado
  const notificacionesFiltradas = notificaciones.filter((n) => {
    if (filtroTipo === 'NO_LEIDAS' && n.leido) return false;
    if (filtroTipo === 'SOLICITUDES' && !['SOLICITUD_AUTORIZACION', 'CODIGO_APROBACION', 'RECHAZO'].includes(n.tipo)) return false;
    if (filtroTipo === 'ALERTAS' && n.tipo !== 'ALERTA_ANOMALIA') return false;
    if (filtroTipo === 'MANTENIMIENTO' && n.tipo !== 'RECORDATORIO_MANTENIMIENTO') return false;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      return (
        n.titulo.toLowerCase().includes(q) ||
        n.contenido.toLowerCase().includes(q) ||
        n.remitente.toLowerCase().includes(q) ||
        n.destinatarioNombre.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalNoLeidas = notificaciones.filter((n) => !n.leido).length;
  const totalAlertas = notificaciones.filter((n) => n.tipo === 'ALERTA_ANOMALIA').length;
  const totalTokens = notificaciones.filter((n) => n.tipo === 'CODIGO_APROBACION').length;

  const renderIconoTipo = (tipo: NotificacionSistema['tipo']) => {
    switch (tipo) {
      case 'SOLICITUD_AUTORIZACION':
        return <Send className="w-5 h-5 text-sky-600" />;
      case 'CODIGO_APROBACION':
        return <Key className="w-5 h-5 text-emerald-600" />;
      case 'RECHAZO':
        return <X className="w-5 h-5 text-rose-600" />;
      case 'ALERTA_ANOMALIA':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'RECORDATORIO_MANTENIMIENTO':
        return <Wrench className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-slate-200 p-4 rounded-lg">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
              <Bell className="w-4 h-4" />
            </div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">Centro de Notificaciones y Avisos</h1>
            {totalNoLeidas > 0 && (
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-900 text-white font-mono">
                {totalNoLeidas} nuevas
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Historial de autorizaciones digitales, tokens emitidos, auditorías de combustible y avisos del sistema en tiempo real.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isAdmin && (
            <button
              id="btn-nuevo-aviso"
              onClick={() => setModalNuevoAviso(true)}
              className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Emitir Aviso</span>
            </button>
          )}

          {totalNoLeidas > 0 && (
            <button
              id="btn-marcar-todas"
              onClick={handleMarcarTodasLeidas}
              className="px-3 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1.5 transition-colors border border-slate-200"
            >
              <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Marcar todas como leídas</span>
            </button>
          )}

          <button
            onClick={cargarNotificaciones}
            className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200"
            title="Actualizar bandeja"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {mensajeExito && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center space-x-2 text-xs font-medium text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            Total Mensajes
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-semibold font-mono text-slate-900">{notificaciones.length}</span>
            <span className="text-xs text-slate-500">registros</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
            No Leídas
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-semibold font-mono text-slate-900">{totalNoLeidas}</span>
            <span className="text-xs text-slate-500">pendientes</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-amber-700 uppercase tracking-wider block mb-1">
            Alertas de Anomalía
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-semibold font-mono text-amber-700">{totalAlertas}</span>
            <span className="text-xs text-slate-500">auditoría</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-lg">
          <span className="text-[11px] font-medium text-slate-700 uppercase tracking-wider block mb-1">
            Tokens Autorizados
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-semibold font-mono text-slate-900">{totalTokens}</span>
            <span className="text-xs text-slate-500">despachos</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white border border-slate-200 p-2.5 rounded-lg">
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'NO_LEIDAS', label: `No Leídas (${totalNoLeidas})` },
            { id: 'SOLICITUDES', label: 'Autorizaciones' },
            { id: 'ALERTAS', label: 'Alertas IA' },
            { id: 'MANTENIMIENTO', label: 'Mantenimiento' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroTipo(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filtroTipo === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar avisos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md pl-7 pr-2.5 py-1.5 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Lista de Notificaciones */}
      <div className="space-y-2">
        {cargando ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-700" />
            Cargando notificaciones...
          </div>
        ) : notificacionesFiltradas.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
            <Bell className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            No hay notificaciones que coincidan con los filtros seleccionados.
          </div>
        ) : (
          notificacionesFiltradas.map((notif) => (
            <div
              key={notif.id}
              id={`notif-card-${notif.id}`}
              className={`p-3.5 rounded-lg border transition-colors flex flex-col sm:flex-row items-start justify-between gap-3 ${
                notif.leido
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-slate-50/70 border-slate-300'
              }`}
            >
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border ${
                    notif.tipo === 'ALERTA_ANOMALIA'
                      ? 'bg-amber-50 border-amber-200'
                      : notif.tipo === 'CODIGO_APROBACION'
                      ? 'bg-emerald-50 border-emerald-200'
                      : notif.tipo === 'RECHAZO'
                      ? 'bg-rose-50 border-rose-200'
                      : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {renderIconoTipo(notif.tipo)}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className={`text-sm truncate ${notif.leido ? 'text-slate-800 font-medium' : 'text-slate-900 font-semibold'}`}>
                      {notif.titulo}
                    </h3>
                    {!notif.leido && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    )}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium uppercase ${
                        notif.prioridad === 'URGENTE'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : notif.prioridad === 'ALTA'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {notif.prioridad}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed break-words">{notif.contenido}</p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 pt-0.5 flex-wrap">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-slate-400" />
                      {new Date(notif.fecha).toLocaleString('es-CR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>De: <strong className="text-slate-700 font-medium">{notif.remitente}</strong></span>
                    <span>Para: <strong className="text-slate-700 font-medium">{notif.destinatarioNombre}</strong></span>
                  </div>
                </div>
              </div>

              {/* Botones de acción rápida */}
              <div className="flex items-center space-x-1.5 sm:self-center w-full sm:w-auto justify-end pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                {notif.accionUrl && setVistaActiva && (
                  <button
                    onClick={() => {
                      if (!notif.leido) handleMarcarLeida(notif.id);
                      setVistaActiva(notif.accionUrl!);
                    }}
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 text-xs font-medium flex items-center space-x-1 transition-colors"
                  >
                    <span>Ver Detalles</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                )}

                {!notif.leido && (
                  <button
                    onClick={() => handleMarcarLeida(notif.id)}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
                    title="Marcar como leída"
                  >
                    Leída
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Aviso */}
      {modalNuevoAviso && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setModalNuevoAviso(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg p-5 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center">
                <Send className="w-4 h-4 mr-2 text-slate-700" />
                Emitir Notificación a la Flota
              </h3>
              <button
                onClick={() => setModalNuevoAviso(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnviarAviso} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Destinatario</label>
                <select
                  value={nuevoAviso.destinatarioRol}
                  onChange={(e) =>
                    setNuevoAviso({
                      ...nuevoAviso,
                      destinatarioRol: e.target.value,
                      destinatarioNombre: e.target.value === 'TODOS' ? 'Toda la Flota' : 'Conductores Activos',
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-slate-400 focus:bg-white"
                >
                  <option value="TODOS">Toda la Flota (Todos los usuarios)</option>
                  <option value="CONDUCTOR">Solo Conductores</option>
                  <option value="ADMIN">Administradores</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Prioridad</label>
                <select
                  value={nuevoAviso.prioridad}
                  onChange={(e) => setNuevoAviso({ ...nuevoAviso, prioridad: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-slate-400 focus:bg-white"
                >
                  <option value="NORMAL">Normal (Aviso informativo)</option>
                  <option value="ALTA">Alta (Instrucción operativa)</option>
                  <option value="URGENTE">Urgente (Alerta inmediata)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Título del Aviso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cambio de política de carga de fin de semana"
                  value={nuevoAviso.titulo}
                  onChange={(e) => setNuevoAviso({ ...nuevoAviso, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contenido *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Escribe el mensaje detallado para los conductores..."
                  value={nuevoAviso.contenido}
                  onChange={(e) => setNuevoAviso({ ...nuevoAviso, contenido: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoAviso(false)}
                  className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviandoAviso}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  {enviandoAviso ? 'Emitiendo...' : 'Enviar Notificación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
