/**
 * Módulo de Cálculos Matemáticos y Métricas de Rendimiento de Flota
 * Cumple con los Criterios de Aceptación del Sistema
 */

import { db } from './db';
import { LecturaOdometro, CargaCombustible, BombaGasolina } from './types';

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

export interface ResultadoAuditoriaFraude {
  vehiculoId: string;
  placa: string;
  periodo: {
    desde: string;
    hasta: string;
  };
  lecturasOdometro: LecturaOdometro[];
  cargasCombustible: CargaCombustible[];
  calculos: {
    odometroInicial: number;
    odometroFinal: number;
    distanciaTotalKm: number;
    litrosCargados: number;
    litrosEsperados: number;
    excesoLitros: number;
    porcentajeDesviacion: number;
    rendimientoTeoricoKmL: number;
    rendimientoRealKmL: number;
    costoTotalCRC: number;
    costoFraudeEstimadoCRC: number;
  };
  nivelAlerta: 'VERDE' | 'AMARILLO' | 'ROJO';
  mensaje: string;
  recomendacion: string;
}

/**
 * 🕵️‍♂️ DETECCIÓN DE FRAUDE DE COMBUSTIBLE POR PERÍODO
 * Compara la distancia recorrida mediante odómetro con los litros reales abastecidos
 * para detectar posibles extracciones/robo de combustible del tanque.
 */
export function detectarFraudePorPeriodo(
  vehiculoId: string,
  fechaDesde?: string,
  fechaHasta?: string,
  dbInstance = db
): ResultadoAuditoriaFraude {
  const vehiculo = dbInstance.vehiculos.find(
    (v) => v.id === vehiculoId || v.placa.toLowerCase() === vehiculoId.toLowerCase()
  );

  if (!vehiculo) {
    const err: any = new Error(`Vehículo con identificador o placa "${vehiculoId}" no encontrado.`);
    err.status = 404;
    throw err;
  }

  // Filtrar lecturas de odómetro correspondientes al vehículo
  let lecturas = dbInstance.lecturasOdometro.filter((l) => l.vehiculoId === vehiculo.id);

  if (fechaDesde) {
    const fDesde = new Date(fechaDesde.includes('T') ? fechaDesde : `${fechaDesde}T00:00:00.000Z`).getTime();
    lecturas = lecturas.filter((l) => new Date(l.fecha).getTime() >= fDesde);
  }

  if (fechaHasta) {
    const fHasta = new Date(fechaHasta.includes('T') ? fechaHasta : `${fechaHasta}T23:59:59.999Z`).getTime();
    lecturas = lecturas.filter((l) => new Date(l.fecha).getTime() <= fHasta);
  }

  // Ordenar lecturas cronológicamente
  lecturas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.km - b.km);

  // Validación obligatoria: se requieren al menos 2 lecturas de odómetro en el período
  if (lecturas.length < 2) {
    const err: any = new Error(
      `Se requieren al menos 2 lecturas de odómetro en el período seleccionado para calcular la distancia recorrida (se encontraron ${lecturas.length}).`
    );
    err.status = 400;
    err.code = 'INSUFICIENTES_LECTURAS_ODOMETRO';
    throw err;
  }

  const primeraLectura = lecturas[0];
  const ultimaLectura = lecturas[lecturas.length - 1];
  const distanciaTotalKm = Math.max(0, ultimaLectura.km - primeraLectura.km);

  // Filtrar cargas de combustible en el período
  let cargas = dbInstance.cargas.filter(
    (c) => c.vehiculoId === vehiculo.id || c.vehiculoPlaca.toLowerCase() === vehiculo.placa.toLowerCase()
  );

  if (fechaDesde) {
    const fDesde = new Date(fechaDesde.includes('T') ? fechaDesde : `${fechaDesde}T00:00:00.000Z`).getTime();
    cargas = cargas.filter((c) => new Date(c.fecha).getTime() >= fDesde);
  }

  if (fechaHasta) {
    const fHasta = new Date(fechaHasta.includes('T') ? fechaHasta : `${fechaHasta}T23:59:59.999Z`).getTime();
    cargas = cargas.filter((c) => new Date(c.fecha).getTime() <= fHasta);
  }

  cargas.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  // 1. Suma total de litros cargados en el período
  const litrosCargados = cargas.reduce((acc, c) => acc + (Number(c.litros) || 0), 0);
  const costoTotalCRC = cargas.reduce((acc, c) => acc + (Number(c.totalPagado) || 0), 0);

  // 2. Litros esperados = distancia / rendimientoTeoricoKmL del vehículo
  const rendimientoTeorico = Number(vehiculo.rendimientoTeoricoKmL) > 0 ? Number(vehiculo.rendimientoTeoricoKmL) : 10;
  const litrosEsperados = distanciaTotalKm / rendimientoTeorico;

  // 3. Exceso de litros = litros cargados - litros esperados
  const excesoLitros = litrosCargados - litrosEsperados;

  // 4. Porcentaje de desviación = (exceso / litros esperados) * 100
  let porcentajeDesviacion = 0;
  if (litrosEsperados > 0) {
    porcentajeDesviacion = (excesoLitros / litrosEsperados) * 100;
  } else if (litrosCargados > 0) {
    porcentajeDesviacion = 100;
  }

  // 5. Nivel de alerta: VERDE (≤20%), AMARILLO (20-40%), ROJO (>40%)
  let nivelAlerta: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
  let mensaje = '';
  let recomendacion = '';

  if (porcentajeDesviacion > 40) {
    nivelAlerta = 'ROJO';
    mensaje = `ALERTA CRÍTICA: Desviación del ${porcentajeDesviacion.toFixed(1)}% (+${excesoLitros.toFixed(1)} L en exceso). Alta probabilidad de extracción no autorizada o robo de combustible.`;
    recomendacion = 'Bloquear autorizaciones de carga adicionales para este vehículo, auditar tickets y realizar prueba física de volumetría de tanque.';
  } else if (porcentajeDesviacion > 20) {
    nivelAlerta = 'AMARILLO';
    mensaje = `ALERTA MODERADA: Desviación del ${porcentajeDesviacion.toFixed(1)}% (+${excesoLitros.toFixed(1)} L respecto a lo esperado). Consumo anormal superior a tolerancia.`;
    recomendacion = 'Revisar rutas transitadas, carga excesiva, ralentí prolongado o descalibración mecánica.';
  } else {
    nivelAlerta = 'VERDE';
    mensaje = `CONSUMO NORMAL: Variación de ${porcentajeDesviacion.toFixed(1)}% dentro del margen de operación regular (≤20%).`;
    recomendacion = 'Mantener monitoreo regular y seguimiento de odómetro en cada despacho.';
  }

  const rendimientoRealKmL = litrosCargados > 0 ? Number((distanciaTotalKm / litrosCargados).toFixed(2)) : 0;
  const precioPromedioLitro = litrosCargados > 0 ? costoTotalCRC / litrosCargados : 710;
  const costoFraudeEstimadoCRC = Number((Math.max(0, excesoLitros) * precioPromedioLitro).toFixed(2));

  return {
    vehiculoId: vehiculo.id,
    placa: vehiculo.placa,
    periodo: {
      desde: fechaDesde || (primeraLectura.fecha ? primeraLectura.fecha.split('T')[0] : 'Histórico'),
      hasta: fechaHasta || (ultimaLectura.fecha ? ultimaLectura.fecha.split('T')[0] : 'Actual'),
    },
    lecturasOdometro: lecturas,
    cargasCombustible: cargas,
    calculos: {
      odometroInicial: primeraLectura.km,
      odometroFinal: ultimaLectura.km,
      distanciaTotalKm: Number(distanciaTotalKm.toFixed(2)),
      litrosCargados: Number(litrosCargados.toFixed(2)),
      litrosEsperados: Number(litrosEsperados.toFixed(2)),
      excesoLitros: Number(excesoLitros.toFixed(2)),
      porcentajeDesviacion: Number(porcentajeDesviacion.toFixed(2)),
      rendimientoTeoricoKmL: rendimientoTeorico,
      rendimientoRealKmL,
      costoTotalCRC: Number(costoTotalCRC.toFixed(2)),
      costoFraudeEstimadoCRC,
    },
    nivelAlerta,
    mensaje,
    recomendacion,
  };
}

export interface ProyeccionSaldoBomba {
  bombaId: string;
  nombre: string;
  mesActual: string;
  depositoMensual: number;
  consumido: number;
  saldoRestante: number;
  porcentajeConsumido: number;
  numeroCargas: number;
  proyeccionAgotamiento: {
    diasRestantes: number;
    fechaEstimada: string;
    consumoDiarioPromedio: number;
  };
  alerta: 'VERDE' | 'AMARILLO' | 'ROJO';
  mensaje: string;
}

/**
 * ⛽ PROYECCIÓN FINANCIERA Y AGOTAMIENTO DE SALDO EN BOMBAS PREPAGO
 * Proyecta la fecha estimada de agotamiento y consumo diario promedio en base
 * al depósito mensual y las cargas registradas en el mes corriente.
 */
export function proyectarSaldoBomba(bombaId: string, dbInstance = db): ProyeccionSaldoBomba {
  // Buscar bomba en db.bombas o mapear desde saldos
  let bomba = dbInstance.bombas.find(
    (b) =>
      b.id === bombaId ||
      b.id === `bomba-${bombaId}` ||
      b.estacionId === bombaId ||
      b.nombre.toLowerCase().includes(bombaId.toLowerCase())
  );

  if (!bomba) {
    const saldo = dbInstance.saldos.find(
      (s) =>
        s.id === bombaId ||
        s.estacionId === bombaId ||
        s.estacionNombre.toLowerCase().includes(bombaId.toLowerCase())
    );

    if (saldo) {
      bomba = {
        id: saldo.id,
        nombre: saldo.estacionNombre,
        estacionId: saldo.estacionId,
        ubicacion: 'Costa Rica',
        depositoMensual: 800000.0,
        saldoActual: saldo.saldoActual,
        moneda: saldo.moneda || 'CRC',
        activo: saldo.activo,
      };
    }
  }

  if (!bomba) {
    const err: any = new Error(`Bomba de combustible prepago con identificador "${bombaId}" no encontrada.`);
    err.status = 404;
    throw err;
  }

  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mesNumero = ahora.getMonth() + 1;
  const mesPad = String(mesNumero).padStart(2, '0');
  const prefijoMesIso = `${anio}-${mesPad}`;

  const mesesEspanol = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const mesActual = `${mesesEspanol[ahora.getMonth()]} ${anio}`;

  // 1. Filtrar cargas asociadas a esta bomba durante el mes en curso
  const cargasMes = dbInstance.cargas.filter((c) => {
    const fechaCarga = new Date(c.fecha);
    const esMesActual =
      c.fecha.startsWith(prefijoMesIso) ||
      (fechaCarga.getFullYear() === anio && fechaCarga.getMonth() + 1 === mesNumero);

    if (!esMesActual) return false;

    const matchId = c.saldoPrepagoId === bomba.id || c.saldoPrepagoId === bomba.estacionId;
    const matchNombre =
      c.estacion &&
      (c.estacion.toLowerCase().includes(bomba.nombre.toLowerCase()) ||
        bomba.nombre.toLowerCase().includes(c.estacion.toLowerCase()));

    return matchId || matchNombre;
  });

  // 2. Depósito mensual y total consumido
  const depositoMensual = Number(bomba.depositoMensual || 800000);
  const consumido = cargasMes.reduce((acc, c) => acc + (Number(c.totalPagado) || 0), 0);

  // 3. Saldo restante = depósito - consumido
  const saldoRestante = Math.max(0, depositoMensual - consumido);

  // 4. Porcentaje consumido y porcentaje restante
  const porcentajeConsumido = depositoMensual > 0 ? Number(((consumido / depositoMensual) * 100).toFixed(2)) : 0;
  const porcentajeRestante = depositoMensual > 0 ? Number(((saldoRestante / depositoMensual) * 100).toFixed(2)) : 0;
  const numeroCargas = cargasMes.length;

  // 5. Consumo diario promedio = consumido / días transcurridos del mes
  const diasTranscurridos = Math.max(1, ahora.getDate());
  const consumoDiarioPromedio = Number((consumido / diasTranscurridos).toFixed(2));

  // 6. Días restantes hasta agotamiento = saldo / consumo diario promedio
  let diasRestantes = 0;
  let fechaEstimada = '';

  if (saldoRestante <= 0) {
    diasRestantes = 0;
    fechaEstimada = 'AGOTADO';
  } else if (consumoDiarioPromedio > 0) {
    diasRestantes = Math.max(0, Math.round(saldoRestante / consumoDiarioPromedio));
    const fechaAgotamiento = new Date(ahora.getTime() + diasRestantes * 24 * 60 * 60 * 1000);
    fechaEstimada = fechaAgotamiento.toISOString().split('T')[0];
  } else {
    // Si no ha habido consumos aún en el mes actual
    const diasEnMes = new Date(anio, mesNumero, 0).getDate();
    diasRestantes = Math.max(1, diasEnMes - diasTranscurridos);
    fechaEstimada = 'Saldo suficiente para el mes en curso';
  }

  // 7. Nivel de alerta: VERDE (saldo > 50%), AMARILLO (20-50%), ROJO (<20%)
  let alerta: 'VERDE' | 'AMARILLO' | 'ROJO' = 'VERDE';
  let mensaje = '';

  if (porcentajeRestante > 50) {
    alerta = 'VERDE';
    mensaje = `Saldo óptimo en bomba prepago (${porcentajeRestante}% restante). Flujo presupuestario saludable.`;
  } else if (porcentajeRestante >= 20) {
    alerta = 'AMARILLO';
    mensaje = `Saldo moderado (${porcentajeRestante}% restante). Consumo promedio de ₡${Math.round(
      consumoDiarioPromedio
    ).toLocaleString('es-CR')}/día. Se proyecta agotamiento el ${fechaEstimada}.`;
  } else {
    alerta = 'ROJO';
    mensaje = `Alerta crítica de saldo bajo (${porcentajeRestante}% restante). Riesgo inminente de agotamiento de fondo prepago.`;
  }

  return {
    bombaId: bomba.id,
    nombre: bomba.nombre,
    mesActual,
    depositoMensual,
    consumido: Number(consumido.toFixed(2)),
    saldoRestante: Number(saldoRestante.toFixed(2)),
    porcentajeConsumido,
    numeroCargas,
    proyeccionAgotamiento: {
      diasRestantes,
      fechaEstimada,
      consumoDiarioPromedio,
    },
    alerta,
    mensaje,
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

  // 9. Detección de fraude por período (Cálculo matemático)
  test('detectarFraudePorPeriodo calcula distancias y porcentajes de desviación', () => {
    const mockDb: any = {
      vehiculos: [
        { id: 'veh-test', placa: 'TEST-123', rendimientoTeoricoKmL: 10 }
      ],
      lecturasOdometro: [
        { id: 'l1', vehiculoId: 'veh-test', km: 10000, fecha: '2026-08-01T00:00:00.000Z' },
        { id: 'l2', vehiculoId: 'veh-test', km: 11000, fecha: '2026-08-30T00:00:00.000Z' }
      ],
      cargas: [
        // 1000 km recorridos, 10 km/L teórico -> 100 L esperados.
        // Se cargan 150 L -> exceso 50 L -> +50% desviación -> ROJO
        { id: 'c1', vehiculoId: 'veh-test', vehiculoPlaca: 'TEST-123', litros: 150, totalPagado: 106500, fecha: '2026-08-15T00:00:00.000Z' }
      ]
    };

    const res = detectarFraudePorPeriodo('veh-test', '2026-08-01', '2026-08-30', mockDb);
    return {
      esperado: {
        distancia: 1000,
        litrosEsperados: 100,
        litrosCargados: 150,
        excesoLitros: 50,
        porcentajeDesviacion: 50,
        alerta: 'ROJO'
      },
      obtenido: {
        distancia: res.calculos.distanciaTotalKm,
        litrosEsperados: res.calculos.litrosEsperados,
        litrosCargados: res.calculos.litrosCargados,
        excesoLitros: res.calculos.excesoLitros,
        porcentajeDesviacion: res.calculos.porcentajeDesviacion,
        alerta: res.nivelAlerta
      }
    };
  });

  // 10. Proyección financiera de saldo en bomba
  test('proyectarSaldoBomba calcula saldo restante y alertas presupuestarias', () => {
    const mockDb: any = {
      bombas: [
        { id: 'bomba-test', nombre: 'Bomba Prueba', estacionId: 'est-test', depositoMensual: 800000, saldoActual: 800000, moneda: 'CRC', activo: true }
      ],
      saldos: [],
      cargas: []
    };

    const res = proyectarSaldoBomba('bomba-test', mockDb);
    return {
      esperado: {
        depositoMensual: 800000,
        consumido: 0,
        saldoRestante: 800000,
        alerta: 'VERDE'
      },
      obtenido: {
        depositoMensual: res.depositoMensual,
        consumido: res.consumido,
        saldoRestante: res.saldoRestante,
        alerta: res.alerta
      }
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
