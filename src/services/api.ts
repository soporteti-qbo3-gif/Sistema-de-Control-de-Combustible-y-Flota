/**
 * Cliente de API REST para el Sistema de Control de Combustible y Flota
 */

import {
  Usuario,
  Vehiculo,
  SolicitudAutorizacion,
  CargaCombustible,
  Mantenimiento,
  DatosExtraidosIA,
  NotificacionSistema,
  TestReport,
  SaldoEstacion,
  MovimientoSaldo,
  Estacion,
  CajaChica,
  MovimientoCajaChica,
  ArqueoCajaChica,
  MetricasCajaChica,
  DesgloseDenominacion,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('flota_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

let refreshPromise: Promise<string | null> | null = null;

async function renewToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      localStorage.removeItem('flota_token');
      const email = localStorage.getItem('flota_user_email') || 'admin@flota.com';
      const loginRes = await window.fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!loginRes.ok) {
        return null;
      }
      const data = await loginRes.json();
      if (data && data.token) {
        localStorage.setItem('flota_token', data.token);
        if (data.usuario?.email) {
          localStorage.setItem('flota_user_email', data.usuario.email);
        }
        window.dispatchEvent(new CustomEvent('flota_auth_renewed', { detail: data }));
        return data.token;
      }
      return null;
    } catch (e) {
      console.warn('Error renovando token automáticamente:', e);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let res = await window.fetch(input, init);

  const urlStr = typeof input === 'string' ? input : input.toString();
  // Si devuelve 401 y no es la petición de login, renovar token automáticamente y reintentar
  if (res.status === 401 && !urlStr.includes('/auth/login')) {
    const newToken = await renewToken();
    if (newToken) {
      const headers = new Headers(init?.headers || {});
      headers.set('Authorization', `Bearer ${newToken}`);
      res = await window.fetch(input, {
        ...init,
        headers,
      });
    }
  }

  return res;
}

const fetch = customFetch;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = 'Error en la solicitud';
    try {
      const errorJson = await res.json();
      errorMsg = errorJson.error || errorMsg;
    } catch {
      errorMsg = `Error HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorMsg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Autenticación
  async login(email: string): Promise<{ token: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Vehículos
  async getVehiculos(): Promise<Vehiculo[]> {
    const res = await fetch(`${API_BASE}/vehiculos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createVehiculo(data: Partial<Vehiculo>): Promise<Vehiculo> {
    const res = await fetch(`${API_BASE}/vehiculos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateVehiculo(id: string, data: Partial<Vehiculo>): Promise<Vehiculo> {
    const res = await fetch(`${API_BASE}/vehiculos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteVehiculo(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/vehiculos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async actualizarFotoVehiculo(id: string, imagenUrl: string): Promise<Vehiculo> {
    const res = await fetch(`${API_BASE}/vehiculos/${id}/foto`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ imagenUrl }),
    });
    return handleResponse(res);
  },

  async resetKilometrajeVehiculos(): Promise<{ message: string; vehiculos: Vehiculo[] }> {
    const res = await fetch(`${API_BASE}/vehiculos/reset-kilometraje`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Conductores
  async getConductores(): Promise<Usuario[]> {
    const res = await fetch(`${API_BASE}/conductores`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createConductor(data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/conductores`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateConductor(id: string, data: Partial<Usuario>): Promise<Usuario> {
    const res = await fetch(`${API_BASE}/conductores/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Solicitudes de Autorización
  async getSolicitudes(): Promise<SolicitudAutorizacion[]> {
    const res = await fetch(`${API_BASE}/solicitudes`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createSolicitud(data: {
    vehiculoId: string;
    odometroReportado: number;
    litrosSolicitados: number;
    estacionSugerida?: string;
    motivo: string;
  }): Promise<SolicitudAutorizacion> {
    const res = await fetch(`${API_BASE}/solicitudes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async aprobarSolicitud(id: string): Promise<{ message: string; solicitud: SolicitudAutorizacion }> {
    const res = await fetch(`${API_BASE}/solicitudes/${id}/aprobar`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async rechazarSolicitud(id: string, motivo: string): Promise<{ message: string; solicitud: SolicitudAutorizacion }> {
    const res = await fetch(`${API_BASE}/solicitudes/${id}/rechazar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ motivo }),
    });
    return handleResponse(res);
  },

  // Extracción Asistida por IA Gemini
  async extraerDatosIA(data: {
    fotoFacturaBase64?: string;
    fotoOdometroBase64?: string;
    odometroAnteriorReferencia?: number;
  }): Promise<DatosExtraidosIA> {
    const res = await fetch(`${API_BASE}/ia/extraer`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Cargas de Combustible
  async getCargas(params?: { estado?: string; vehiculoId?: string }): Promise<CargaCombustible[]> {
    const query = new URLSearchParams();
    if (params?.estado) query.append('estado', params.estado);
    if (params?.vehiculoId) query.append('vehiculoId', params.vehiculoId);

    const res = await fetch(`${API_BASE}/cargas?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createCarga(data: {
    vehiculoId: string;
    solicitudAutorizacionId?: string;
    codigoAutorizacion?: string;
    estacion: string;
    numeroTicket?: string;
    claveNumerica?: string;
    tipoCombustible?: string;
    litros: number;
    precioPorLitro?: number;
    totalPagado: number;
    odometroActual: number;
    fotoFacturaBase64?: string;
    fotoOdometroBase64?: string;
    notaConductor?: string;
    datosIA?: DatosExtraidosIA;
  }): Promise<CargaCombustible> {
    const res = await fetch(`${API_BASE}/cargas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async verificarDuplicadoFactura(data: {
    numeroTicket?: string;
    claveNumerica?: string;
    fecha?: string;
    totalPagado?: number;
    litros?: number;
    estacion?: string;
    vehiculoId?: string;
    cargaIdIgnorar?: string;
  }): Promise<{ esDuplicado: boolean; motivo?: string; cargaExistente?: CargaCombustible }> {
    const res = await fetch(`${API_BASE}/cargas/verificar-duplicado`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async actualizarCarga(
    id: string,
    data: {
      estacion?: string;
      tipoCombustible?: string;
      servicioDestino?: string;
      saldoPrepagoId?: string;
      metodoPago?: string;
      numeroTicket?: string;
      claveNumerica?: string;
      fecha?: string;
      litros?: number;
      precioPorLitro?: number;
      totalPagado?: number;
      odometroActual?: number;
      vehiculoId?: string;
      conductorId?: string;
      notasValidacion?: string;
      estadoValidacion?: 'PENDIENTE' | 'VALIDADO' | 'RECHAZADO' | 'REQUIERE_REVISION';
    }
  ): Promise<{ message: string; carga: CargaCombustible }> {
    const res = await fetch(`${API_BASE}/cargas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async validarCarga(
    id: string,
    data: {
      estadoValidacion: 'VALIDADO' | 'RECHAZADO' | 'REQUIERE_REVISION';
      notasValidacion?: string;
      litros?: number;
      totalPagado?: number;
      precioPorLitro?: number;
      odometroActual?: number;
      estacion?: string;
      tipoCombustible?: string;
      servicioDestino?: string;
      saldoPrepagoId?: string;
      metodoPago?: string;
      numeroTicket?: string;
      claveNumerica?: string;
      fecha?: string;
      vehiculoId?: string;
      conductorId?: string;
    }
  ): Promise<{ message: string; carga: CargaCombustible }> {
    const res = await fetch(`${API_BASE}/cargas/${id}/validar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteCarga(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/cargas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async limpiarTodasCargas(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/cargas/todas`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Mantenimientos
  async getMantenimientos(vehiculoId?: string): Promise<Mantenimiento[]> {
    const query = vehiculoId ? `?vehiculoId=${vehiculoId}` : '';
    const res = await fetch(`${API_BASE}/mantenimientos${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createMantenimiento(data: Partial<Mantenimiento>): Promise<Mantenimiento> {
    const res = await fetch(`${API_BASE}/mantenimientos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Reportes y Dashboard
  async getDashboard(): Promise<any> {
    const res = await fetch(`${API_BASE}/reportes/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Notificaciones Internas
  async getNotificaciones(): Promise<NotificacionSistema[]> {
    const res = await fetch(`${API_BASE}/notificaciones`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async marcarNotificacionLeida(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/notificaciones/${id}/leida`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async marcarTodasLeidas(): Promise<any> {
    const res = await fetch(`${API_BASE}/notificaciones/marcar-todas-leidas`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async enviarNotificacion(data: {
    destinatarioNombre?: string;
    tipo?: string;
    titulo: string;
    contenido: string;
    prioridad?: string;
    destinatarioRol?: string;
  }): Promise<any> {
    const res = await fetch(`${API_BASE}/notificaciones/enviar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // Saldos Prepago por Estación y Bomba
  async getSaldos(): Promise<SaldoEstacion[]> {
    const res = await fetch(`${API_BASE}/saldos`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getSaldosAlertas(): Promise<SaldoEstacion[]> {
    const res = await fetch(`${API_BASE}/saldos/alertas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getSaldo(id: string): Promise<SaldoEstacion & { movimientos: MovimientoSaldo[] }> {
    const res = await fetch(`${API_BASE}/saldos/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createSaldo(data: {
    estacionId?: string;
    estacionNombre?: string;
    tipoCombustible?: string;
    saldoInicial: number;
    umbralAlerta?: number;
    moneda?: string;
  }): Promise<SaldoEstacion> {
    const res = await fetch(`${API_BASE}/saldos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async registrarDeposito(
    saldoId: string,
    data: {
      monto: number;
      fechaDeposito?: string;
      notas?: string;
      comprobanteReferencia?: string;
    }
  ): Promise<{ message: string; saldo: SaldoEstacion; movimiento: MovimientoSaldo }> {
    const res = await fetch(`${API_BASE}/saldos/${saldoId}/depositos`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async ajustarSaldo(
    saldoId: string,
    data: {
      nuevoSaldo: number;
      notas: string;
    }
  ): Promise<{ message: string; saldo: SaldoEstacion; movimiento: MovimientoSaldo }> {
    const res = await fetch(`${API_BASE}/saldos/${saldoId}/ajustar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async actualizarUmbral(saldoId: string, umbralAlerta: number): Promise<{ message: string; saldo: SaldoEstacion }> {
    const res = await fetch(`${API_BASE}/saldos/${saldoId}/umbral`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ umbralAlerta }),
    });
    return handleResponse(res);
  },

  async getMovimientosSaldo(
    saldoId: string,
    params?: { tipo?: string; fechaDesde?: string; fechaHasta?: string }
  ): Promise<MovimientoSaldo[]> {
    const query = new URLSearchParams();
    if (params?.tipo) query.append('tipo', params.tipo);
    if (params?.fechaDesde) query.append('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) query.append('fechaHasta', params.fechaHasta);

    const res = await fetch(`${API_BASE}/saldos/${saldoId}/movimientos?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getTodosMovimientos(params?: {
    saldoId?: string;
    estacion?: string;
    tipoCombustible?: string;
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<MovimientoSaldo[]> {
    const query = new URLSearchParams();
    if (params?.saldoId) query.append('saldoId', params.saldoId);
    if (params?.estacion) query.append('estacion', params.estacion);
    if (params?.tipoCombustible) query.append('tipoCombustible', params.tipoCombustible);
    if (params?.tipo) query.append('tipo', params.tipo);
    if (params?.fechaDesde) query.append('fechaDesde', params.fechaDesde);
    if (params?.fechaHasta) query.append('fechaHasta', params.fechaHasta);

    const res = await fetch(`${API_BASE}/movimientos-saldos?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Estaciones
  async getEstaciones(activo?: boolean | string): Promise<Estacion[]> {
    const url = activo !== undefined ? `${API_BASE}/estaciones?activo=${activo}` : `${API_BASE}/estaciones`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createEstacion(data: {
    nombre: string;
    ubicacion?: string;
    direccion?: string;
    moneda?: string;
    cedulaJuridica?: string;
    combustiblesDisponibles?: string[];
    saldoInicial?: number;
    umbralAlerta?: number;
    activo?: boolean;
  }): Promise<{ message: string; estacion: Estacion; saldo?: SaldoEstacion }> {
    const res = await fetch(`${API_BASE}/estaciones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateEstacion(id: string, data: Partial<Estacion>): Promise<{ message: string; estacion: Estacion }> {
    const res = await fetch(`${API_BASE}/estaciones/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async desactivarEstacion(id: string): Promise<{ message: string; estacion: Estacion }> {
    const res = await fetch(`${API_BASE}/estaciones/${id}/desactivar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async activarEstacion(id: string): Promise<{ message: string; estacion: Estacion }> {
    const res = await fetch(`${API_BASE}/estaciones/${id}/activar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async deleteEstacion(id: string): Promise<{ message: string; accion: string }> {
    const res = await fetch(`${API_BASE}/estaciones/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Gestión de Usuarios y Administradores
  async getUsuarios(params?: { rol?: string; activo?: boolean | string }): Promise<Usuario[]> {
    const query = new URLSearchParams();
    if (params?.rol) query.append('rol', params.rol);
    if (params?.activo !== undefined) query.append('activo', String(params.activo));

    const res = await fetch(`${API_BASE}/usuarios?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createAdmin(data: {
    nombre: string;
    email: string;
    telefonoContacto: string;
    tempPassword?: string;
    activo?: boolean;
  }): Promise<{ message: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/usuarios/admin`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async createConductorUser(data: {
    nombre: string;
    email: string;
    telefonoContacto: string;
    licencia?: string;
    vehiculoAsignadoId?: string;
    tempPassword?: string;
    activo?: boolean;
  }): Promise<{ message: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/usuarios/conductor`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateUsuario(id: string, data: Partial<Usuario>): Promise<{ message: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async suspenderUsuario(id: string): Promise<{ message: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/usuarios/${id}/suspender`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async activarUsuario(id: string): Promise<{ message: string; usuario: Usuario }> {
    const res = await fetch(`${API_BASE}/usuarios/${id}/activar`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async deleteUsuario(id: string): Promise<{ message: string; accion: string }> {
    const res = await fetch(`${API_BASE}/usuarios/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async cambiarPassword(data: {
    passwordAnterior?: string;
    passwordNuevo: string;
  }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/auth/cambiar-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  // ==========================================
  // Control de Caja Chica de Combustibles
  // ==========================================
  async getCajasChicas(): Promise<CajaChica[]> {
    const res = await fetch(`${API_BASE}/cajas-chicas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getCajaChicaMetricas(): Promise<MetricasCajaChica> {
    const res = await fetch(`${API_BASE}/cajas-chicas/metricas`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getCajaChica(id: string): Promise<CajaChica> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async createCajaChica(data: {
    nombre: string;
    codigo?: string;
    custodioId?: string;
    custodioNombre: string;
    custodioTelefono?: string;
    montoFondoFijo: number;
    saldoInicial?: number;
    umbralReposicion?: number;
    moneda?: string;
    ubicacion?: string;
    observaciones?: string;
  }): Promise<{ message: string; caja: CajaChica; movimiento?: MovimientoCajaChica }> {
    const res = await fetch(`${API_BASE}/cajas-chicas`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateCajaChica(id: string, data: Partial<CajaChica>): Promise<{ message: string; caja: CajaChica }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteCajaChica(id: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async registrarEgresoCajaChica(
    id: string,
    data: {
      monto: number;
      fechaDocumento?: string;
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
      comprobanteUrl?: string;
      notas?: string;
    }
  ): Promise<{ message: string; caja: CajaChica; movimiento: MovimientoCajaChica }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}/egreso`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async emitirValeCajaChica(
    id: string,
    data: {
      montoEstimado: number;
      conductorId?: string;
      conductorNombre: string;
      vehiculoId?: string;
      vehiculoPlaca?: string;
      concepto?: string;
      motivo?: string;
      fechaDocumento?: string;
      notas?: string;
    }
  ): Promise<{ message: string; caja: CajaChica; movimiento: MovimientoCajaChica }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}/vales`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async liquidarValeCajaChica(
    valeId: string,
    data: {
      montoGastoReal: number;
      numeroFactura?: string;
      estacionServicio?: string;
      tipoCombustible?: string;
      litros?: number;
      precioPorLitro?: number;
      odometro?: number;
      comprobanteUrl?: string;
      notas?: string;
    }
  ): Promise<{
    message: string;
    caja: CajaChica;
    valeOriginal: MovimientoCajaChica;
    movimientoLiquidacion: MovimientoCajaChica;
  }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/vales/${valeId}/liquidar`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async reposicionFondoCajaChica(
    id: string,
    data?: {
      montoReposicion?: number;
      comprobanteReferencia?: string;
      fechaDocumento?: string;
      notas?: string;
    }
  ): Promise<{ message: string; caja: CajaChica; movimiento: MovimientoCajaChica }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}/reposicion`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });
    return handleResponse(res);
  },

  async realizarArqueoCajaChica(
    id: string,
    data: {
      efectivoContado: number;
      comprobantesMonto?: number;
      valesPendientesMonto?: number;
      desgloseBilletesMonedas?: DesgloseDenominacion[];
      observaciones?: string;
      ajustarSaldoAutomaticamente?: boolean;
    }
  ): Promise<{
    message: string;
    arqueo: ArqueoCajaChica;
    caja: CajaChica;
    movimientoAjuste?: MovimientoCajaChica;
  }> {
    const res = await fetch(`${API_BASE}/cajas-chicas/${id}/arqueo`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getMovimientosCajaChica(filtros?: {
    cajaChicaId?: string;
    tipo?: string;
    estado?: string;
    conductorId?: string;
    vehiculoPlaca?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): Promise<MovimientoCajaChica[]> {
    const params = new URLSearchParams();
    if (filtros?.cajaChicaId) params.append('cajaChicaId', filtros.cajaChicaId);
    if (filtros?.tipo) params.append('tipo', filtros.tipo);
    if (filtros?.estado) params.append('estado', filtros.estado);
    if (filtros?.conductorId) params.append('conductorId', filtros.conductorId);
    if (filtros?.vehiculoPlaca) params.append('vehiculoPlaca', filtros.vehiculoPlaca);
    if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
    if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/cajas-chicas/movimientos${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  async getArqueosCajaChica(cajaChicaId?: string): Promise<ArqueoCajaChica[]> {
    const query = cajaChicaId ? `?cajaChicaId=${cajaChicaId}` : '';
    const res = await fetch(`${API_BASE}/cajas-chicas/arqueos${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Pruebas Unitarias
  async ejecutarPruebas(): Promise<TestReport> {
    const res = await fetch(`${API_BASE}/tests/run`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  // Restaurar demo
  async resetDemo(): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/reset-demo`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
