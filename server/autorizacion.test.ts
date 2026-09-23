import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import type { Server } from 'http';
import { apiRouter } from './routes';
import { generarToken } from './auth';
import { db } from './db';
import { Usuario, Vehiculo, SolicitudAutorizacion } from './types';

describe('Seguridad y Autorización de Endpoints', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  const conductorPrueba: Usuario = {
    id: 'usr-cond-test-sec',
    nombre: 'Conductor Prueba Seguridad',
    email: 'conductor.seguridad@flota.com',
    rol: 'CONDUCTOR',
    telefonoContacto: '+506 7000-0001',
    activo: true,
  };

  const conductorOtro: Usuario = {
    id: 'usr-cond-otro-sec',
    nombre: 'Conductor Otro',
    email: 'conductor.otro@flota.com',
    rol: 'CONDUCTOR',
    telefonoContacto: '+506 7000-0002',
    activo: true,
  };

  const vehiculoPropio: Vehiculo = {
    id: 'veh-test-propio',
    placa: 'TEST-001',
    marca: 'Toyota',
    modelo: 'Hilux',
    anio: 2023,
    tipoVehiculo: 'Pick-up',
    tipoCombustible: 'Diesel',
    capacidadTanqueLitros: 80,
    odometroInicial: 10000,
    odometroActual: 15000,
    rendimientoTeoricoKmL: 10,
    controlaKilometraje: true,
    conductorId: conductorPrueba.id,
    conductorNombre: conductorPrueba.nombre,
    estado: 'Activo',
  };

  const vehiculoAjeno: Vehiculo = {
    id: 'veh-test-ajeno',
    placa: 'TEST-002',
    marca: 'Isuzu',
    modelo: 'D-Max',
    anio: 2022,
    tipoVehiculo: 'Pick-up',
    tipoCombustible: 'Diesel',
    capacidadTanqueLitros: 76,
    odometroInicial: 20000,
    odometroActual: 25000,
    rendimientoTeoricoKmL: 9.5,
    controlaKilometraje: true,
    conductorId: conductorOtro.id,
    conductorNombre: conductorOtro.nombre,
    estado: 'Activo',
  };

  let tokenConductor: string;

  beforeAll(async () => {
    // Registrar usuarios y vehículos en db para pruebas
    if (!db.usuarios.find((u) => u.id === conductorPrueba.id)) {
      db.usuarios.push(conductorPrueba);
    }
    if (!db.usuarios.find((u) => u.id === conductorOtro.id)) {
      db.usuarios.push(conductorOtro);
    }
    if (!db.vehiculos.find((v) => v.id === vehiculoPropio.id)) {
      db.vehiculos.push(vehiculoPropio);
    }
    if (!db.vehiculos.find((v) => v.id === vehiculoAjeno.id)) {
      db.vehiculos.push(vehiculoAjeno);
    }

    tokenConductor = generarToken(conductorPrueba);

    app = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : 0;
        baseUrl = `http://127.0.0.1:${port}/api`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Limpieza
    db.usuarios = db.usuarios.filter(
      (u) => u.id !== conductorPrueba.id && u.id !== conductorOtro.id
    );
    db.vehiculos = db.vehiculos.filter(
      (v) => v.id !== vehiculoPropio.id && v.id !== vehiculoAjeno.id
    );
    db.solicitudes = db.solicitudes.filter(
      (s) => s.conductorId !== conductorPrueba.id && s.conductorId !== conductorOtro.id
    );
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('Un CONDUCTOR recibe 403 al hacer POST /cajas-chicas/:id/egreso', async () => {
    const res = await fetch(`${baseUrl}/cajas-chicas/caja-central/egreso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenConductor}`,
      },
      body: JSON.stringify({
        monto: 15000,
        concepto: 'Combustible de emergencia',
      }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/Acceso denegado|Administrador/i);
  });

  it('Un CONDUCTOR recibe 400 con mensaje genérico (que NO contiene el código esperado) al registrar una carga con código incorrecto', async () => {
    const codigoSecreto = 'AUT-77889';
    const solicitud: SolicitudAutorizacion = {
      id: 'SOL-TEST-001',
      fechaSolicitud: new Date().toISOString(),
      conductorId: conductorPrueba.id,
      conductorNombre: conductorPrueba.nombre,
      conductorTelefono: conductorPrueba.telefonoContacto || '',
      vehiculoId: vehiculoPropio.id,
      vehiculoPlaca: vehiculoPropio.placa,
      odometroReportado: 15100,
      litrosSolicitados: 40,
      estacionSugerida: 'Estación Central',
      motivo: 'Prueba',
      estado: 'PENDIENTE',
      codigoAutorizacion: codigoSecreto,
      montoMaximoEstimado: 30000,
    };
    db.solicitudes.unshift(solicitud);

    const res = await fetch(`${baseUrl}/cargas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenConductor}`,
      },
      body: JSON.stringify({
        vehiculoId: vehiculoPropio.id,
        solicitudAutorizacionId: solicitud.id,
        codigoAutorizacion: 'AUT-00000', // Código erróneo
        litros: 40,
        totalPagado: 28000,
        odometroActual: 15100,
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    // Mensaje genérico exigido
    expect(data.error).toBe('El código de autorización ingresado no es válido o no corresponde a una solicitud activa.');
    // 🔒 Verificación crítica de seguridad: NUNCA revelar el código esperado
    expect(data.error).not.toContain(codigoSecreto);
    expect(JSON.stringify(data)).not.toContain(codigoSecreto);
  });

  it('Un CONDUCTOR recibe 403 al registrar lectura de odómetro de un vehículo que no es suyo', async () => {
    const res = await fetch(`${baseUrl}/odometro/lecturas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenConductor}`,
      },
      body: JSON.stringify({
        vehiculoId: vehiculoAjeno.id,
        km: 26000,
        observaciones: 'Intento de registro ajeno',
      }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('No tienes permiso para registrar odómetro de este vehículo.');
  });

  it('Un CONDUCTOR recibe 403 al registrar una carga sobre la solicitud de otro conductor', async () => {
    const solicitudAjena: SolicitudAutorizacion = {
      id: 'SOL-TEST-AJENA',
      fechaSolicitud: new Date().toISOString(),
      conductorId: conductorOtro.id,
      conductorNombre: conductorOtro.nombre,
      conductorTelefono: conductorOtro.telefonoContacto || '',
      vehiculoId: vehiculoAjeno.id,
      vehiculoPlaca: vehiculoAjeno.placa,
      odometroReportado: 25100,
      litrosSolicitados: 30,
      estacionSugerida: 'Estación Norte',
      motivo: 'Ruta Ajena',
      estado: 'PENDIENTE',
      codigoAutorizacion: 'AUT-11223',
      montoMaximoEstimado: 22000,
    };
    db.solicitudes.unshift(solicitudAjena);

    const res = await fetch(`${baseUrl}/cargas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenConductor}`,
      },
      body: JSON.stringify({
        vehiculoId: vehiculoAjeno.id,
        solicitudAutorizacionId: solicitudAjena.id,
        codigoAutorizacion: 'AUT-11223',
        litros: 30,
        totalPagado: 21000,
        odometroActual: 25100,
      }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('No tienes permiso para registrar cargas sobre esta solicitud.');
  });

  it('Un CONDUCTOR recibe 403 al crear una solicitud de carga para un vehículo no asignado', async () => {
    const res = await fetch(`${baseUrl}/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenConductor}`,
      },
      body: JSON.stringify({
        vehiculoId: vehiculoAjeno.id,
        odometroReportado: 25200,
        litrosSolicitados: 35,
      }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('Solo puedes solicitar carga para tu vehículo asignado.');
  });
});
