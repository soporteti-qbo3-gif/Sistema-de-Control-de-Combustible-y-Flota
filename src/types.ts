export type UserRole = 'ADMIN' | 'CONDUCTOR';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  esAdminPrincipal?: boolean;
  debeCambiarPassword?: boolean;
  tempPassword?: string;
  telefonoContacto: string;
  telefonoWhatsapp?: string;
  licencia?: string;
  vehiculoAsignadoId?: string;
  vehiculoAsignado?: Vehiculo;
  activo: boolean;
  createdAt?: string;
  ultimoAcceso?: string;
}

export type TipoControlMedicion = 'KILOMETROS' | 'HORAS' | 'NO_APLICA';
export type EstadoFinancieroVehiculo = 'Leasing' | 'Préstamo' | 'Alquiler' | 'Libre';

export interface Vehiculo {
  id: string;
  numeroSerie?: number | string;
  tipoVehiculo: string;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  tipoCombustible: 'Gasolina Regular' | 'Gasolina Premium' | 'Diesel' | 'Gas LP' | 'Híbrido' | 'Eléctrico';
  capacidadTanqueLitros: number;
  odometroInicial: number;
  odometroActual: number;
  rendimientoTeoricoKmL: number;
  ubicacion?: string;
  fechaLecturaInicial?: string;
  controlaKilometraje: boolean | 'Si' | 'No' | 'Por horas';
  tipoControlMedicion?: TipoControlMedicion;
  estadoFinanciero?: EstadoFinancieroVehiculo;
  imagenUrl?: string;
  conductorId?: string;
  conductorNombre?: string;
  estado: 'Activo' | 'En Mantenimiento' | 'Inactivo';
  ultimoMantenimientoKm?: number;
  proximoMantenimientoKm?: number;
}

export interface SolicitudAutorizacion {
  id: string;
  fechaSolicitud: string;
  conductorId: string;
  conductorNombre: string;
  conductorTelefono: string;
  vehiculoId: string;
  vehiculoPlaca: string;
  odometroReportado: number;
  litrosSolicitados: number;
  estacionSugerida?: string;
  motivo: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'COMPLETADA';
  codigoAutorizacion?: string;
  montoMaximoEstimado?: number;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  notificacionId?: string;
}

export interface DatosExtraidosIA {
  estacion?: string;
  rfcEstacion?: string;
  numeroTicket?: string;
  claveNumerica?: string;
  fecha?: string;
  hora?: string;
  tipoCombustible?: string;
  litros?: number;
  precioPorLitro?: number;
  totalPagado?: number;
  odometroLeido?: number;
  pistero?: string;
  posicion?: string;
  despacho?: string;
  vehiculoDetectado?: string;
  kilometrajeTicket?: number;
  formaPago?: string;
  firmaConductor?: string;
  confianzaScore?: number;
  advertencias?: string[];
  lucesAdvertenciaTablero?: string[];
  esDuplicado?: boolean;
  duplicadoDetalle?: string;
}

export interface CargaCombustible {
  id: string;
  fecha: string;
  conductorId: string;
  conductorNombre: string;
  vehiculoId: string;
  vehiculoPlaca: string;
  solicitudAutorizacionId?: string;
  codigoAutorizacion?: string;
  estacion: string;
  numeroTicket?: string;
  claveNumerica?: string;
  tipoCombustible: string;
  litros: number;
  precioPorLitro: number;
  totalPagado: number;
  odometroAnterior: number;
  odometroActual: number;
  kmRecorridos: number;
  costoPorKm: number;
  rendimientoKmL: number;
  // Destino contable / Servicio de saldo
  servicioDestino?: string;
  saldoPrepagoId?: string;
  metodoPago?: string;
  estadoValidacion: 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO' | 'REQUIERE_REVISION';
  validadoPor?: string;
  fechaValidacion?: string;
  notasValidacion?: string;
  notaConductor?: string;
  fotoFacturaUrl?: string;
  fotoOdometroUrl?: string;
  datosIA?: DatosExtraidosIA;
  anomaliaDetectada?: boolean;
  motivoAnomalia?: string;
  esDuplicado?: boolean;
  duplicadoDetalle?: string;
}

export interface Mantenimiento {
  id: string;
  vehiculoId: string;
  vehiculoPlaca: string;
  fecha: string;
  odometroKm: number;
  tipo: 'Preventivo' | 'Correctivo' | 'Cambio de Aceite' | 'Frenos' | 'Neumáticos' | 'Afinación' | 'Inspección General';
  taller: string;
  descripcion: string;
  costo: number;
  proximoMantenimientoKm?: number;
  proximaFecha?: string;
  registradoPor: string;
  comprobanteUrl?: string;
}

export interface NotificacionSistema {
  id: string;
  fecha: string;
  remitente: string;
  destinatarioNombre: string;
  destinatarioRol?: 'ADMIN' | 'CONDUCTOR' | 'TODOS';
  destinatarioId?: string;
  tipo: 'SOLICITUD_AUTORIZACION' | 'CODIGO_APROBACION' | 'RECHAZO' | 'ALERTA_ANOMALIA' | 'RECORDATORIO_MANTENIMIENTO' | 'AVISO_SISTEMA';
  titulo: string;
  contenido: string;
  solicitudId?: string;
  leido: boolean;
  prioridad: 'NORMAL' | 'ALTA' | 'URGENTE';
  accionUrl?: string;
}

export type TipoMovimientoSaldo = 'deposito' | 'descuento' | 'ajuste' | 'carga_inicial';

export interface Estacion {
  id: string;
  nombre: string;
  direccion?: string;
  ubicacion: string;
  moneda: string; // Por defecto 'CRC'
  cedulaJuridica?: string;
  combustiblesDisponibles?: string[];
  activo: boolean;
  createdAt?: string;
}

export interface SaldoEstacion {
  id: string;
  estacionId: string;
  estacionNombre: string;
  saldoActual: number;
  moneda: string;
  umbralAlerta: number;
  activo: boolean;
  createdAt: string;
  updatedAt?: string;
  tipoCombustible?: string; // Opcional / bitácora
  // Campos calculados de conveniencia
  enAlerta?: boolean;
  totalDepositado?: number;
  totalDescontado?: number;
  ultimoMovimientoFecha?: string;
  movimientosCount?: number;
}

export interface MovimientoSaldo {
  id: string;
  saldoId: string;
  estacionNombre: string;
  tipoCombustible?: string;
  tipo: TipoMovimientoSaldo;
  monto: number; // Positivo para depósitos/entradas, negativo para descuentos
  saldoAnterior: number;
  saldoNuevo: number;
  registroCombustibleId?: string;
  vehiculoPlaca?: string;
  numeroTicket?: string;
  usuarioId: string;
  usuarioNombre: string;
  fecha: string;
  fechaDeposito?: string;
  notas?: string;
  comprobanteReferencia?: string;
}

export interface MetricasFlota {
  totalVehiculos: number;
  totalConductores: number;
  totalCargasRealizadas: number;
  cargasPendientesValidacion: number;
  solicitudesPendientes: number;
  gastoTotalCombustible: number;
  totalLitrosCargados: number;
  rendimientoPromedioFlotaKmL: number;
  costoPromedioPorKm: number;
  costoPromedioPorLitro: number;
  totalKmRecorridos: number;
  totalGastoMantenimiento: number;
  alertasAnomalias: number;
}

// ==========================================
// CONTROL DE CAJA CHICA DE COMBUSTIBLES
// ==========================================

export type EstadoCajaChica = 'ABIERTA' | 'EN_REPOSICION' | 'ARQUEADA' | 'CERRADA';

export interface CajaChica {
  id: string;
  codigo: string;
  nombre: string;
  custodioId: string;
  custodioNombre: string;
  custodioTelefono?: string;
  montoFondoFijo: number;
  saldoEfectivoActual: number;
  saldoComprobantesPendientes: number;
  umbralReposicion: number;
  moneda: string; // 'CRC'
  ubicacion?: string;
  estado: EstadoCajaChica;
  fechaApertura: string;
  fechaUltimoArqueo?: string;
  observaciones?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
  enAlertaReposicion?: boolean;
  porcentajeDisponible?: number;
  totalMovimientos?: number;
}

export type TipoMovimientoCajaChica =
  | 'APERTURA'
  | 'EGRESO_COMBUSTIBLE'
  | 'VALE_PROVISIONAL'
  | 'LIQUIDACION_VALE'
  | 'REPOSICION_FONDO'
  | 'AJUSTE_ARQUEO';

export interface MovimientoCajaChica {
  id: string;
  cajaChicaId: string;
  cajaChicaNombre: string;
  tipo: TipoMovimientoCajaChica;
  monto: number;
  saldoEfectivoAnterior: number;
  saldoEfectivoNuevo: number;
  fecha: string;
  fechaDocumento?: string;
  numeroVale?: string;
  numeroFactura?: string;
  vehiculoId?: string;
  vehiculoPlaca?: string;
  conductorId?: string;
  conductorNombre?: string;
  estacionServicio?: string;
  tipoCombustible?: string;
  litros?: number;
  precioPorLitro?: number;
  odometro?: number;
  concepto: string;
  motivo?: string;
  estado: 'COMPLETADO' | 'PENDIENTE_LIQUIDACION' | 'ANULADO';
  comprobanteUrl?: string;
  registradoPorId: string;
  registradoPorNombre: string;
  vueltoDevuelto?: number;
  cargaCombustibleId?: string;
  comprobanteReferencia?: string;
  notas?: string;
}

export interface DesgloseDenominacion {
  denominacion: number;
  cantidad: number;
  subtotal: number;
}

export interface ArqueoCajaChica {
  id: string;
  cajaChicaId: string;
  cajaChicaNombre: string;
  fechaArqueo: string;
  auditorId: string;
  auditorNombre: string;
  custodioNombre: string;
  fondoFijoTotal: number;
  efectivoContado: number;
  comprobantesMonto: number;
  valesPendientesMonto: number;
  totalAuditado: number;
  diferencia: number;
  resultado: 'CUADRE_EXACTO' | 'SOBRANTE' | 'FALTANTE';
  desgloseBilletesMonedas?: DesgloseDenominacion[];
  observaciones?: string;
  estado: 'APROBADO' | 'OBSERVADO';
}

export interface MetricasCajaChica {
  totalFondosFijos: number;
  totalEfectivoDisponible: number;
  totalComprobantesPorReintegrar: number;
  totalValesPendientes: number;
  cajasEnAlertaReposicion: number;
  totalCajasActivas: number;
}

export interface TestResultItem {
  nombre: string;
  modulo: string;
  paso: boolean;
  esperado: any;
  obtenido: any;
  error?: string;
  duracionMs: number;
}

export interface TestReport {
  total: number;
  pasados: number;
  fallidos: number;
  porcentajeExito: number;
  timestamp: string;
  resultados: TestResultItem[];
}
