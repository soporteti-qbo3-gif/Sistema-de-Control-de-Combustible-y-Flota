/**
 * Módulo de Auditoría y Trazabilidad Transaccional
 * Registra y audita operaciones críticas (saldos, autorizaciones, cargas) para
 * prevenir y detectar intentos de duplicación o manipulación de inventario financiero.
 */

export interface AuditLog {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  usuarioId?: string;
  datosAntes?: any;
  datosDespues?: any;
  timestamp: string;
  ip?: string;
}

export const audit_logs: AuditLog[] = [];

/**
 * Registra un evento de auditoría inmutable
 */
export function logAudit(
  accion: string,
  entidad: string,
  entidadId: string,
  usuarioId?: string,
  datosAntes?: any,
  datosDespues?: any,
  ip: string = '127.0.0.1'
): AuditLog {
  const nuevoLog: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    accion,
    entidad,
    entidadId,
    usuarioId: usuarioId || 'SISTEMA',
    datosAntes: datosAntes !== undefined ? JSON.parse(JSON.stringify(datosAntes)) : undefined,
    datosDespues: datosDespues !== undefined ? JSON.parse(JSON.stringify(datosDespues)) : undefined,
    timestamp: new Date().toISOString(),
    ip,
  };

  audit_logs.unshift(nuevoLog);
  return nuevoLog;
}

/**
 * Obtiene todos los logs de auditoría ordenados cronológicamente inverso
 */
export function obtenerAuditLogs(): AuditLog[] {
  return [...audit_logs];
}

/**
 * Limpia los logs de auditoría (para pruebas unitarias)
 */
export function limpiarAuditLogs(): void {
  audit_logs.length = 0;
}
