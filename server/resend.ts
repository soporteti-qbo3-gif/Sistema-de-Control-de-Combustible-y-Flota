/**
 * Servicio de Envío de Correos Electrónicos con Resend
 * Incluye inicialización perezosa, plantillas HTML profesionales para la flota
 * y modo simulado cuando no se dispone de RESEND_API_KEY.
 */

import { Resend } from 'resend';
import { captureException } from './sentry';

let resendClient: Resend | null = null;

/**
 * Obtiene o inicializa la instancia de Resend de forma segura
 */
export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_RESEND_API_KEY') {
    return null;
  }

  if (!resendClient) {
    try {
      resendClient = new Resend(apiKey);
    } catch (err) {
      captureException(err, { context: 'getResendClient initialization' });
      return null;
    }
  }

  return resendClient;
}

/**
 * Comprueba si el servicio Resend está configurado con clave real
 */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '');
}

export interface OpcionesEmail {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface ResultadoEmail {
  success: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Función principal para despachar un correo electrónico
 */
export async function enviarEmail(opciones: OpcionesEmail): Promise<ResultadoEmail> {
  const remitente = opciones.from || process.env.RESEND_FROM_EMAIL || 'Control de Flota <onboarding@resend.dev>';
  const destinatarios = Array.isArray(opciones.to) ? opciones.to : [opciones.to];
  const client = getResendClient();

  if (!client) {
    console.info(`📧 [EMAIL_SIMULADO] Para: ${destinatarios.join(', ')} | Asunto: "${opciones.subject}"`);
    return {
      success: true,
      simulated: true,
      id: `sim-${Date.now()}`,
    };
  }

  try {
    const { data, error } = await client.emails.send({
      from: remitente,
      to: destinatarios,
      subject: opciones.subject,
      html: opciones.html,
      text: opciones.text,
    });

    if (error) {
      // Si estamos en modo de prueba de Resend (sin dominio verificado) y rebotó por destinatario no autorizado:
      const matchAllowed = error.message?.match(/your own email address \(([^)]+)\)/i);
      if (matchAllowed && matchAllowed[1] && !destinatarios.includes(matchAllowed[1])) {
        const allowedEmail = matchAllowed[1].trim();
        console.warn(`⚠️ [RESEND_TEST_FALLBACK] Redirigiendo a dirección autorizada de pruebas: ${allowedEmail}`);
        try {
          const fallbackRes = await client.emails.send({
            from: remitente,
            to: [allowedEmail],
            subject: `[Sandbox Resend ➜ ${destinatarios.join(', ')}] ${opciones.subject}`,
            html: `
              <div style="padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; margin-bottom: 20px; font-size: 13px; color: #92400e; border-radius: 8px;">
                ⚠️ <strong>Aviso de Modo Sandbox de Resend:</strong> Este correo iba destinado originalmente a <code>${destinatarios.join(', ')}</code>. Como aún no se ha verificado un dominio personalizado en <a href="https://resend.com/domains" target="_blank">resend.com/domains</a>, Resend redirige las notificaciones a la dirección de tu cuenta autorizada (<code>${allowedEmail}</code>).
              </div>
            ` + opciones.html,
            text: opciones.text,
          });

          if (!fallbackRes.error) {
            return {
              success: true,
              id: fallbackRes.data?.id,
              simulated: false,
              advertenciaSandbox: `Redirigido a buzón verificado de Resend (${allowedEmail}) porque el dominio no está verificado aún.`,
            };
          }
        } catch (fbErr: any) {
          console.error('❌ [RESEND_FALLBACK_ERROR]', fbErr);
        }
      }

      console.error('❌ [RESEND_ERROR]', error);
      captureException(error, { context: 'enviarEmail', destinatarios, subject: opciones.subject });
      return {
        success: false,
        error: error.message || 'Error al enviar correo con Resend',
      };
    }

    return {
      success: true,
      id: data?.id,
      simulated: false,
    };
  } catch (err: any) {
    console.error('❌ [RESEND_EXCEPTION]', err);
    captureException(err, { context: 'enviarEmail exception', destinatarios });
    return {
      success: false,
      error: err?.message || 'Excepción no controlada en Resend',
    };
  }
}

/**
 * Envía alerta por sospecha de fraude o anomalía crítica de combustible
 */
export async function enviarAlertaFraude(
  destinatarios: string[],
  datos: {
    vehiculoPlaca: string;
    vehiculoModelo?: string;
    conductorNombre: string;
    litrosCargados: number;
    capacidadTanqueLitros: number;
    litrosEsperados?: number;
    excesoLitros?: number;
    porcentajeDesviacion?: number;
    estacion?: string;
    motivo: string;
    nivelAlerta: 'AMARILLO' | 'ROJO' | 'CRITICO';
    fecha?: string;
  }
): Promise<ResultadoEmail> {
  const colorBorde = datos.nivelAlerta === 'CRITICO' || datos.nivelAlerta === 'ROJO' ? '#ef4444' : '#f59e0b';
  const tituloAlerta =
    datos.nivelAlerta === 'CRITICO'
      ? '🚨 ALERTA CRÍTICA: FRAUDE DE COMBUSTIBLE DETECTADO'
      : datos.nivelAlerta === 'ROJO'
        ? '⚠️ ALERTA ROJA: SOBRECONSUMO O EXCESO DE CAPACIDAD'
        : '⚡ ALERTA MODERADA: DESVIACIÓN DE COMBUSTIBLE';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 24px; background-color: #f8fafc; color: #1e293b; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border-top: 6px solid ${colorBorde}; box-shadow: 0 4px 12px rgba(0,0,0,0.06); overflow: hidden; }
        .header { padding: 24px 28px; background: #ffffff; border-bottom: 1px solid #e2e8f0; }
        .header h1 { margin: 0 0 6px 0; font-size: 20px; color: ${colorBorde}; font-weight: 700; }
        .header p { margin: 0; color: #64748b; font-size: 14px; }
        .content { padding: 24px 28px; }
        .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; font-size: 14px; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; }
        th { color: #64748b; font-weight: 600; width: 40%; }
        td { color: #0f172a; font-weight: 500; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; background: ${colorBorde}; color: #ffffff; }
        .footer { padding: 18px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${tituloAlerta}</h1>
          <p>Sistema de Monitoreo y Blindaje Anti-Fraude de Flota</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <strong>Motivo:</strong> ${datos.motivo}
          </div>
          <table>
            <tr>
              <th>Vehículo / Placa</th>
              <td><strong>${datos.vehiculoPlaca}</strong> ${datos.vehiculoModelo ? `(${datos.vehiculoModelo})` : ''}</td>
            </tr>
            <tr>
              <th>Conductor</th>
              <td>${datos.conductorNombre}</td>
            </tr>
            <tr>
              <th>Litros Despachados</th>
              <td><strong>${datos.litrosCargados} L</strong></td>
            </tr>
            <tr>
              <th>Capacidad del Tanque</th>
              <td>${datos.capacidadTanqueLitros} L</td>
            </tr>
            ${
              datos.litrosEsperados !== undefined
                ? `<tr><th>Litros Teóricos Esperados</th><td>${datos.litrosEsperados} L</td></tr>`
                : ''
            }
            ${
              datos.excesoLitros !== undefined
                ? `<tr><th>Exceso Estimado</th><td><span style="color:${colorBorde};font-weight:700;">+${datos.excesoLitros} L</span></td></tr>`
                : ''
            }
            ${
              datos.porcentajeDesviacion !== undefined
                ? `<tr><th>Desviación</th><td>${datos.porcentajeDesviacion > 0 ? '+' : ''}${datos.porcentajeDesviacion}%</td></tr>`
                : ''
            }
            <tr>
              <th>Estación de Servicio</th>
              <td>${datos.estacion || 'No especificada'}</td>
            </tr>
            <tr>
              <th>Fecha y Hora</th>
              <td>${datos.fecha || new Date().toLocaleString('es-CR')}</td>
            </tr>
            <tr>
              <th>Nivel de Riesgo</th>
              <td><span class="badge">${datos.nivelAlerta}</span></td>
            </tr>
          </table>
          <p style="font-size:13px; color:#475569; margin: 0; line-height: 1.5;">
            <strong>Acción recomendada:</strong> Se sugiere auditar el comprobante físico, revisar las lecturas de odómetro en el tablero y realizar una inspección de volumetría.
          </p>
        </div>
        <div class="footer">
          Notificación automática generada por PagSurr Fleet Control. Por favor no responder a este correo.
        </div>
      </div>
    </body>
    </html>
  `;

  return enviarEmail({
    to: destinatarios,
    subject: `[${datos.nivelAlerta}] Alerta Anti-Fraude Combustible - ${datos.vehiculoPlaca}`,
    html,
    text: `${tituloAlerta}\nVehículo: ${datos.vehiculoPlaca}\nConductor: ${datos.conductorNombre}\nLitros: ${datos.litrosCargados} L (Tanque: ${datos.capacidadTanqueLitros} L)\nMotivo: ${datos.motivo}`,
  });
}

/**
 * Envía alerta cuando el saldo en una bomba prepago está próximo a agotarse
 */
export async function enviarAlertaSaldoBomba(
  destinatarios: string[],
  datos: {
    bombaNombre: string;
    saldoRestante: number;
    porcentajeRestante: number;
    diasRestantes: number;
    fechaEstimadaAgotamiento: string;
    alerta: 'AMARILLO' | 'ROJO';
  }
): Promise<ResultadoEmail> {
  const color = datos.alerta === 'ROJO' ? '#ef4444' : '#f59e0b';
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:sans-serif; background:#f8fafc; padding:20px; color:#1e293b;">
      <div style="max-width:550px; margin:0 auto; background:#fff; border-radius:8px; border-top:5px solid ${color}; padding:24px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="margin-top:0; color:${color};">⚠️ Alerta Presupuestaria de Bomba Prepago</h2>
        <p>El saldo disponible en la estación <strong>${datos.bombaNombre}</strong> está disminuyendo:</p>
        <ul style="line-height:1.8;">
          <li><strong>Saldo Restante:</strong> ₡${Math.round(datos.saldoRestante).toLocaleString('es-CR')} CRC (${datos.porcentajeRestante}%)</li>
          <li><strong>Días Proyectados de Servicio:</strong> ${datos.diasRestantes} días</li>
          <li><strong>Fecha Estimada de Agotamiento:</strong> ${datos.fechaEstimadaAgotamiento}</li>
        </ul>
        <p style="font-size:13px; color:#64748b;">Se recomienda coordinar el depósito mensual de reposición para evitar interrupciones en los despachos de la flota.</p>
      </div>
    </body>
    </html>
  `;

  return enviarEmail({
    to: destinatarios,
    subject: `[ALERTA PRESUPUESTO] Saldo Crítico en ${datos.bombaNombre}`,
    html,
    text: `Alerta Presupuestaria: Saldo en ${datos.bombaNombre} es de ₡${datos.saldoRestante} (${datos.porcentajeRestante}% restante). Días proyectados: ${datos.diasRestantes}.`,
  });
}
