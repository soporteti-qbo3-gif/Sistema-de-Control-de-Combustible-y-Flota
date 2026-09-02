/**
 * Módulo de Auditoría, Edición y Validación de Facturas de Combustible (Admin)
 * Permite al administrador editar cualquier dato de la factura (litros, montos, odómetro,
 * vehículo, conductor, N° ticket, clave numérica, estación) y DECIDIR a cuál servicio o cuenta
 * de saldo prepago se asigna e imputa el gasto.
 */

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  Gauge,
  Eye,
  Edit3,
  Sparkles,
  Save,
  MessageSquare,
  Search,
  Filter,
  X,
  ChevronRight,
  Clock,
  Trash2,
  Wallet,
  Fuel,
  PlusCircle,
  ArrowDownRight,
  Truck,
  User,
  Calendar,
  CreditCard,
  Building2,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { CargaCombustible, SaldoEstacion, Vehiculo, Usuario } from '../../types';
import { PhotoViewerModal } from '../../components/PhotoViewerModal';

export const ValidacionCargas: React.FC = () => {
  const [cargas, setCargas] = useState<CargaCombustible[]>([]);
  const [saldos, setSaldos] = useState<SaldoEstacion[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Usuario[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<string>('PENDIENTE');
  const [busqueda, setBusqueda] = useState<string>('');
  const [cargando, setCargando] = useState(true);

  // Modal de Auditoría y Edición de Factura
  const [modalCarga, setModalCarga] = useState<CargaCombustible | null>(null);
  const [pestanaModal, setPestanaModal] = useState<'auditoria' | 'edicion'>('auditoria');

  // Campos editables por el Administrador
  const [litrosEdit, setLitrosEdit] = useState<number>(0);
  const [totalEdit, setTotalEdit] = useState<number>(0);
  const [precioPorLitroEdit, setPrecioPorLitroEdit] = useState<number>(0);
  const [odometroEdit, setOdometroEdit] = useState<number>(0);
  const [estacionEdit, setEstacionEdit] = useState<string>('');
  const [tipoCombustibleEdit, setTipoCombustibleEdit] = useState<string>('Diesel');
  const [numeroTicketEdit, setNumeroTicketEdit] = useState<string>('');
  const [claveNumericaEdit, setClaveNumericaEdit] = useState<string>('');
  const [fechaEdit, setFechaEdit] = useState<string>('');
  const [vehiculoIdEdit, setVehiculoIdEdit] = useState<string>('');
  const [conductorIdEdit, setConductorIdEdit] = useState<string>('');
  const [saldoPrepagoIdEdit, setSaldoPrepagoIdEdit] = useState<string>('');
  const [servicioDestinoEdit, setServicioDestinoEdit] = useState<string>('');
  const [metodoPagoEdit, setMetodoPagoEdit] = useState<string>('Prepago Bomba');
  const [notasValidacion, setNotasValidacion] = useState<string>('');

  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal de depósito rápido desde la validación
  const [modalDepositoRapido, setModalDepositoRapido] = useState<SaldoEstacion | null>(null);
  const [montoDepositoRapido, setMontoDepositoRapido] = useState<number | ''>(100000);
  const [procesandoDeposito, setProcesandoDeposito] = useState(false);

  // Visor de fotos ampliable
  const [photoViewer, setPhotoViewer] = useState<{ open: boolean; title: string; url?: string }>({
    open: false,
    title: '',
  });

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [dataCargas, dataSaldos, dataVehiculos, dataConductores] = await Promise.all([
        api.getCargas(),
        api.getSaldos(),
        api.getVehiculos().catch(() => []),
        api.getConductores().catch(() => []),
      ]);
      setCargas(dataCargas);
      setSaldos(dataSaldos);
      setVehiculos(dataVehiculos);
      setConductores(dataConductores);
    } catch (e) {
      console.error('Error cargando lista de cargas y saldos para validación:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirModal = (c: CargaCombustible, tab: 'auditoria' | 'edicion' = 'auditoria') => {
    setModalCarga(c);
    setPestanaModal(tab);
    setLitrosEdit(c.litros || 0);
    setTotalEdit(c.totalPagado || 0);
    const unitario = c.precioPorLitro || (c.litros ? Number((c.totalPagado / c.litros).toFixed(2)) : 0);
    setPrecioPorLitroEdit(unitario);
    setOdometroEdit(c.odometroActual || 0);
    setEstacionEdit(c.estacion || '');
    setTipoCombustibleEdit(c.tipoCombustible || 'Diesel');
    setNumeroTicketEdit(c.numeroTicket || c.datosIA?.numeroTicket || '');
    setClaveNumericaEdit(c.claveNumerica || c.datosIA?.claveNumerica || '');
    setFechaEdit(c.fecha ? c.fecha.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setVehiculoIdEdit(c.vehiculoId || '');
    setConductorIdEdit(c.conductorId || '');
    setNotasValidacion(c.notasValidacion || '');
    setMetodoPagoEdit(c.metodoPago || 'Prepago Bomba');

    // Identificar el saldo / servicio predeterminado
    if (c.saldoPrepagoId) {
      setSaldoPrepagoIdEdit(c.saldoPrepagoId);
      const saldoObj = saldos.find((s) => s.id === c.saldoPrepagoId);
      setServicioDestinoEdit(saldoObj ? saldoObj.estacionNombre : c.servicioDestino || '');
    } else {
      const saldoSugerido = encontrarSaldoEstacion(c.estacion);
      if (saldoSugerido) {
        setSaldoPrepagoIdEdit(saldoSugerido.id);
        setServicioDestinoEdit(saldoSugerido.estacionNombre);
      } else {
        setSaldoPrepagoIdEdit('SIN_SALDO_PREPAGO_CREDITO');
        setServicioDestinoEdit('Crédito Corporativo / Factura Directa');
      }
    }
  };

  // Buscar saldo de la estación en tiempo real según el nombre de la estación
  const encontrarSaldoEstacion = (est: string): SaldoEstacion | undefined => {
    const eNorm = (est || '').toLowerCase().trim();

    return (
      saldos.find((s) => {
        const sENorm = s.estacionNombre.toLowerCase().trim();
        return sENorm === eNorm || sENorm.includes(eNorm) || eNorm.includes(sENorm);
      }) || saldos[0]
    );
  };

  // Cuenta de saldo actualmente seleccionada para debitar
  const saldoActualSeleccionado = saldos.find((s) => s.id === saldoPrepagoIdEdit);
  const esServicioPrepago = !!saldoActualSeleccionado && saldoPrepagoIdEdit !== 'SIN_SALDO_PREPAGO_CREDITO' && saldoPrepagoIdEdit !== 'SIN_SALDO_PREPAGO_CAJA_CHICA';

  // Manejadores de sincronización de cálculo de precio y total
  const handleCambioLitros = (litros: number) => {
    setLitrosEdit(litros);
    if (precioPorLitroEdit > 0) {
      setTotalEdit(Math.round(litros * precioPorLitroEdit));
    } else if (totalEdit > 0 && litros > 0) {
      setPrecioPorLitroEdit(Number((totalEdit / litros).toFixed(2)));
    }
  };

  const handleCambioPrecioLitro = (precio: number) => {
    setPrecioPorLitroEdit(precio);
    if (litrosEdit > 0) {
      setTotalEdit(Math.round(litrosEdit * precio));
    }
  };

  const handleCambioTotal = (total: number) => {
    setTotalEdit(total);
    if (litrosEdit > 0) {
      setPrecioPorLitroEdit(Number((total / litrosEdit).toFixed(2)));
    }
  };

  // Asignar servicio/saldo al seleccionar opción
  const handleSeleccionarServicio = (valor: string) => {
    setSaldoPrepagoIdEdit(valor);
    if (valor === 'SIN_SALDO_PREPAGO_CREDITO') {
      setServicioDestinoEdit('Crédito Corporativo / Factura Directa');
      setMetodoPagoEdit('Crédito Corporativo');
    } else if (valor === 'SIN_SALDO_PREPAGO_CAJA_CHICA') {
      setServicioDestinoEdit('Caja Chica / Reembolso');
      setMetodoPagoEdit('Caja Chica / Efectivo');
    } else {
      const saldoObj = saldos.find((s) => s.id === valor);
      if (saldoObj) {
        setServicioDestinoEdit(saldoObj.estacionNombre);
        setMetodoPagoEdit('Prepago Bomba');
        setEstacionEdit(saldoObj.estacionNombre);
      }
    }
  };

  // Guardar cambios en la factura sin cambiar obligatoriamente el estado
  const handleGuardarCambiosFactura = async () => {
    if (!modalCarga) return;
    setProcesandoAccion(true);
    try {
      await api.actualizarCarga(modalCarga.id, {
        litros: Number(litrosEdit),
        totalPagado: Number(totalEdit),
        precioPorLitro: Number(precioPorLitroEdit),
        odometroActual: Number(odometroEdit),
        estacion: estacionEdit,
        tipoCombustible: tipoCombustibleEdit,
        servicioDestino: servicioDestinoEdit,
        saldoPrepagoId: esServicioPrepago ? saldoPrepagoIdEdit : undefined,
        metodoPago: metodoPagoEdit,
        numeroTicket: numeroTicketEdit,
        claveNumerica: claveNumericaEdit,
        fecha: fechaEdit,
        vehiculoId: vehiculoIdEdit || undefined,
        conductorId: conductorIdEdit || undefined,
        notasValidacion,
      });

      setMensajeExito('¡Datos de la factura y servicio asignado guardados correctamente!');
      setTimeout(() => setMensajeExito(null), 3000);
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al guardar la factura: ${err.message}`);
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Validar, Rechazar o Enviar a Revisión
  const handleValidar = async (estado: 'VALIDADO' | 'RECHAZADO' | 'REQUIERE_REVISION') => {
    if (!modalCarga) return;

    setProcesandoAccion(true);
    try {
      await api.validarCarga(modalCarga.id, {
        estadoValidacion: estado,
        notasValidacion,
        litros: Number(litrosEdit),
        totalPagado: Number(totalEdit),
        precioPorLitro: Number(precioPorLitroEdit),
        odometroActual: Number(odometroEdit),
        estacion: estacionEdit,
        tipoCombustible: tipoCombustibleEdit,
        servicioDestino: servicioDestinoEdit,
        saldoPrepagoId: esServicioPrepago ? saldoPrepagoIdEdit : 'SIN_SALDO_PREPAGO',
        metodoPago: metodoPagoEdit,
        numeroTicket: numeroTicketEdit,
        claveNumerica: claveNumericaEdit,
        fecha: fechaEdit,
        vehiculoId: vehiculoIdEdit || undefined,
        conductorId: conductorIdEdit || undefined,
      });

      setModalCarga(null);
      await cargarDatos();
    } catch (err: any) {
      alert(`No se pudo procesar la validación: ${err.message}`);
    } finally {
      setProcesandoAccion(false);
    }
  };

  // Eliminar carga
  const handleEliminarCarga = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta factura/carga de combustible? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteCarga(id);
      setModalCarga(null);
      await cargarDatos();
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
    }
  };

  // Ejecutar depósito rápido
  const handleEjecutarDepositoRapido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDepositoRapido || !montoDepositoRapido || Number(montoDepositoRapido) <= 0) return;

    setProcesandoDeposito(true);
    try {
      await api.registrarDeposito(modalDepositoRapido.id, {
        monto: Number(montoDepositoRapido),
        notas: `Depósito rápido para desbloquear factura #${numeroTicketEdit || modalCarga?.id}`,
      });

      setModalDepositoRapido(null);
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al registrar depósito: ${err.message}`);
    } finally {
      setProcesandoDeposito(false);
    }
  };

  const cargasFiltradas = cargas.filter((c) => {
    const coincideEstado =
      filtroEstado === 'TODOS'
        ? true
        : filtroEstado === 'PENDIENTE'
        ? c.estadoValidacion === 'PENDIENTE' || c.estadoValidacion === 'REQUIERE_REVISION'
        : c.estadoValidacion === filtroEstado;

    if (!coincideEstado) return false;

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase().trim();
      const ticket = (c.numeroTicket || c.datosIA?.numeroTicket || '').toLowerCase();
      const clave = (c.claveNumerica || c.datosIA?.claveNumerica || '').toLowerCase();
      const placa = (c.vehiculoPlaca || '').toLowerCase();
      const conductor = (c.conductorNombre || '').toLowerCase();
      const est = (c.estacion || '').toLowerCase();
      const serv = (c.servicioDestino || '').toLowerCase();
      return (
        ticket.includes(term) ||
        clave.includes(term) ||
        placa.includes(term) ||
        conductor.includes(term) ||
        est.includes(term) ||
        serv.includes(term)
      );
    }

    return true;
  });

  return (
    <div className="space-y-4 w-full max-w-6xl mx-auto pb-20 lg:pb-6">
      {/* Header Compacto y Barra de Búsqueda */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">
                Auditoría y Edición de Facturas
              </h1>
              <p className="text-xs text-slate-500">
                Edición de comprobantes, imputación a servicios de saldo prepago y validación de cargas
              </p>
            </div>
          </div>

          {/* Filtros rápidos por estado */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200 self-start sm:self-auto">
            {[
              { id: 'PENDIENTE', label: 'Pendientes' },
              { id: 'VALIDADO', label: 'Validados' },
              { id: 'TODOS', label: 'Todos' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroEstado(f.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filtroEstado === f.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buscador inteligente por N° Factura / Consecutivo / Clave Hacienda / Placa */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° Factura, Clave Hacienda, Placa, Estación o Conductor..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-400 rounded-md text-xs font-medium focus:outline-none transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Registros */}
      {cargando ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Cargando comprobantes y servicios...</p>
        </div>
      ) : cargasFiltradas.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
          <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            {busqueda ? 'No se encontraron facturas con ese criterio' : '¡No hay facturas pendientes de validación!'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {busqueda ? 'Intenta buscar con otro número de ticket o placa' : 'Todos los registros están al día.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cargasFiltradas.map((carga) => {
            const ticketId = carga.numeroTicket || carga.datosIA?.numeroTicket || 'S/N';
            return (
              <div
                key={carga.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {carga.vehiculoPlaca}
                    </span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        carga.estadoValidacion === 'VALIDADO'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : carga.estadoValidacion === 'RECHAZADO'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : carga.estadoValidacion === 'REQUIERE_REVISION'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      {carga.estadoValidacion === 'VALIDADO'
                        ? 'Validado'
                        : carga.estadoValidacion === 'RECHAZADO'
                        ? 'Rechazado'
                        : carga.estadoValidacion === 'REQUIERE_REVISION'
                        ? 'En Revisión'
                        : 'Pendiente'}
                    </span>
                  </div>

                  {/* Factura / Ticket Tag */}
                  <div className="flex items-center space-x-1.5 my-1.5 py-1 px-2 rounded bg-slate-50 border border-slate-200">
                    <Receipt className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span className="text-[11px] font-mono font-medium text-slate-800 truncate">
                      {ticketId}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-600 bg-slate-200/60 px-1.5 py-0.2 rounded truncate max-w-[110px]">
                      {carga.estacion || 'Estación N/A'}
                    </span>
                  </div>

                  {/* Servicio Asignado */}
                  {carga.servicioDestino && (
                    <div className="my-1 py-0.5 px-2 rounded bg-emerald-50/50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center space-x-1.5">
                      <Wallet className="w-3 h-3 text-emerald-700 flex-shrink-0" />
                      <span className="truncate font-medium">
                        Servicio: {carga.servicioDestino}
                      </span>
                    </div>
                  )}

                  {/* Nota reportada por el chofer si existe */}
                  {carga.notaConductor && (
                    <div className="my-1.5 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        <strong>Nota Chofer:</strong> {carga.notaConductor}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs my-1">
                    <span className="text-slate-500 font-medium truncate">{carga.conductorNombre}</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ₡{Number(carga.totalPagado).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>
                      {carga.litros} L ({carga.tipoCombustible})
                    </span>
                    <span>{carga.fecha.split('T')[0]}</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => abrirModal(carga, 'edicion')}
                    className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                    <span>Editar Factura</span>
                  </button>

                  <button
                    onClick={() => abrirModal(carga, 'auditoria')}
                    className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-200" />
                    <span>Auditar y Validar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL INTEGRAL DE AUDITORÍA, EDICIÓN Y DECISIÓN DE SERVICIO */}
      {modalCarga && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full max-h-[94vh] flex flex-col overflow-hidden">
            {/* Header Modal con Switch de Modos */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm font-semibold text-slate-900 leading-tight">
                      Factura #{numeroTicketEdit || modalCarga.id}
                    </h2>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {modalCarga.vehiculoPlaca}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {modalCarga.conductorNombre} • {modalCarga.fecha.slice(0, 10)}
                  </p>
                </div>
              </div>

              {/* Botón cerrar */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-md text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setPestanaModal('auditoria')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      pestanaModal === 'auditoria'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Auditoría
                  </button>
                  <button
                    type="button"
                    onClick={() => setPestanaModal('edicion')}
                    className={`px-2.5 py-1 rounded transition-colors flex items-center space-x-1 ${
                      pestanaModal === 'edicion'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar</span>
                  </button>
                </div>

                <button
                  onClick={() => setModalCarga(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mensaje de confirmación temporal */}
            {mensajeExito && (
              <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between">
                <span>{mensajeExito}</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}

            {/* Cuerpo del Modal (Scroll interno) */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1">
              {/* Miniaturas de Comprobantes Ampliables con Clic */}
              <div className="grid grid-cols-2 gap-3">
                {/* Miniatura Factura */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-700 block">
                    1. Comprobante / Factura
                  </span>
                  <div
                    onClick={() =>
                      setPhotoViewer({
                        open: true,
                        title: `Factura - ${modalCarga.vehiculoPlaca}`,
                        url:
                          modalCarga.fotoFacturaUrl ||
                          'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
                      })
                    }
                    className="relative rounded-md border border-slate-300 bg-slate-100 overflow-hidden h-24 sm:h-28 flex items-center justify-center cursor-pointer group hover:border-slate-500 transition-colors"
                  >
                    <img
                      src={
                        modalCarga.fotoFacturaUrl ||
                        'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Factura"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-medium">
                      Ampliar
                    </span>
                  </div>
                </div>

                {/* Miniatura Odómetro */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-700 block">
                    2. Odómetro / Tablero
                  </span>
                  <div
                    onClick={() =>
                      setPhotoViewer({
                        open: true,
                        title: `Odómetro - ${modalCarga.vehiculoPlaca}`,
                        url:
                          modalCarga.fotoOdometroUrl ||
                          'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
                      })
                    }
                    className="relative rounded-md border border-slate-300 bg-slate-100 overflow-hidden h-24 sm:h-28 flex items-center justify-center cursor-pointer group hover:border-slate-500 transition-colors"
                  >
                    <img
                      src={
                        modalCarga.fotoOdometroUrl ||
                        'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80'
                      }
                      alt="Odómetro"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-medium">
                      Ampliar
                    </span>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DETALLES OCR EXTRAÍDOS POR IA (FORMATO FACTURAS / BOMBAS DE COSTA RICA) */}
              {modalCarga.datosIA && (modalCarga.datosIA.pistero || modalCarga.datosIA.despacho || modalCarga.datosIA.posicion || modalCarga.datosIA.vehiculoDetectado || modalCarga.datosIA.firmaConductor || modalCarga.datosIA.claveNumerica || modalCarga.datosIA.kilometrajeTicket) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Datos Detectados en el Ticket / Bomba de Servicio</span>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                      Confianza: {modalCarga.datosIA.confianzaScore || 95}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    {modalCarga.datosIA.pistero && (
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">Pistero</span>
                        <span className="font-medium text-slate-800">{modalCarga.datosIA.pistero}</span>
                      </div>
                    )}

                    {modalCarga.datosIA.despacho && (
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">N° Despacho</span>
                        <span className="font-mono font-medium text-slate-800">{modalCarga.datosIA.despacho}</span>
                      </div>
                    )}

                    {modalCarga.datosIA.posicion && (
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">Posición Bomba</span>
                        <span className="font-medium text-slate-800">{modalCarga.datosIA.posicion}</span>
                      </div>
                    )}

                    {modalCarga.datosIA.vehiculoDetectado && (
                      <div className="bg-white p-2 rounded-md border border-slate-200 sm:col-span-2">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">Vehículo / Placa</span>
                        <span className="font-medium text-slate-800">{modalCarga.datosIA.vehiculoDetectado}</span>
                      </div>
                    )}

                    {modalCarga.datosIA.kilometrajeTicket && (
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">Km en Ticket</span>
                        <span className="font-mono font-medium text-slate-800">{modalCarga.datosIA.kilometrajeTicket.toLocaleString('es-CR')} km</span>
                      </div>
                    )}

                    {modalCarga.datosIA.firmaConductor && (
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">Firma / Conductor</span>
                        <span className="font-medium text-slate-800">{modalCarga.datosIA.firmaConductor}</span>
                      </div>
                    )}

                    {modalCarga.datosIA.formaPago && (
                      <div className="bg-white p-2 rounded-md border border-slate-200">
                        <span className="text-[9px] uppercase font-medium text-slate-400 block">Forma de Pago</span>
                        <span className="font-medium text-slate-800">{modalCarga.datosIA.formaPago}</span>
                      </div>
                    )}
                  </div>

                  {modalCarga.datosIA.claveNumerica && (
                    <div className="bg-white p-2 rounded-md border border-slate-200">
                      <span className="text-[9px] uppercase font-medium text-slate-400 block">Clave Hacienda (50 dígitos)</span>
                      <span className="font-mono text-[10px] text-slate-700 break-all select-all">{modalCarga.datosIA.claveNumerica}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN PRINCIPAL: DECIDIR A CUÁL SERVICIO VA LA FACTURA (REQUIREMENT USER) */}
              <div className="p-3.5 bg-slate-900 text-white rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Destino Contable: ¿A cuál servicio o bomba va la factura?</span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    Decisión del Admin
                  </span>
                </div>

                <div className="space-y-1.5">
                  <select
                    value={saldoPrepagoIdEdit}
                    onChange={(e) => handleSeleccionarServicio(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <optgroup label="Saldos Prepago por Estación (Bomba)">
                      {saldos.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.estacionNombre} (Saldo Disponible: ₡{Math.round(s.saldoActual).toLocaleString('es-CR')})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Otros Métodos / Sin Débito de Prepago">
                      <option value="SIN_SALDO_PREPAGO_CREDITO">
                        Crédito Corporativo / Factura a Crédito Institucional
                      </option>
                      <option value="SIN_SALDO_PREPAGO_CAJA_CHICA">
                        Caja Chica / Reembolso a Conductor
                      </option>
                    </optgroup>
                  </select>

                  <p className="text-[10px] text-slate-300">
                    {esServicioPrepago
                      ? `Esta factura se imputará y debitará del saldo prepago de "${servicioDestinoEdit}".`
                      : `Esta factura se registrará bajo "${servicioDestinoEdit}" sin debitar las cuentas de prepago.`}
                  </p>
                </div>
              </div>

              {/* Panel Dinámico de Estado de Fondos del Servicio Seleccionado */}
              {esServicioPrepago && saldoActualSeleccionado && (() => {
                const montoTotalNum = Number(totalEdit) || 0;
                const saldoDisponible = saldoActualSeleccionado.saldoActual;
                const esInsuficiente = saldoDisponible < montoTotalNum;
                const faltante = esInsuficiente ? montoTotalNum - saldoDisponible : 0;
                const proyectado = saldoDisponible - montoTotalNum;

                return (
                  <div
                    className={`p-3 rounded-lg border transition-colors space-y-2 ${
                      esInsuficiente
                        ? 'bg-rose-50 border-rose-200 text-rose-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 font-semibold text-xs">
                        <Wallet className={`w-4 h-4 ${esInsuficiente ? 'text-rose-600' : 'text-emerald-700'}`} />
                        <span>Estado de Cuenta: {saldoActualSeleccionado.estacionNombre}</span>
                      </div>
                      {esInsuficiente ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-medium flex items-center space-x-1 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Saldo Insuficiente</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-medium flex items-center space-x-1 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Fondos Disponibles</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-md border border-slate-200 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Disponible</span>
                        <span className="font-mono font-semibold text-slate-900">
                          ₡{saldoDisponible.toLocaleString('es-CR')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">Descuento</span>
                        <span className="font-mono font-semibold text-amber-700">
                          -₡{montoTotalNum.toLocaleString('es-CR')}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-medium">
                          {esInsuficiente ? 'Faltante' : 'Resultante'}
                        </span>
                        <span
                          className={`font-mono font-semibold ${
                            esInsuficiente ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {esInsuficiente
                            ? `₡${faltante.toLocaleString('es-CR')}`
                            : `₡${proyectado.toLocaleString('es-CR')}`}
                        </span>
                      </div>
                    </div>

                    {esInsuficiente ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                        <p className="text-[11px] text-rose-800">
                          Faltan <strong>₡{faltante.toLocaleString('es-CR')}</strong> en esta bomba para validar.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setModalDepositoRapido(saldoActualSeleccionado);
                            setMontoDepositoRapido(Math.max(50000, faltante + 20000));
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center space-x-1 self-start sm:self-auto"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Depositar a esta Bomba</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-emerald-800 flex items-center space-x-1">
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>Al aprobar, se descontará automáticamente el monto del saldo prepago de esta estación.</span>
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* FORMULARIO COMPLETO DE EDICIÓN DE FACTURA */}
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                    <span>Datos Editables de la Factura y Carga</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGuardarCambiosFactura}
                    disabled={procesandoAccion}
                    className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors flex items-center space-x-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Guardar Cambios</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* N° Factura / Consecutivo */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      N° Factura / Consecutivo
                    </label>
                    <input
                      type="text"
                      value={numeroTicketEdit}
                      onChange={(e) => setNumeroTicketEdit(e.target.value)}
                      placeholder="Ej: 001-002-123456"
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Clave Numérica de Hacienda (50 dígitos) */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Clave Numérica de Hacienda (50 dígitos)
                    </label>
                    <input
                      type="text"
                      value={claveNumericaEdit}
                      onChange={(e) => setClaveNumericaEdit(e.target.value)}
                      placeholder="50 dígitos de comprobante electrónico..."
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Estación / Servicentro */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Estación / Servicentro
                    </label>
                    <input
                      type="text"
                      value={estacionEdit}
                      onChange={(e) => setEstacionEdit(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400 font-medium"
                    />
                  </div>

                  {/* Tipo de Combustible */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Tipo de Combustible
                    </label>
                    <select
                      value={tipoCombustibleEdit}
                      onChange={(e) => setTipoCombustibleEdit(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400 font-medium"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Gasolina Regular">Gasolina Regular</option>
                      <option value="Gasolina Super">Gasolina Super</option>
                      <option value="Gas LP">Gas LP</option>
                    </select>
                  </div>

                  {/* Litros */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Litros Despachados
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={litrosEdit || ''}
                      onChange={(e) => handleCambioLitros(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Precio por Litro */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Precio por Litro (₡ CRC)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={precioPorLitroEdit || ''}
                      onChange={(e) => handleCambioPrecioLitro(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Total Pagado */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Total Pagado (₡ CRC)
                    </label>
                    <input
                      type="number"
                      value={totalEdit || ''}
                      onChange={(e) => handleCambioTotal(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-semibold text-emerald-900 bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Odómetro Actual */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Odómetro Actual (km)
                    </label>
                    <input
                      type="number"
                      value={odometroEdit || ''}
                      onChange={(e) => setOdometroEdit(parseFloat(e.target.value) || 0)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>

                  {/* Vehículo Asignado */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Vehículo Asignado
                    </label>
                    <select
                      value={vehiculoIdEdit}
                      onChange={(e) => setVehiculoIdEdit(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400 font-medium"
                    >
                      {vehiculos.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.placa} - {v.marca} {v.modelo} (Odo: {v.odometroActual} km)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Conductor Asignado */}
                  <div>
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Conductor Asignado
                    </label>
                    <select
                      value={conductorIdEdit}
                      onChange={(e) => setConductorIdEdit(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400 font-medium"
                    >
                      {conductores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha de la Factura */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                      Fecha y Hora de la Factura
                    </label>
                    <input
                      type="datetime-local"
                      value={fechaEdit}
                      onChange={(e) => setFechaEdit(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400"
                    />
                  </div>
                </div>
              </div>

              {/* Nota del Conductor */}
              {modalCarga.notaConductor && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md space-y-0.5">
                  <span className="text-[10px] font-medium text-amber-900 uppercase">
                    Nota reportada por el Chofer:
                  </span>
                  <p className="text-xs text-amber-950 font-normal">"{modalCarga.notaConductor}"</p>
                </div>
              )}

              {/* Notas de Validación / Auditoría */}
              <div>
                <label className="text-[10px] font-medium text-slate-600 block mb-0.5">
                  Notas de Auditoría del Administrador (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Factura corregida, ticket verificado con el proveedor..."
                  value={notasValidacion}
                  onChange={(e) => setNotasValidacion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400"
                />
              </div>
            </div>

            {/* Footer Fijo de Acciones en la Parte Inferior del Modal */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleValidar('RECHAZADO')}
                  disabled={procesandoAccion}
                  className="px-2.5 py-1.5 rounded-md bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium transition-colors"
                >
                  Rechazar
                </button>

                <button
                  type="button"
                  onClick={() => handleValidar('REQUIERE_REVISION')}
                  disabled={procesandoAccion}
                  className="px-2.5 py-1.5 rounded-md bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium transition-colors"
                >
                  En Revisión
                </button>

                <button
                  type="button"
                  onClick={() => handleEliminarCarga(modalCarga.id)}
                  disabled={procesandoAccion}
                  title="Eliminar factura"
                  className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setModalCarga(null)}
                  disabled={procesandoAccion}
                  className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-200 text-xs font-medium transition-colors"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handleGuardarCambiosFactura}
                  disabled={procesandoAccion}
                  className="px-2.5 py-1.5 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium transition-colors flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>

                {(() => {
                  const saldoBomba = esServicioPrepago ? saldoActualSeleccionado : undefined;
                  const esInsuficiente = saldoBomba ? saldoBomba.saldoActual < Number(totalEdit) : false;

                  return (
                    <button
                      type="button"
                      onClick={() => handleValidar('VALIDADO')}
                      disabled={procesandoAccion || esInsuficiente}
                      title={
                        esInsuficiente
                          ? 'Saldo insuficiente en la bomba seleccionada. Realice un depósito antes de aprobar.'
                          : 'Aprobar factura e imputar al servicio seleccionado'
                      }
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                        esInsuficiente
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${esInsuficiente ? 'text-slate-400' : 'text-emerald-400'}`} />
                      <span>{esInsuficiente ? 'Saldo Insuficiente' : 'Aprobar Factura'}</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Depósito Rápido de Emergencia */}
      {modalDepositoRapido && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 shadow-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-md">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Depósito Rápido a Bomba</h3>
                  <p className="text-[11px] text-slate-500">{modalDepositoRapido.estacionNombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDepositoRapido(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEjecutarDepositoRapido} className="space-y-3">
              <div className="p-2 bg-slate-50 rounded-md text-xs flex justify-between">
                <span className="text-slate-500">Saldo actual disponible:</span>
                <span className="font-mono font-semibold text-slate-900">
                  ₡{modalDepositoRapido.saldoActual.toLocaleString('es-CR')}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700 block mb-1">
                  Monto a Depositar (₡ CRC)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  autoFocus
                  value={montoDepositoRapido}
                  onChange={(e) => setMontoDepositoRapido(parseFloat(e.target.value) || '')}
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 font-mono text-sm font-semibold text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalDepositoRapido(null)}
                  disabled={procesandoDeposito}
                  className="px-2.5 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoDeposito}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
                >
                  {procesandoDeposito ? 'Acreditando...' : 'Acreditar Depósito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visor Modal de Fotos Ampliadas */}
      <PhotoViewerModal
        isOpen={photoViewer.open}
        onClose={() => setPhotoViewer({ open: false, title: '' })}
        title={photoViewer.title}
        imageUrl={photoViewer.url}
      />
    </div>
  );
};
