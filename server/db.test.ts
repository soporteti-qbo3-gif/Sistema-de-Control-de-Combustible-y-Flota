import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { SolicitudAutorizacion, Vehiculo, SaldoEstacion } from './types';

describe('Protección Atómica contra Race Conditions y Duplicación de Saldos', () => {
  const adminId = 'usr-admin-test';
  const conductorId = 'usr-cond-test';

  beforeEach(() => {
    // Limpieza de registros generados durante tests para garantizar idempotencia
    db.cargas = db.cargas.filter((c) => !c.vehiculoId.startsWith('veh-test-unit'));
    db.solicitudes = db.solicitudes.filter(
      (s) =>
        !s.id.startsWith('sol-test') &&
        !s.id.startsWith('sol-insuf') &&
        !s.id.startsWith('sol-race')
    );
    db.lecturasOdometro = db.lecturasOdometro.filter(
      (l) => !l.vehiculoId.startsWith('veh-test-unit')
    );

    // Asegurar estación con saldo base conocido para pruebas controladas
    let saldoTest = db.saldos.find((s) => s.id === 'saldo-test-estacion');
    if (!saldoTest) {
      saldoTest = {
        id: 'saldo-test-estacion',
        estacionId: 'est-test-1',
        estacionNombre: 'Delta San Pedro Test',
        tipoCombustible: 'Gasolina Regular',
        saldoActual: 100000,
        umbralAlerta: 20000,
        moneda: 'CRC',
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saldos.push(saldoTest);
    } else {
      saldoTest.saldoActual = 100000;
    }

    // Asegurar vehículo de prueba con odómetro base controlado
    let vehiculoTest = db.vehiculos.find((v) => v.id === 'veh-test-unit');
    if (!vehiculoTest) {
      vehiculoTest = {
        id: 'veh-test-unit',
        placa: 'CR-TEST-99',
        marca: 'Toyota',
        modelo: 'Hilux Test',
        anio: 2024,
        tipoVehiculo: 'Liviano',
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 80,
        odometroInicial: 20000,
        odometroActual: 25000,
        rendimientoTeoricoKmL: 12,
        controlaKilometraje: true,
        estado: 'Activo',
      };
      db.vehiculos.push(vehiculoTest);
    } else {
      vehiculoTest.odometroActual = 25000;
    }
  });

  // Test 1: Intentar autorizar dos veces la misma solicitud → segunda vez falla con 'ESTADO_INVALIDO'
  it('Test 1: Intentar autorizar dos veces la misma solicitud → segunda vez falla con ESTADO_INVALIDO', async () => {
    const solicitudId = `sol-test-1-${Date.now()}`;
    const nuevaSolicitud: SolicitudAutorizacion = {
      id: solicitudId,
      fechaSolicitud: new Date().toISOString(),
      conductorId,
      conductorNombre: 'Conductor Test',
      conductorTelefono: '8888-0001',
      vehiculoId: 'veh-test-unit',
      vehiculoPlaca: 'CR-TEST-99',
      odometroReportado: 25000,
      litrosSolicitados: 40,
      estacionSugerida: 'saldo-test-estacion',
      motivo: 'Ruta hacia Guanacaste',
      estado: 'PENDIENTE',
      montoMaximoEstimado: 28000,
    };
    db.solicitudes.push(nuevaSolicitud);

    // Primera autorización debe ser exitosa
    const resultado1 = await db.autorizarSolicitudAtomic(solicitudId, adminId, 28000, 'saldo-test-estacion');
    expect(resultado1).toBeDefined();
    expect(resultado1.solicitud.estado).toBe('AUTORIZADA');
    expect(resultado1.saldo.saldoActual).toBe(72000); // 100000 - 28000

    // Segunda autorización de la misma solicitud DEBE fallar con 'ESTADO_INVALIDO'
    let errorCapturado: any;
    try {
      await db.autorizarSolicitudAtomic(solicitudId, adminId, 28000, 'saldo-test-estacion');
    } catch (err: any) {
      errorCapturado = err;
    }

    expect(errorCapturado).toBeDefined();
    expect(errorCapturado.code).toBe('ESTADO_INVALIDO');
    // Verificar que el saldo NO se descontó dos veces
    const saldoFinal = db.saldos.find((s) => s.id === 'saldo-test-estacion');
    expect(saldoFinal?.saldoActual).toBe(72000);
  });

  // Test 2: Intentar registrar dos cargas idénticas (mismo vehículo, fecha, odómetro) → segunda falla con 'CARGA_DUPLICADA'
  it('Test 2: Intentar registrar dos cargas idénticas (mismo vehículo, fecha, odómetro) → segunda falla con CARGA_DUPLICADA', async () => {
    const vehiculoIdTest2 = `veh-test-unit-2-${Date.now()}`;
    const vehiculo: Vehiculo = {
      id: vehiculoIdTest2,
      placa: `CR-T2-${Date.now().toString().slice(-4)}`,
      marca: 'Nissan',
      modelo: 'Frontier Test',
      anio: 2024,
      tipoVehiculo: 'Liviano',
      tipoCombustible: 'Diesel',
      capacidadTanqueLitros: 80,
      odometroInicial: 20000,
      odometroActual: 30000,
      rendimientoTeoricoKmL: 12,
      controlaKilometraje: true,
      estado: 'Activo',
    };
    db.vehiculos.push(vehiculo);

    const fechaCarga = new Date().toISOString();
    const paramsCarga = {
      vehiculoId: vehiculo.id,
      estacionId: 'saldo-test-estacion',
      monto: 20000,
      galones: 7.5,
      litros: 28.5,
      odometroInicio: 30000,
      odometroFinal: 30400,
      conductorId,
      fecha: fechaCarga,
    };

    // Primera carga se registra correctamente
    const resultado1 = await db.registrarCargaAtomic(paramsCarga);
    expect(resultado1).toBeDefined();
    expect(resultado1.carga).toBeDefined();
    expect(vehiculo.odometroActual).toBe(30400);

    // Segunda carga con el mismo vehículo, fecha y odómetro de inicio DEBE fallar con 'CARGA_DUPLICADA'
    let errorCapturado: any;
    try {
      await db.registrarCargaAtomic(paramsCarga);
    } catch (err: any) {
      errorCapturado = err;
    }

    expect(errorCapturado).toBeDefined();
    expect(errorCapturado.code).toBe('CARGA_DUPLICADA');
  });

  // Test 3: Autorizar con saldo insuficiente → falla con 'SALDO_INSUFICIENTE' y no descuenta nada
  it('Test 3: Autorizar con saldo insuficiente → falla con SALDO_INSUFICIENTE y no descuenta nada', async () => {
    const saldoEstacion = db.saldos.find((s) => s.id === 'saldo-test-estacion')!;
    saldoEstacion.saldoActual = 15000; // Solo ₡15.000 disponibles

    const solicitudId = `sol-insuf-${Date.now()}`;
    const nuevaSolicitud: SolicitudAutorizacion = {
      id: solicitudId,
      fechaSolicitud: new Date().toISOString(),
      conductorId,
      conductorNombre: 'Conductor Test',
      conductorTelefono: '8888-0002',
      vehiculoId: 'veh-test-unit',
      vehiculoPlaca: 'CR-TEST-99',
      odometroReportado: 25000,
      litrosSolicitados: 50,
      estacionSugerida: 'saldo-test-estacion',
      motivo: 'Gira Limón',
      estado: 'PENDIENTE',
      montoMaximoEstimado: 35000, // Requiere ₡35.000 > ₡15.000
    };
    db.solicitudes.push(nuevaSolicitud);

    let errorCapturado: any;
    try {
      await db.autorizarSolicitudAtomic(solicitudId, adminId, 35000, 'saldo-test-estacion');
    } catch (err: any) {
      errorCapturado = err;
    }

    expect(errorCapturado).toBeDefined();
    expect(errorCapturado.code).toBe('SALDO_INSUFICIENTE');

    // Comprobar que NO se descontó absolutamente nada (Atómico)
    expect(saldoEstacion.saldoActual).toBe(15000);
    // Comprobar que la solicitud permanece PENDIENTE
    const solVerificar = db.solicitudes.find((s) => s.id === solicitudId);
    expect(solVerificar?.estado).toBe('PENDIENTE');
  });

  // Test 4: Registrar carga con odómetro menor al último → falla con 'ODOMETRO_INVALIDO'
  it('Test 4: Registrar carga con odómetro menor al último → falla con ODOMETRO_INVALIDO', async () => {
    const vehiculo = db.vehiculos.find((v) => v.id === 'veh-test-unit')!;
    vehiculo.odometroActual = 50000;

    // Caso A: odómetro final menor o igual al inicial
    let errorA: any;
    try {
      await db.registrarCargaAtomic({
        vehiculoId: vehiculo.id,
        estacionId: 'saldo-test-estacion',
        monto: 15000,
        galones: 5,
        odometroInicio: 50000,
        odometroFinal: 49000, // Menor que inicio!
        conductorId,
      });
    } catch (err: any) {
      errorA = err;
    }

    expect(errorA).toBeDefined();
    expect(errorA.code).toBe('ODOMETRO_INVALIDO');

    // Caso B: odómetro inicial menor que la última lectura registrada del vehículo (50000)
    let errorB: any;
    try {
      await db.registrarCargaAtomic({
        vehiculoId: vehiculo.id,
        estacionId: 'saldo-test-estacion',
        monto: 15000,
        galones: 5,
        odometroInicio: 42000, // Menor a 50000 actual
        odometroFinal: 43000,
        conductorId,
      });
    } catch (err: any) {
      errorB = err;
    }

    expect(errorB).toBeDefined();
    expect(errorB.code).toBe('ODOMETRO_INVALIDO');
    // Odómetro del vehículo no debe haber mutado
    expect(vehiculo.odometroActual).toBe(50000);
  });

  // Test 5: Simular race condition (dos peticiones simultáneas) → solo una se ejecuta, la otra falla
  it('Test 5: Simular race condition (dos peticiones simultáneas) → solo una se ejecuta, la otra falla', async () => {
    const saldoEstacion = db.saldos.find((s) => s.id === 'saldo-test-estacion')!;
    saldoEstacion.saldoActual = 100000;

    const solicitudId = `sol-race-${Date.now()}`;
    const nuevaSolicitud: SolicitudAutorizacion = {
      id: solicitudId,
      fechaSolicitud: new Date().toISOString(),
      conductorId,
      conductorNombre: 'Conductor Concurrente',
      conductorTelefono: '8888-0005',
      vehiculoId: 'veh-test-unit',
      vehiculoPlaca: 'CR-TEST-99',
      odometroReportado: 25000,
      litrosSolicitados: 30,
      estacionSugerida: 'saldo-test-estacion',
      motivo: 'Entrega simultánea',
      estado: 'PENDIENTE',
      montoMaximoEstimado: 21000,
    };
    db.solicitudes.push(nuevaSolicitud);

    // Lanzar dos peticiones concurrentes idénticas sin esperar que una termine antes de llamar a la otra
    const [res1, res2] = await Promise.allSettled([
      db.autorizarSolicitudAtomic(solicitudId, 'admin-A', 21000, 'saldo-test-estacion'),
      db.autorizarSolicitudAtomic(solicitudId, 'admin-B', 21000, 'saldo-test-estacion'),
    ]);

    const exitos = [res1, res2].filter((r) => r.status === 'fulfilled');
    const fallos = [res1, res2].filter((r) => r.status === 'rejected');

    // EXACTAMENTE UNA debe tener éxito y EXACTAMENTE UNA debe fallar
    expect(exitos.length).toBe(1);
    expect(fallos.length).toBe(1);

    // El error de la que falló debe ser ESTADO_INVALIDO
    const errorRechazo = (fallos[0] as PromiseRejectedResult).reason;
    expect(errorRechazo.code).toBe('ESTADO_INVALIDO');

    // El saldo se descontó EXACTAMENTE UNA SOLA VEZ (100000 - 21000 = 79000, NUNCA 58000)
    expect(saldoEstacion.saldoActual).toBe(79000);
  });
});
