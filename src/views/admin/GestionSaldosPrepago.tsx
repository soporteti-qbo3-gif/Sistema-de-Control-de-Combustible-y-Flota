/**
 * Módulo de Saldos Prepago y Catálogo de Estaciones de Servicio (Bombas)
 * Permite registrar depósitos, ajustar saldos, configurar umbrales de alerta,
 * ver historial completo de movimientos (depósitos, descuentos automáticos y ajustes),
 * administrar el catálogo de estaciones (CRUD, activación/desactivación y política de borrado seguro)
 * y supervisar el balance prepagado disponible para la flota.
 */

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  PlusCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Filter,
  Fuel,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Sliders,
  CheckCircle2,
  X,
  History,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Layers,
  ArrowRight,
  Download,
  Info,
  Edit2,
  Trash2,
  MapPin,
  Check,
  ShieldAlert,
  Power,
} from 'lucide-react';
import { api } from '../../services/api';
import { SaldoEstacion, MovimientoSaldo, Estacion } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const GestionSaldosPrepago: React.FC = () => {
  const { usuario } = useAuth();
  const esAdminPrincipal = !!usuario?.esAdminPrincipal;

  const [saldos, setSaldos] = useState<SaldoEstacion[]>([]);
  const [estaciones, setEstaciones] = useState<Estacion[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoSaldo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [tabActivo, setTabActivo] = useState<'cuentas' | 'estaciones' | 'historial'>('cuentas');

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState<'TODOS' | 'ALERTAS' | 'NORMAL'>('TODOS');
  const [filtroTipoMov, setFiltroTipoMov] = useState<string>('TODOS');
  const [filtroEstacionMov, setFiltroEstacionMov] = useState<string>('TODAS');

  // Modales de Saldos
  const [modalDeposito, setModalDeposito] = useState<SaldoEstacion | null>(null);
  const [montoDeposito, setMontoDeposito] = useState<number | ''>('');
  const [fechaDeposito, setFechaDeposito] = useState(new Date().toISOString().split('T')[0]);
  const [referenciaDeposito, setReferenciaDeposito] = useState('');
  const [notasDeposito, setNotasDeposito] = useState('');

  const [modalAjuste, setModalAjuste] = useState<SaldoEstacion | null>(null);
  const [nuevoSaldoAjuste, setNuevoSaldoAjuste] = useState<number | ''>('');
  const [notasAjuste, setNotasAjuste] = useState('');

  const [modalUmbral, setModalUmbral] = useState<SaldoEstacion | null>(null);
  const [nuevoUmbral, setNuevoUmbral] = useState<number | ''>('');

  const [modalHistorialSaldo, setModalHistorialSaldo] = useState<SaldoEstacion | null>(null);
  const [movimientosSaldoIndividual, setMovimientosSaldoIndividual] = useState<MovimientoSaldo[]>([]);
  const [cargandoMovsIndividual, setCargandoMovsIndividual] = useState(false);

  // Modales de Estaciones (Bombas)
  const [modalCrearEstacion, setModalCrearEstacion] = useState(false);
  const [modalEditarEstacion, setModalEditarEstacion] = useState<Estacion | null>(null);
  const [modalEliminarEstacion, setModalEliminarEstacion] = useState<Estacion | null>(null);

  const [formEstacion, setFormEstacion] = useState({
    nombre: '',
    ubicacion: '',
    direccion: '',
    moneda: 'CRC',
    combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Súper'],
    activo: true,
    saldoInicial: 100000,
    umbralAlerta: 50000,
  });

  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const COMBUSTIBLES_OPCIONES = [
    'Diesel',
    'Diesel 50',
    'Gasolina Regular',
    'Gasolina Súper',
    'GLP',
    'Eléctrico',
  ];

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [saldosData, estData, movsData] = await Promise.all([
        api.getSaldos(),
        api.getEstaciones(),
        api.getTodosMovimientos(),
      ]);
      setSaldos(saldosData);
      setEstaciones(estData);
      setMovimientos(movsData);
    } catch (err: any) {
      setMensajeError('Error cargando datos de saldos y estaciones.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Notificaciones temporales
  const mostrarExito = (msg: string) => {
    setMensajeExito(msg);
    setMensajeError(null);
    setTimeout(() => setMensajeExito(null), 4500);
  };

  const mostrarError = (msg: string) => {
    setMensajeError(msg);
    setMensajeExito(null);
    setTimeout(() => setMensajeError(null), 5000);
  };

  // Acciones de Saldos
  const handleRegistrarDeposito = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDeposito || !montoDeposito || Number(montoDeposito) <= 0) {
      mostrarError('Por favor ingrese un monto válido mayor a cero.');
      return;
    }

    setProcesando(true);
    try {
      await api.registrarDeposito(modalDeposito.id, {
        monto: Number(montoDeposito),
        fechaDeposito,
        notas: notasDeposito,
        comprobanteReferencia: referenciaDeposito,
      });

      mostrarExito(`Depósito de ₡${Number(montoDeposito).toLocaleString('es-CR')} registrado correctamente.`);
      setModalDeposito(null);
      setMontoDeposito('');
      setReferenciaDeposito('');
      setNotasDeposito('');
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al registrar el depósito.');
    } finally {
      setProcesando(false);
    }
  };

  const handleAjustarSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAjuste || nuevoSaldoAjuste === '' || Number(nuevoSaldoAjuste) < 0) {
      mostrarError('Por favor ingrese un saldo válido igual o mayor a cero.');
      return;
    }
    if (!notasAjuste.trim()) {
      mostrarError('Debe ingresar el motivo o justificación del ajuste.');
      return;
    }

    setProcesando(true);
    try {
      await api.ajustarSaldo(modalAjuste.id, {
        nuevoSaldo: Number(nuevoSaldoAjuste),
        notas: notasAjuste,
      });

      mostrarExito(`Saldo de ${modalAjuste.estacionNombre} ajustado a ₡${Number(nuevoSaldoAjuste).toLocaleString('es-CR')}.`);
      setModalAjuste(null);
      setNuevoSaldoAjuste('');
      setNotasAjuste('');
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al ajustar el saldo.');
    } finally {
      setProcesando(false);
    }
  };

  const handleActualizarUmbral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalUmbral || nuevoUmbral === '' || Number(nuevoUmbral) < 0) {
      mostrarError('Por favor ingrese un umbral válido.');
      return;
    }

    setProcesando(true);
    try {
      await api.actualizarUmbral(modalUmbral.id, Number(nuevoUmbral));
      mostrarExito(`Umbral de alerta actualizado a ₡${Number(nuevoUmbral).toLocaleString('es-CR')}.`);
      setModalUmbral(null);
      setNuevoUmbral('');
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al actualizar el umbral.');
    } finally {
      setProcesando(false);
    }
  };

  const abrirHistorialIndividual = async (saldo: SaldoEstacion) => {
    setModalHistorialSaldo(saldo);
    setCargandoMovsIndividual(true);
    try {
      const movs = await api.getMovimientosSaldo(saldo.id);
      setMovimientosSaldoIndividual(movs);
    } catch (e) {
      console.error('Error cargando movimientos individuales:', e);
    } finally {
      setCargandoMovsIndividual(false);
    }
  };

  // Manejo de Estaciones (Bombas)
  const abrirCrearEstacion = () => {
    setFormEstacion({
      nombre: '',
      ubicacion: '',
      direccion: '',
      moneda: 'CRC',
      combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Súper'],
      activo: true,
      saldoInicial: 100000,
      umbralAlerta: 50000,
    });
    setModalCrearEstacion(true);
  };

  const abrirEditarEstacion = (est: Estacion) => {
    setModalEditarEstacion(est);
    setFormEstacion({
      nombre: est.nombre,
      ubicacion: est.ubicacion || '',
      direccion: est.direccion || '',
      moneda: est.moneda || 'CRC',
      combustiblesDisponibles: est.combustiblesDisponibles || ['Diesel', 'Gasolina Regular'],
      activo: est.activo,
      saldoInicial: 0,
      umbralAlerta: 50000,
    });
  };

  const toggleCombustibleSeleccionado = (comb: string) => {
    setFormEstacion((prev) => {
      const existe = prev.combustiblesDisponibles.includes(comb);
      if (existe) {
        if (prev.combustiblesDisponibles.length <= 1) return prev; // Al menos uno
        return { ...prev, combustiblesDisponibles: prev.combustiblesDisponibles.filter((c) => c !== comb) };
      } else {
        return { ...prev, combustiblesDisponibles: [...prev.combustiblesDisponibles, comb] };
      }
    });
  };

  const handleCrearEstacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEstacion.nombre.trim()) {
      mostrarError('El nombre de la estación es obligatorio.');
      return;
    }

    setProcesando(true);
    try {
      // 1. Crear estación en catálogo
      await api.createEstacion({
        nombre: formEstacion.nombre.trim(),
        ubicacion: formEstacion.ubicacion.trim(),
        direccion: formEstacion.direccion.trim(),
        moneda: formEstacion.moneda || 'CRC',
        combustiblesDisponibles: formEstacion.combustiblesDisponibles,
        activo: formEstacion.activo,
      });

      // 2. Si se especificó saldo inicial o umbral, crear/asegurar saldo prepago
      try {
        await api.createSaldo({
          estacionNombre: formEstacion.nombre.trim(),
          saldoInicial: Number(formEstacion.saldoInicial) || 0,
          umbralAlerta: Number(formEstacion.umbralAlerta) || 50000,
          moneda: formEstacion.moneda || 'CRC',
        });
      } catch (errSaldo) {
        console.warn('Saldo prepago ya inicializado o creado automáticamente:', errSaldo);
      }

      mostrarExito(`Estación "${formEstacion.nombre}" registrada correctamente con cuenta de saldo.`);
      setModalCrearEstacion(false);
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al registrar estación.');
    } finally {
      setProcesando(false);
    }
  };

  const handleActualizarEstacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEditarEstacion) return;

    setProcesando(true);
    try {
      await api.updateEstacion(modalEditarEstacion.id, {
        nombre: formEstacion.nombre.trim(),
        ubicacion: formEstacion.ubicacion.trim(),
        direccion: formEstacion.direccion.trim(),
        moneda: formEstacion.moneda || 'CRC',
        combustiblesDisponibles: formEstacion.combustiblesDisponibles,
        activo: formEstacion.activo,
      });

      mostrarExito(`Estación "${formEstacion.nombre}" actualizada.`);
      setModalEditarEstacion(null);
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al actualizar estación.');
    } finally {
      setProcesando(false);
    }
  };

  const handleToggleEstadoEstacion = async (est: Estacion) => {
    try {
      if (est.activo) {
        await api.desactivarEstacion(est.id);
        mostrarExito(`Estación "${est.nombre}" desactivada.`);
      } else {
        await api.activarEstacion(est.id);
        mostrarExito(`Estación "${est.nombre}" reactivada exitosamente.`);
      }
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al cambiar estado de la estación.');
    }
  };

  const handleConfirmarEliminarEstacion = async () => {
    if (!modalEliminarEstacion) return;
    setProcesando(true);
    try {
      const res = await api.deleteEstacion(modalEliminarEstacion.id);
      setModalEliminarEstacion(null);
      mostrarExito(res.message || 'Operación completada.');
      await cargarDatos();
    } catch (err: any) {
      mostrarError(err.message || 'Error al eliminar la estación.');
      setModalEliminarEstacion(null);
    } finally {
      setProcesando(false);
    }
  };

  // Métricas globales
  const totalSaldoDisponible = saldos.reduce((acc, s) => acc + s.saldoActual, 0);
  const totalBombasEnAlerta = saldos.filter((s) => s.enAlerta || s.saldoActual <= s.umbralAlerta);
  const totalDepositadoMes = movimientos
    .filter((m) => m.tipo === 'deposito' || m.tipo === 'carga_inicial' || (m.tipo === 'ajuste' && m.monto > 0))
    .reduce((acc, m) => acc + Math.max(0, m.monto), 0);
  const totalDescontadoFacturas = movimientos
    .filter((m) => m.tipo === 'descuento')
    .reduce((acc, m) => acc + Math.abs(m.monto), 0);

  // Filtrado de cuentas
  const saldosFiltrados = saldos.filter((s) => {
    const coincideTexto = s.estacionNombre.toLowerCase().includes(busqueda.toLowerCase());

    const estaEnAlerta = s.enAlerta || s.saldoActual <= s.umbralAlerta;
    const coincideAlerta =
      filtroAlerta === 'TODOS'
        ? true
        : filtroAlerta === 'ALERTAS'
        ? estaEnAlerta
        : !estaEnAlerta;

    return coincideTexto && coincideAlerta;
  });

  // Filtrado de estaciones
  const estacionesFiltradas = estaciones.filter((est) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      est.nombre.toLowerCase().includes(q) ||
      (est.ubicacion && est.ubicacion.toLowerCase().includes(q)) ||
      (est.direccion && est.direccion.toLowerCase().includes(q))
    );
  });

  // Filtrado de historial general
  const movimientosFiltrados = movimientos.filter((m) => {
    const coincideTipo = filtroTipoMov === 'TODOS' ? true : m.tipo === filtroTipoMov;
    const coincideEstacion =
      filtroEstacionMov === 'TODAS'
        ? true
        : m.estacionNombre.toLowerCase() === filtroEstacionMov.toLowerCase();
    return coincideTipo && coincideEstacion;
  });

  const exportarHistorialCSV = () => {
    const encabezados = ['ID', 'Fecha', 'Estacion', 'CombustibleBitacora', 'Tipo', 'Monto', 'SaldoAnterior', 'SaldoNuevo', 'FacturaTicket', 'Vehiculo', 'Usuario', 'Notas'];
    const filas = movimientosFiltrados.map((m) => [
      m.id,
      m.fechaDeposito || m.fecha.split('T')[0],
      `"${m.estacionNombre}"`,
      `"${m.tipoCombustible || 'N/A'}"`,
      m.tipo,
      m.monto,
      m.saldoAnterior,
      m.saldoNuevo,
      m.numeroTicket || '',
      m.vehiculoPlaca || '',
      `"${m.usuarioNombre}"`,
      `"${(m.notas || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `historial_saldos_prepago_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-stone-900">
            <div className="p-2 bg-stone-900 text-white rounded-xl shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Caja Chica y Saldos Prepago</h1>
              <p className="text-xs text-stone-500 font-medium">
                Control de fondos de caja chica, depósitos, saldos por estación, deducciones automáticas y conciliación de movimientos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={cargarDatos}
            disabled={cargando}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition-all flex items-center space-x-1.5 shadow-xs"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <button
            type="button"
            onClick={abrirCrearEstacion}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Nueva Estación / Bomba</span>
          </button>
        </div>
      </div>

      {/* Notificaciones */}
      {mensajeExito && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-medium animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {mensajeError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-rose-800 text-xs font-medium animate-in fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{mensajeError}</span>
        </div>
      )}

      {/* Alertas Críticas de Saldo Bajo */}
      {totalBombasEnAlerta.length > 0 && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>{totalBombasEnAlerta.length} Estación(es) con Saldo Prepago Crítico (Menor al Umbral de Alerta)</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full">
              Atención Requerida
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {totalBombasEnAlerta.map((bomba) => (
              <div
                key={bomba.id}
                className="bg-white p-3 rounded-xl border border-rose-200 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-stone-900">{bomba.estacionNombre}</p>
                  <p className="text-rose-600 font-mono font-bold mt-1">
                    ₡{bomba.saldoActual.toLocaleString('es-CR')}{' '}
                    <span className="text-stone-400 font-normal text-[10px]">/ Min: ₡{bomba.umbralAlerta.toLocaleString('es-CR')}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalDeposito(bomba);
                    setMontoDeposito(100000);
                  }}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                >
                  Depositar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas de Métricas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Saldo Total Disponible</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 font-mono">
            ₡{totalSaldoDisponible.toLocaleString('es-CR')}
          </p>
          <p className="text-[11px] text-stone-500 flex items-center space-x-1">
            <span>En {saldos.length} estaciones activas</span>
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Total Depositado</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 font-mono">
            ₡{totalDepositadoMes.toLocaleString('es-CR')}
          </p>
          <p className="text-[11px] text-stone-500">
            Fondos acreditados a estaciones
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Descontado Automático</span>
            <TrendingDown className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-stone-900 font-mono">
            ₡{totalDescontadoFacturas.toLocaleString('es-CR')}
          </p>
          <p className="text-[11px] text-stone-500">
            Deducido en validación de facturas
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-500 text-xs font-semibold">
            <span>Estaciones en Alerta</span>
            <AlertTriangle className={`w-4 h-4 ${totalBombasEnAlerta.length > 0 ? 'text-rose-600' : 'text-stone-400'}`} />
          </div>
          <p className={`text-2xl font-black font-mono ${totalBombasEnAlerta.length > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
            {totalBombasEnAlerta.length}
          </p>
          <p className="text-[11px] text-stone-500">
            {totalBombasEnAlerta.length > 0 ? 'Requieren recarga urgente' : 'Todas con fondos óptimos'}
          </p>
        </div>
      </div>

      {/* Navegación por 3 Pestañas */}
      <div className="flex items-center space-x-2 border-b border-stone-200">
        <button
          type="button"
          onClick={() => setTabActivo('cuentas')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            tabActivo === 'cuentas'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Saldos por Estación ({saldos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActivo('estaciones')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            tabActivo === 'estaciones'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Catálogo de Estaciones y Bombas ({estaciones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActivo('historial')}
          className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
            tabActivo === 'historial'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-400 hover:text-stone-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Bitácora de Movimientos ({movimientos.length})</span>
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: CUENTAS POR BOMBA */}
      {tabActivo === 'cuentas' && (
        <div className="space-y-4">
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Buscar por nombre de estación..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-[11px] font-bold text-stone-500 flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Estado:</span>
              </span>
              <div className="flex bg-stone-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFiltroAlerta('TODOS')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filtroAlerta === 'TODOS' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Todos ({saldos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroAlerta('ALERTAS')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filtroAlerta === 'ALERTAS' ? 'bg-white text-rose-700 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Bajo Umbral ({totalBombasEnAlerta.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroAlerta('NORMAL')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filtroAlerta === 'NORMAL' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500'
                  }`}
                >
                  Normal ({saldos.length - totalBombasEnAlerta.length})
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Tarjetas de Saldos */}
          {saldosFiltrados.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 space-y-2">
              <Fuel className="w-10 h-10 mx-auto text-stone-300" />
              <p className="text-sm font-bold text-stone-600">No se encontraron bombas o saldos</p>
              <p className="text-xs">Pruebe ajustando los filtros o agregue una nueva estación de servicio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {saldosFiltrados.map((saldo) => {
                const enAlerta = saldo.enAlerta || saldo.saldoActual <= saldo.umbralAlerta;
                const ratio = saldo.umbralAlerta > 0 ? Math.min(100, Math.round((saldo.saldoActual / (saldo.umbralAlerta * 2)) * 100)) : 100;

                return (
                  <div
                    key={saldo.id}
                    className={`bg-white rounded-2xl border transition-all p-4 space-y-3.5 shadow-xs flex flex-col justify-between ${
                      enAlerta ? 'border-rose-300 ring-1 ring-rose-200' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-stone-900">{saldo.estacionNombre}</h3>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold flex items-center space-x-1">
                              <Fuel className="w-3 h-3 text-stone-500" />
                              <span>Saldo Prepago Unificado</span>
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">CRC</span>
                          </div>
                        </div>

                        {enAlerta ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold flex items-center space-x-1 flex-shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Bajo Umbral</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center space-x-1 flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Óptimo</span>
                          </span>
                        )}
                      </div>

                      {/* Saldo Actual y Umbral */}
                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Saldo Disponible
                        </span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <p
                            className={`text-2xl font-black font-mono ${
                              enAlerta ? 'text-rose-600' : 'text-stone-900'
                            }`}
                          >
                            ₡{saldo.saldoActual.toLocaleString('es-CR')}
                          </p>
                          <span className="text-[11px] text-stone-500 font-medium">
                            Mínimo: ₡{saldo.umbralAlerta.toLocaleString('es-CR')}
                          </span>
                        </div>

                        {/* Barra de nivel */}
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all ${
                              enAlerta ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, ratio)}%` }}
                          />
                        </div>
                      </div>

                      {/* Estadísticas de la bomba */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-100 text-[11px]">
                        <div>
                          <span className="text-stone-400 block text-[10px]">Total Depositado</span>
                          <span className="font-bold text-stone-700 font-mono">
                            ₡{(saldo.totalDepositado || 0).toLocaleString('es-CR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-stone-400 block text-[10px]">Total Descontado</span>
                          <span className="font-bold text-amber-700 font-mono">
                            ₡{(saldo.totalDescontado || 0).toLocaleString('es-CR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setModalDeposito(saldo);
                          setMontoDeposito(100000);
                          setFechaDeposito(new Date().toISOString().split('T')[0]);
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Depositar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => abrirHistorialIndividual(saldo)}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                        title="Ver historial de movimientos"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalAjuste(saldo);
                          setNuevoSaldoAjuste(saldo.saldoActual);
                        }}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                        title="Ajuste manual de saldo"
                      >
                        <Sliders className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setModalUmbral(saldo);
                          setNuevoUmbral(saldo.umbralAlerta);
                        }}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all"
                        title="Editar umbral de alerta"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: CATÁLOGO DE ESTACIONES Y BOMBAS */}
      {tabActivo === 'estaciones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-stone-200 p-3 rounded-xl shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, ubicación o dirección..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 text-stone-900 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="text-xs text-stone-500 font-medium">
              Total: <strong className="text-stone-900 font-mono">{estaciones.length}</strong> estaciones registradas
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estacionesFiltradas.map((est) => {
              const saldoAsociado = saldos.find(
                (s) => s.estacionNombre.toLowerCase() === est.nombre.toLowerCase()
              );

              return (
                <div
                  key={est.id}
                  className={`bg-white border rounded-2xl p-5 space-y-4 transition-all shadow-xs flex flex-col justify-between ${
                    est.activo ? 'border-stone-200 hover:border-stone-300' : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-stone-900">{est.nombre}</h3>
                          <span className="text-[11px] text-stone-500 flex items-center mt-0.5">
                            <MapPin className="w-3 h-3 mr-1 text-stone-400" />
                            {est.ubicacion || est.direccion || 'Costa Rica'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => abrirEditarEstacion(est)}
                          className="p-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-700 transition-all border border-stone-200 shadow-xs"
                          title="Editar estación"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {esAdminPrincipal && (
                          <button
                            onClick={() => setModalEliminarEstacion(est)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all border border-rose-200 shadow-xs"
                            title="Eliminar o desactivar estación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Combustibles disponibles */}
                    <div className="mt-3.5 pt-3 border-t border-stone-100">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                        Combustibles Habilitados
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {est.combustiblesDisponibles?.map((c) => (
                          <span
                            key={c}
                            className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-semibold border border-stone-200"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Balance prepagado actual */}
                    <div className="mt-3 pt-3 border-t border-stone-100 text-xs flex justify-between items-center">
                      <span className="text-stone-500">Saldo Prepago:</span>
                      <span className="font-mono font-bold text-stone-900">
                        {saldoAsociado ? `₡${saldoAsociado.saldoActual.toLocaleString('es-CR')}` : 'Sin saldo'}
                      </span>
                    </div>
                  </div>

                  {/* Footer con estado y toggle */}
                  <div className="pt-3 flex items-center justify-between border-t border-stone-100 text-[11px]">
                    <span
                      className={`inline-flex items-center space-x-1 font-semibold ${
                        est.activo ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {est.activo ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Estación Activa</span>
                        </>
                      ) : (
                        <>
                          <Power className="w-3.5 h-3.5 text-rose-600" />
                          <span>Inactiva / Bloqueada</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => handleToggleEstadoEstacion(est)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        est.activo
                          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {est.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: HISTORIAL GENERAL DE MOVIMIENTOS */}
      {tabActivo === 'historial' && (
        <div className="space-y-4">
          {/* Filtros de Historial */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-stone-200">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div>
                <label className="text-[10px] font-bold text-stone-400 block mb-0.5">Tipo Movimiento</label>
                <select
                  value={filtroTipoMov}
                  onChange={(e) => setFiltroTipoMov(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="deposito">Depósitos (+)</option>
                  <option value="descuento">Descuentos Factura (-)</option>
                  <option value="ajuste">Ajustes Manuales</option>
                  <option value="carga_inicial">Cargas Iniciales</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-400 block mb-0.5">Estación</label>
                <select
                  value={filtroEstacionMov}
                  onChange={(e) => setFiltroEstacionMov(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 text-xs bg-stone-50 font-semibold focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="TODAS">Todas las estaciones</option>
                  {Array.from(new Set(movimientos.map((m) => m.estacionNombre))).map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={exportarHistorialCSV}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all flex items-center space-x-1.5 self-end sm:self-auto shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Tabla de Movimientos */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Bomba / Estación</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-right">Saldo Resultante</th>
                    <th className="py-3 px-4">Detalle / Factura</th>
                    <th className="py-3 px-4">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                  {movimientosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-400">
                        No hay movimientos registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    movimientosFiltrados.map((mov) => {
                      const esPositivo = mov.monto > 0;

                      return (
                        <tr key={mov.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                            {mov.fechaDeposito || mov.fecha.split('T')[0]}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <p className="font-bold text-stone-900">{mov.estacionNombre}</p>
                            <span className="text-[10px] text-stone-400">{mov.tipoCombustible || 'Unificado'}</span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {mov.tipo === 'deposito' && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 inline-flex items-center space-x-1">
                                <ArrowUpRight className="w-3 h-3" />
                                <span>Depósito</span>
                              </span>
                            )}
                            {mov.tipo === 'descuento' && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200 inline-flex items-center space-x-1">
                                <ArrowDownRight className="w-3 h-3" />
                                <span>Descuento Factura</span>
                              </span>
                            )}
                            {mov.tipo === 'ajuste' && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 inline-flex items-center space-x-1">
                                <Sliders className="w-3 h-3" />
                                <span>Ajuste Manual</span>
                              </span>
                            )}
                            {mov.tipo === 'carga_inicial' && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 inline-flex items-center space-x-1">
                                <Layers className="w-3 h-3" />
                                <span>Apertura Inicial</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold">
                            <span className={esPositivo ? 'text-emerald-600' : 'text-amber-700'}>
                              {esPositivo ? '+' : ''}₡{Math.abs(mov.monto).toLocaleString('es-CR')}
                            </span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-stone-900">
                            ₡{mov.saldoNuevo.toLocaleString('es-CR')}
                          </td>

                          <td className="py-3 px-4 max-w-xs truncate text-[11px]">
                            {mov.numeroTicket && (
                              <span className="font-mono font-bold text-stone-800 mr-1.5">
                                #{mov.numeroTicket}
                              </span>
                            )}
                            {mov.vehiculoPlaca && (
                              <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold mr-1.5">
                                {mov.vehiculoPlaca}
                              </span>
                            )}
                            <span className="text-stone-500">{mov.notas}</span>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-[11px] text-stone-500">
                            {mov.usuarioNombre}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODALES: SALDOS Y DEPÓSITOS */}
      {/* ======================================================== */}
      {modalDeposito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Registrar Depósito de Saldo</h3>
                  <p className="text-xs text-stone-500">{modalDeposito.estacionNombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDeposito(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegistrarDeposito} className="p-5 space-y-4">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                <span className="text-stone-500">Saldo actual antes de depositar:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₡{modalDeposito.saldoActual.toLocaleString('es-CR')}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Monto a Depositar (₡ CRC) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  autoFocus
                  placeholder="Ej: 300000"
                  value={montoDeposito}
                  onChange={(e) => setMontoDeposito(parseFloat(e.target.value) || '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Fecha del Depósito *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaDeposito}
                    onChange={(e) => setFechaDeposito(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    N° Comprobante / Ref
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: DEP-BCR-9923"
                    value={referenciaDeposito}
                    onChange={(e) => setReferenciaDeposito(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Recarga quincenal tarjeta corporativa..."
                  value={notasDeposito}
                  onChange={(e) => setNotasDeposito(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {montoDeposito !== '' && Number(montoDeposito) > 0 && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex justify-between items-center text-emerald-900">
                  <span>Nuevo saldo proyectado:</span>
                  <span className="font-mono font-bold text-sm text-emerald-800">
                    ₡{(modalDeposito.saldoActual + Number(montoDeposito)).toLocaleString('es-CR')}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalDeposito(null)}
                  disabled={procesando}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>{procesando ? 'Guardando...' : 'Confirmar Depósito'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJUSTE MANUAL */}
      {modalAjuste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Ajuste Manual de Saldo</h3>
                  <p className="text-xs text-stone-500">{modalAjuste.estacionNombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAjuste(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAjustarSaldo} className="p-5 space-y-4">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex justify-between items-center text-xs">
                <span className="text-stone-500">Saldo actual registrado:</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  ₡{modalAjuste.saldoActual.toLocaleString('es-CR')}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Nuevo Saldo Real en Estación (₡ CRC) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  autoFocus
                  placeholder="Ej: 450000"
                  value={nuevoSaldoAjuste}
                  onChange={(e) => setNuevoSaldoAjuste(parseFloat(e.target.value) || '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Motivo o Justificación del Ajuste * (Obligatorio)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Arqueo quincenal con estado de cuenta emitido por la estación..."
                  value={notasAjuste}
                  onChange={(e) => setNotasAjuste(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalAjuste(null)}
                  disabled={procesando}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  {procesando ? 'Ajustando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UMBRAL ALERTA */}
      {modalUmbral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-600 text-white rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Umbral de Alerta de Saldo Bajo</h3>
                  <p className="text-xs text-stone-500">{modalUmbral.estacionNombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalUmbral(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActualizarUmbral} className="p-5 space-y-4">
              <p className="text-xs text-stone-600">
                Cuando el saldo disponible de esta bomba caiga por debajo de este monto, el sistema emitirá alertas visuales prioritarias en el panel de control.
              </p>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Monto Mínimo de Alerta (₡ CRC) *
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  autoFocus
                  placeholder="Ej: 50000"
                  value={nuevoUmbral}
                  onChange={(e) => setNuevoUmbral(parseFloat(e.target.value) || '')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-base font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalUmbral(null)}
                  disabled={procesando}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  {procesando ? 'Guardando...' : 'Guardar Umbral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CREAR ESTACIÓN */}
      {/* ======================================================== */}
      {modalCrearEstacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-stone-900 text-white rounded-xl">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Registrar Nueva Estación de Servicio</h3>
                  <p className="text-xs text-stone-500">Alta de bomba en catálogo y cuenta de saldo prepago</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCrearEstacion(false)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearEstacion} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Nombre Único de la Estación / Bomba *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Delta San Pedro Centro"
                  value={formEstacion.nombre}
                  onChange={(e) => setFormEstacion({ ...formEstacion, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Ubicación / Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: San José, Montes de Oca"
                    value={formEstacion.ubicacion}
                    onChange={(e) => setFormEstacion({ ...formEstacion, ubicacion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Moneda Configurada
                  </label>
                  <input
                    type="text"
                    disabled
                    value="CRC (Colones costarricenses)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-100 text-xs font-mono font-semibold text-stone-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1.5">
                  Combustibles Disponibles en esta Estación *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMBUSTIBLES_OPCIONES.map((comb) => {
                    const seleccionado = formEstacion.combustiblesDisponibles.includes(comb);
                    return (
                      <button
                        key={comb}
                        type="button"
                        onClick={() => toggleCombustibleSeleccionado(comb)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                          seleccionado
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>{comb}</span>
                        {seleccionado && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-100">
                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Saldo Inicial (₡ CRC)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="100000"
                    value={formEstacion.saldoInicial}
                    onChange={(e) => setFormEstacion({ ...formEstacion, saldoInicial: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Umbral Alerta (₡ CRC)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    placeholder="50000"
                    value={formEstacion.umbralAlerta}
                    onChange={(e) => setFormEstacion({ ...formEstacion, umbralAlerta: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-estacion-activa"
                  checked={formEstacion.activo}
                  onChange={(e) => setFormEstacion({ ...formEstacion, activo: e.target.checked })}
                  className="rounded bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="chk-estacion-activa" className="text-xs text-stone-700 font-medium">
                  Estación activa y habilitada para recibir cargas de combustible
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalCrearEstacion(false)}
                  disabled={procesando}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>{procesando ? 'Guardando...' : 'Crear Estación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDITAR ESTACIÓN */}
      {/* ======================================================== */}
      {modalEditarEstacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-stone-900 text-white rounded-xl">
                  <Edit2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Editar Estación de Servicio</h3>
                  <p className="text-xs text-stone-500">{modalEditarEstacion.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarEstacion(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActualizarEstacion} className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Nombre de la Estación *
                </label>
                <input
                  type="text"
                  required
                  value={formEstacion.nombre}
                  onChange={(e) => setFormEstacion({ ...formEstacion, nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Ubicación / Dirección
                </label>
                <input
                  type="text"
                  value={formEstacion.ubicacion}
                  onChange={(e) => setFormEstacion({ ...formEstacion, ubicacion: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1.5">
                  Combustibles Habilitados
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COMBUSTIBLES_OPCIONES.map((comb) => {
                    const seleccionado = formEstacion.combustiblesDisponibles.includes(comb);
                    return (
                      <button
                        key={comb}
                        type="button"
                        onClick={() => toggleCombustibleSeleccionado(comb)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                          seleccionado
                            ? 'bg-stone-900 text-white border-stone-900'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>{comb}</span>
                        {seleccionado && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-edit-estacion-activa"
                  checked={formEstacion.activo}
                  onChange={(e) => setFormEstacion({ ...formEstacion, activo: e.target.checked })}
                  className="rounded bg-stone-50 border-stone-300 text-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="chk-edit-estacion-activa" className="text-xs text-stone-700 font-medium">
                  Estación activa y autorizada para el suministro
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModalEditarEstacion(null)}
                  disabled={procesando}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesando}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  {procesando ? 'Guardando...' : 'Actualizar Estación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ELIMINAR / DESACTIVAR ESTACIÓN */}
      {/* ======================================================== */}
      {modalEliminarEstacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">Eliminar Estación de Servicio</h3>
                <p className="text-xs text-stone-500">{modalEliminarEstacion.nombre}</p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-start space-x-2 font-semibold">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>Política de Integridad Contable:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Si esta estación tiene historial de facturas cargadas, solicitudes de combustible o movimientos de saldo prepago, será <strong>desactivada</strong> para mantener el respaldo de auditoría fiscal. Si no tiene registros previos, se borrará definitivamente.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModalEliminarEstacion(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={procesando}
                onClick={handleConfirmarEliminarEstacion}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 shadow-xs"
              >
                {procesando ? 'Procesando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL HISTORIAL INDIVIDUAL DE UNA BOMBA */}
      {/* ======================================================== */}
      {modalHistorialSaldo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Historial de Movimientos</h3>
                <p className="text-xs text-stone-500 font-medium">
                  {modalHistorialSaldo.estacionNombre} (Saldo Actual: ₡{modalHistorialSaldo.saldoActual.toLocaleString('es-CR')})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalHistorialSaldo(null)}
                className="p-1 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {cargandoMovsIndividual ? (
                <div className="p-8 text-center text-xs text-stone-500">Cargando movimientos...</div>
              ) : movimientosSaldoIndividual.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">No hay movimientos registrados para esta cuenta.</div>
              ) : (
                <div className="space-y-2">
                  {movimientosSaldoIndividual.map((mov) => {
                    const esPositivo = mov.monto > 0;
                    return (
                      <div
                        key={mov.id}
                        className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[11px] text-stone-500">
                              {mov.fechaDeposito || mov.fecha.split('T')[0]}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded font-bold text-[9px] uppercase ${
                                mov.tipo === 'deposito'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : mov.tipo === 'descuento'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {mov.tipo}
                            </span>
                          </div>
                          <p className="text-stone-800 font-medium">{mov.notas}</p>
                          {mov.comprobanteReferencia && (
                            <p className="text-[10px] text-stone-500 font-mono">Ref: {mov.comprobanteReferencia}</p>
                          )}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className={`font-mono font-bold text-sm ${esPositivo ? 'text-emerald-600' : 'text-amber-700'}`}>
                            {esPositivo ? '+' : ''}₡{Math.abs(mov.monto).toLocaleString('es-CR')}
                          </p>
                          <span className="text-[10px] text-stone-400 font-mono">
                            Saldo: ₡{mov.saldoNuevo.toLocaleString('es-CR')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                type="button"
                onClick={() => setModalHistorialSaldo(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
