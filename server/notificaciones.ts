/**
 * Módulo de Notificaciones y Avisos Internos del Sistema de Flota
 * Gestiona el despacho en tiempo real de autorizaciones, tokens digitales y alertas de consumo
 */

import { NotificacionSistema, SolicitudAutorizacion, Vehiculo, CargaCombustible } from './types';

// Almacén en memoria de notificaciones del sistema
export const historialNotificaciones: NotificacionSistema[] = [
  {
    id: 'NOTIF-001',
    fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
    remitente: 'Carlos Mendoza (Conductor)',
    destinatarioNombre: 'Administrador de Flota',
    destinatarioRol: 'ADMIN',
    tipo: 'SOLICITUD_AUTORIZACION',
    titulo: 'Nueva Solicitud de Carga: ABC-1234',
    contenido: 'Carlos Mendoza solicita autorización para 65 Litros en Toyota Hilux (ABC-1234). Odómetro reportado: 48,920 km.',
    solicitudId: 'SOL-2026-001',
    leido: false,
    prioridad: 'ALTA',
    accionUrl: 'admin-solicitudes',
  },
  {
    id: 'NOTIF-002',
    fecha: new Date(Date.now() - 3600000 * 22).toISOString(),
    remitente: 'Sistema Central de Despacho',
    destinatarioNombre: 'María López',
    destinatarioRol: 'CONDUCTOR',
    tipo: 'CODIGO_APROBACION',
    titulo: 'Carga Aprobada - Token AUT-78942',
    contenido: 'Tu solicitud de 35 Litros para Nissan Versa (XYZ-5678) fue autorizada. Código de despacho: AUT-78942.',
    solicitudId: 'SOL-2026-002',
    leido: true,
    prioridad: 'NORMAL',
    accionUrl: 'conductor-home',
  },
  {
    id: 'NOTIF-003',
    fecha: new Date(Date.now() - 3600000 * 48).toISOString(),
    remitente: 'Auditoría de Consumo IA',
    destinatarioNombre: 'Administrador de Flota',
    destinatarioRol: 'ADMIN',
    tipo: 'ALERTA_ANOMALIA',
    titulo: 'Alerta de Rendimiento: Nissan Versa [XYZ-5678]',
    contenido: 'Se registró un rendimiento de 8.95 km/L (40.3% inferior al esperado de 15.0 km/L). Carga en revisión.',
    leido: false,
    prioridad: 'URGENTE',
    accionUrl: 'admin-validacion',
  },
];

/**
 * Despacha una nueva notificación en el sistema
 */
export function despacharNotificacion(
  remitente: string,
  destinatarioNombre: string,
  tipo: NotificacionSistema['tipo'],
  titulo: string,
  contenido: string,
  solicitudId?: string,
  prioridad: NotificacionSistema['prioridad'] = 'NORMAL',
  destinatarioRol?: NotificacionSistema['destinatarioRol'],
  accionUrl?: string
): NotificacionSistema {
  const nueva: NotificacionSistema = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fecha: new Date().toISOString(),
    remitente,
    destinatarioNombre,
    destinatarioRol: destinatarioRol || 'TODOS',
    tipo,
    titulo,
    contenido,
    solicitudId,
    leido: false,
    prioridad,
    accionUrl,
  };

  historialNotificaciones.unshift(nueva);

  if (historialNotificaciones.length > 150) {
    historialNotificaciones.pop();
  }

  console.log(`[Notificación Sistema] -> Para: ${destinatarioNombre} | Tipo: ${tipo} | Titulo: ${titulo}`);
  return nueva;
}

/**
 * Notifica al Administrador sobre una nueva solicitud de autorización de carga
 */
export function notificarAdminSolicitudCarga(
  solicitud: SolicitudAutorizacion,
  vehiculo: Vehiculo
): NotificacionSistema {
  const montoEstimado = (solicitud.litrosSolicitados * 24.5).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  const titulo = `Solicitud de Carga: ${solicitud.vehiculoPlaca} (${solicitud.conductorNombre})`;
  const contenido = `El conductor ${solicitud.conductorNombre} ha solicitado ${solicitud.litrosSolicitados} L (~${montoEstimado}) para la unidad ${vehiculo.marca} ${vehiculo.modelo} [${solicitud.vehiculoPlaca}]. Odómetro reportado: ${solicitud.odometroReportado.toLocaleString()} km. Motivo: "${solicitud.motivo}".`;

  return despacharNotificacion(
    solicitud.conductorNombre,
    'Administrador de Flota',
    'SOLICITUD_AUTORIZACION',
    titulo,
    contenido,
    solicitud.id,
    'ALTA',
    'ADMIN',
    'admin-solicitudes'
  );
}

/**
 * Notifica al Conductor con el código de autorización generado
 */
export function notificarConductorAprobacion(
  solicitud: SolicitudAutorizacion,
  codigoAutorizacion: string
): NotificacionSistema {
  const montoMax = (solicitud.litrosSolicitados * 24.5).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  const titulo = `¡Carga Autorizada! Token: ${codigoAutorizacion}`;
  const contenido = `Tu solicitud de carga para el vehículo ${solicitud.vehiculoPlaca} ha sido aprobada. Litros autorizados: ${solicitud.litrosSolicitados} L (Límite: ~${montoMax}). Al finalizar, recuerda escanear el ticket y foto del odómetro para validar.`;

  return despacharNotificacion(
    'Administrador de Flota',
    solicitud.conductorNombre,
    'CODIGO_APROBACION',
    titulo,
    contenido,
    solicitud.id,
    'NORMAL',
    'CONDUCTOR',
    'conductor-home'
  );
}

/**
 * Notifica al Conductor sobre el rechazo de la solicitud
 */
export function notificarConductorRechazo(
  solicitud: SolicitudAutorizacion,
  motivoRechazo: string
): NotificacionSistema {
  const titulo = `Solicitud No Autorizada: ${solicitud.vehiculoPlaca}`;
  const contenido = `Tu solicitud para la unidad ${solicitud.vehiculoPlaca} no fue autorizada. Motivo: "${motivoRechazo}". Comunícate con tu supervisor para detalles.`;

  return despacharNotificacion(
    'Administrador de Flota',
    solicitud.conductorNombre,
    'RECHAZO',
    titulo,
    contenido,
    solicitud.id,
    'ALTA',
    'CONDUCTOR',
    'conductor-home'
  );
}

/**
 * Notifica al Administrador sobre una anomalía de consumo detectada por el algoritmo
 */
export function notificarAdminAlertaAnomalia(
  carga: CargaCombustible,
  vehiculo: Vehiculo
): NotificacionSistema {
  const titulo = `Alerta de Anomalía en Consumo: ${carga.vehiculoPlaca}`;
  const contenido = `Discrepancia en unidad ${vehiculo.marca} ${vehiculo.modelo} [${carga.vehiculoPlaca}]: Rendimiento de ${carga.rendimientoKmL} km/L vs ${vehiculo.rendimientoTeoricoKmL} km/L esperado. ${carga.motivoAnomalia}. La carga quedó en revisión.`;

  return despacharNotificacion(
    'Auditoría IA de Flota',
    'Administrador de Flota',
    'ALERTA_ANOMALIA',
    titulo,
    contenido,
    carga.id,
    'URGENTE',
    'ADMIN',
    'admin-validacion'
  );
}
