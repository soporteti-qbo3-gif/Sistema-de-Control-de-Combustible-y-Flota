/**
 * Módulo de Cálculos Matemáticos y Métricas de Rendimiento de Flota
 * Cumple con los Criterios de Aceptación del Sistema
 */

export interface ResultadoCalculoMetricas {
  kmRecorridos: number;
  costoPorKm: number;
  rendimientoKmL: number;
  costoPorLitro: number;
  anomalia: boolean;
  motivoAnomalia?: string;
}

/**
 * Calcula los kilómetros recorridos entre dos lecturas de odómetro.
 * km_recorridos = odometro_actual - odometro_anterior
 */
export function calcularKmRecorridos(odometroActual: number, odometroAnterior: number): number {
  if (odometroActual < odometroAnterior) {
    throw new Error('El odómetro actual no puede ser menor al odómetro anterior.');
  }
  return Number((odometroActual - odometroAnterior).toFixed(2));
}

/**
 * Calcula el costo por kilómetro recorrido.
 * costo_km = costo_total / km_recorridos
 */
export function calcularCostoPorKm(costoTotal: number, kmRecorridos: number): number {
  if (costoTotal < 0) {
    throw new Error('El costo total no puede ser negativo.');
  }
  if (kmRecorridos <= 0) {
    return 0; // O primer registro sin distancia previa
  }
  return Number((costoTotal / kmRecorridos).toFixed(2));
}

/**
 * Calcula el rendimiento de combustible en kilómetros por litro (km/L).
 * rendimiento = km_recorridos / litros
 */
export function calcularRendimiento(kmRecorridos: number, litros: number): number {
  if (litros <= 0) {
    throw new Error('La cantidad de litros debe ser mayor a cero.');
  }
  if (kmRecorridos < 0) {
    throw new Error('Los kilómetros recorridos no pueden ser negativos.');
  }
  return Number((kmRecorridos / litros).toFixed(2));
}

/**
 * Calcula el costo unitario por litro.
 * costo_litro = total_pagado / litros
 */
export function calcularCostoPorLitro(totalPagado: number, litros: number): number {
  if (litros <= 0) {
    throw new Error('La cantidad de litros debe ser mayor a cero.');
  }
  if (totalPagado < 0) {
    throw new Error('El total pagado no puede ser negativo.');
  }
  return Number((totalPagado / litros).toFixed(2));
}

/**
 * Evalúa si una carga presenta anomalías respecto al rendimiento teórico o parámetros de flota.
 */
export function detectarAnomaliaRendimiento(
  rendimientoReal: number,
  rendimientoTeorico: number,
  umbralVariacionPorcentual: number = 25 // 25% de tolerancia
): { esAnomalo: boolean; motivo?: string } {
  if (rendimientoReal <= 0) {
    return { esAnomalo: true, motivo: 'Rendimiento reportado en 0 km/L (sin avance de odómetro o litros excesivos).' };
  }

  if (rendimientoTeorico <= 0) {
    return { esAnomalo: false };
  }

  const variacion = ((rendimientoReal - rendimientoTeorico) / rendimientoTeorico) * 100;

  // Rendimiento significativamente menor al esperado (posible fuga, robo o problema mecánico)
  if (variacion < -umbralVariacionPorcentual) {
    return {
      esAnomalo: true,
      motivo: `Bajo rendimiento crítico: ${rendimientoReal} km/L vs ${rendimientoTeorico} km/L teórico (${Math.abs(variacion).toFixed(1)}% por debajo de lo esperado).`,
    };
  }

  // Rendimiento físicamente imposible (posible error de captura en odómetro)
  if (variacion > umbralVariacionPorcentual * 2.5) {
    return {
      esAnomalo: true,
      motivo: `Rendimiento inusualmente alto: ${rendimientoReal} km/L vs ${rendimientoTeorico} km/L teórico (${variacion.toFixed(1)}% por encima). Verificar odómetro.`,
    };
  }

  return { esAnomalo: false };
}

/**
 * Realiza el cálculo integral de todas las métricas de una carga.
 */
export function procesarMetricasCarga(
  odometroActual: number,
  odometroAnterior: number,
  litros: number,
  totalPagado: number,
  rendimientoTeoricoVehiculo: number = 10
): ResultadoCalculoMetricas {
  const kmRecorridos = calcularKmRecorridos(odometroActual, odometroAnterior);
  const costoPorKm = calcularCostoPorKm(totalPagado, kmRecorridos);
  const rendimientoKmL = calcularRendimiento(kmRecorridos, litros);
  const costoPorLitro = calcularCostoPorLitro(totalPagado, litros);
  const anomaliaCheck = detectarAnomaliaRendimiento(rendimientoKmL, rendimientoTeoricoVehiculo);

  return {
    kmRecorridos,
    costoPorKm,
    rendimientoKmL,
    costoPorLitro,
    anomalia: anomaliaCheck.esAnomalo,
    motivoAnomalia: anomaliaCheck.motivo,
  };
}

/**
 * Suite de Pruebas Unitarias para ejecución en tiempo real y verificación de backend
 */
export interface TestResult {
  nombre: string;
  modulo: string;
  paso: boolean;
  esperado: any;
  obtenido: any;
  error?: string;
  duracionMs: number;
}

export function ejecutarPruebasCalculos(): { total: number; pasados: number; fallidos: number; resultados: TestResult[] } {
  const resultados: TestResult[] = [];

  function test(nombre: string, fn: () => { esperado: any; obtenido: any; paso?: boolean }) {
    const start = performance.now();
    try {
      const { esperado, obtenido, paso } = fn();
      const isPass = paso !== undefined ? paso : JSON.stringify(esperado) === JSON.stringify(obtenido);
      resultados.push({
        nombre,
        modulo: 'calculos.ts',
        paso: isPass,
        esperado,
        obtenido,
        duracionMs: Number((performance.now() - start).toFixed(2)),
      });
    } catch (err: any) {
      resultados.push({
        nombre,
        modulo: 'calculos.ts',
        paso: false,
        esperado: 'Ejecución exitosa',
        obtenido: 'Excepción lanzada',
        error: err.message,
        duracionMs: Number((performance.now() - start).toFixed(2)),
      });
    }
  }

  // 1. Prueba km_recorridos
  test('calcularKmRecorridos con valores normales (105,450 km a 105,950 km = 500 km)', () => {
    const obtenido = calcularKmRecorridos(105950, 105450);
    return { esperado: 500, obtenido };
  });

  // 2. Prueba excepción odómetro decreciente
  test('calcularKmRecorridos debe lanzar error si odómetro actual < anterior', () => {
    try {
      calcularKmRecorridos(100000, 105000);
      return { esperado: 'Error arrojado', obtenido: 'Sin error', paso: false };
    } catch (e: any) {
      return { esperado: 'Error arrojado', obtenido: e.message, paso: true };
    }
  });

  // 3. Prueba costo_km
  test('calcularCostoPorKm con ₡36.000 CRC y 500 km = ₡72.00 / km', () => {
    const obtenido = calcularCostoPorKm(36000, 500);
    return { esperado: 72.00, obtenido };
  });

  // 4. Prueba rendimiento (km/L)
  test('calcularRendimiento con 500 km y 50 litros = 10.00 km/L', () => {
    const obtenido = calcularRendimiento(500, 50);
    return { esperado: 10.00, obtenido };
  });

  // 5. Prueba costo_litro
  test('calcularCostoPorLitro con ₡36.000 CRC y 50 litros = ₡720.00 / L', () => {
    const obtenido = calcularCostoPorLitro(36000, 50);
    return { esperado: 720.00, obtenido };
  });

  // 6. Prueba detección de anomalía (bajo rendimiento -40%)
  test('detectarAnomaliaRendimiento detecta bajo consumo crítico (6 km/L vs 12 km/L teórico)', () => {
    const { esAnomalo } = detectarAnomaliaRendimiento(6, 12);
    return { esperado: true, obtenido: esAnomalo };
  });

  // 7. Prueba detección de anomalía normal dentro del margen
  test('detectarAnomaliaRendimiento valida consumo normal (11.5 km/L vs 12 km/L teórico)', () => {
    const { esAnomalo } = detectarAnomaliaRendimiento(11.5, 12);
    return { esperado: false, obtenido: esAnomalo };
  });

  // 8. Procesamiento integral de carga
  test('procesarMetricasCarga ejecuta el flujo completo de métricas correctamente', () => {
    const resultado = procesarMetricasCarga(55600, 55000, 48, 34560, 12.5);
    return {
      esperado: {
        kmRecorridos: 600,
        costoPorKm: 57.6,
        rendimientoKmL: 12.5,
        costoPorLitro: 720,
        anomalia: false,
      },
      obtenido: {
        kmRecorridos: resultado.kmRecorridos,
        costoPorKm: resultado.costoPorKm,
        rendimientoKmL: resultado.rendimientoKmL,
        costoPorLitro: resultado.costoPorLitro,
        anomalia: resultado.anomalia,
      },
    };
  });

  const pasados = resultados.filter((r) => r.paso).length;
  const fallidos = resultados.length - pasados;

  return {
    total: resultados.length,
    pasados,
    fallidos,
    resultados,
  };
}
