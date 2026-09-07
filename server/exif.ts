/**
 * Módulo de Extracción y Validación de Metadatos EXIF en Imágenes
 * Protege contra fraudes mediante fotos recicladas, comprobantes antiguos o imágenes adulteradas.
 */

import exifr from 'exifr';
import { captureException } from './sentry';

export interface MetadatosExif {
  tieneExif: boolean;
  fechaCapturaOriginal?: string;
  fechaCapturaTimestamp?: number;
  marcaDispositivo?: string;
  modeloDispositivo?: string;
  software?: string;
  latitud?: number;
  longitud?: number;
  esCapturaPantallaOEditada?: boolean;
  antiguedadHoras?: number;
  adulteracionDetectada?: boolean;
  motivoAdulteracion?: string;
}

export interface ResultadoValidacionExif {
  valido: boolean;
  esSospechoso: boolean;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  advertencias: string[];
  metadatos: MetadatosExif;
}

// Lista de aplicaciones de edición gráfica que alertan sobre posible falsificación
const SOFTWARE_EDICION_SOSPECHOSO = [
  'photoshop',
  'gimp',
  'canva',
  'picsart',
  'lightroom',
  'snapseed',
  'paint',
  'corel',
  'photo editor',
  'pixelmator',
];

/**
 * Convierte una cadena Base64 (con o sin prefijo data:image) a Buffer
 */
function base64ToBuffer(base64String: string): Buffer | null {
  try {
    if (!base64String || typeof base64String !== 'string') return null;
    const cleanBase64 = base64String.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '').trim();
    return Buffer.from(cleanBase64, 'base64');
  } catch (err) {
    captureException(err, { context: 'base64ToBuffer' });
    return null;
  }
}

/**
 * Extrae metadatos EXIF de una imagen en formato base64 o Buffer
 */
export async function extraerMetadatosExif(
  imagenBase64OBuf: string | Buffer,
  fechaReferenciaIso?: string
): Promise<MetadatosExif> {
  const buffer = typeof imagenBase64OBuf === 'string' ? base64ToBuffer(imagenBase64OBuf) : imagenBase64OBuf;

  if (!buffer || buffer.length === 0) {
    return {
      tieneExif: false,
    };
  }

  try {
    const rawExif = await exifr.parse(buffer, {
      pick: [
        'DateTimeOriginal',
        'CreateDate',
        'ModifyDate',
        'Make',
        'Model',
        'Software',
        'latitude',
        'longitude',
        'GPSLatitude',
        'GPSLongitude',
      ],
    });

    if (!rawExif) {
      return {
        tieneExif: false,
      };
    }

    const fechaCapturaRaw = rawExif.DateTimeOriginal || rawExif.CreateDate || rawExif.ModifyDate;
    let fechaCapturaOriginal: string | undefined;
    let fechaCapturaTimestamp: number | undefined;
    let antiguedadHoras: number | undefined;

    if (fechaCapturaRaw) {
      const parsedDate = new Date(fechaCapturaRaw);
      if (!isNaN(parsedDate.getTime())) {
        fechaCapturaOriginal = parsedDate.toISOString();
        fechaCapturaTimestamp = parsedDate.getTime();

        const referencia = fechaReferenciaIso ? new Date(fechaReferenciaIso).getTime() : Date.now();
        const diffMs = Math.abs(referencia - fechaCapturaTimestamp);
        antiguedadHoras = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const marcaDispositivo = rawExif.Make ? String(rawExif.Make).trim() : undefined;
    const modeloDispositivo = rawExif.Model ? String(rawExif.Model).trim() : undefined;
    const software = rawExif.Software ? String(rawExif.Software).trim() : undefined;

    let adulteracionDetectada = false;
    let motivoAdulteracion: string | undefined;

    if (software) {
      const softLower = software.toLowerCase();
      const softwareDetectado = SOFTWARE_EDICION_SOSPECHOSO.find((sw) => softLower.includes(sw));
      if (softwareDetectado) {
        adulteracionDetectada = true;
        motivoAdulteracion = `Imagen procesada con software de edición o retoque (${software})`;
      }
    }

    const latitud = typeof rawExif.latitude === 'number' ? rawExif.latitude : undefined;
    const longitud = typeof rawExif.longitude === 'number' ? rawExif.longitude : undefined;

    return {
      tieneExif: true,
      fechaCapturaOriginal,
      fechaCapturaTimestamp,
      marcaDispositivo,
      modeloDispositivo,
      software,
      latitud,
      longitud,
      esCapturaPantallaOEditada: adulteracionDetectada,
      antiguedadHoras,
      adulteracionDetectada,
      motivoAdulteracion,
    };
  } catch (_err) {
    // Si la imagen no tiene encabezado EXIF válido o es SVG/PNG sin EXIF
    return {
      tieneExif: false,
    };
  }
}

/**
 * Valida si la imagen de un comprobante u odómetro cumple con los criterios de frescura y autenticidad
 */
export async function validarExifComprobante(
  imagenBase64: string,
  fechaCargaIso?: string,
  maxHorasTolerancia: number = 8
): Promise<ResultadoValidacionExif> {
  const metadatos = await extraerMetadatosExif(imagenBase64, fechaCargaIso);
  const advertencias: string[] = [];
  let esSospechoso = false;
  let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';

  if (!metadatos.tieneExif) {
    return {
      valido: true,
      esSospechoso: false,
      nivelRiesgo: 'BAJO',
      advertencias: ['La imagen no contiene metadatos EXIF legibles (común al comprimir en mensajería móvil).'],
      metadatos,
    };
  }

  // 1. Detección de adulteración o software de edición gráfica
  if (metadatos.adulteracionDetectada) {
    esSospechoso = true;
    nivelRiesgo = 'ALTO';
    advertencias.push(metadatos.motivoAdulteracion || 'Metadatos indican alteración por software de edición.');
  }

  // 2. Comprobación de antigüedad de la fotografía respecto a la fecha del despacho
  if (metadatos.antiguedadHoras !== undefined && metadatos.antiguedadHoras > maxHorasTolerancia) {
    esSospechoso = true;
    nivelRiesgo = metadatos.antiguedadHoras > 24 ? 'ALTO' : 'MEDIO';
    advertencias.push(
      `Foto tomada hace ${metadatos.antiguedadHoras} horas (fecha captura: ${metadatos.fechaCapturaOriginal?.split('T')[0] || 'Desconocida'}). Discrepancia temporal significativa con el despacho actual (posible foto reciclada).`
    );
  }

  return {
    valido: true,
    esSospechoso,
    nivelRiesgo,
    advertencias,
    metadatos,
  };
}
