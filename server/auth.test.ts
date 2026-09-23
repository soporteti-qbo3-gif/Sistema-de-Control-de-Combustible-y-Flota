import { describe, it, expect } from 'vitest';
import { db } from './db';
import bcrypt from 'bcryptjs';

describe('Sistema de Autenticación y Seguridad', () => {
  it('crearAdmin genera contraseña temporal aleatoria segura si no se proporciona', async () => {
    const admin = await db.crearAdmin({
      nombre: 'Admin Test Unitario',
      email: `admin.test.${Date.now()}@flota.com`,
    });

    expect(admin.debeCambiarPassword).toBe(true);
    expect(admin.tempPassword).toBeDefined();
    expect(typeof admin.tempPassword).toBe('string');
    expect(admin.tempPassword!.length).toBeGreaterThanOrEqual(10);
    expect(admin.tempPasswordExpiracion).toBeDefined();

    // Debe validar con la contraseña temporal generada
    const esValida = await db.validarPassword(admin, admin.tempPassword!);
    expect(esValida).toBe(true);

    // Contraseña errónea debe ser rechazada
    const esInvalida = await db.validarPassword(admin, 'PasswordIncorrecta123');
    expect(esInvalida).toBe(false);
  });

  it('crearConductor genera contraseña temporal aleatoria segura si no se proporciona', async () => {
    const conductor = await db.crearConductor({
      nombre: 'Conductor Test Unitario',
      email: `conductor.test.${Date.now()}@flota.com`,
    });

    expect(conductor.debeCambiarPassword).toBe(true);
    expect(conductor.tempPassword).toBeDefined();
    expect(typeof conductor.tempPassword).toBe('string');
    expect(conductor.tempPassword!.length).toBeGreaterThanOrEqual(10);
    expect(conductor.tempPasswordExpiracion).toBeDefined();

    // Debe validar con la contraseña temporal
    const esValida = await db.validarPassword(conductor, conductor.tempPassword!);
    expect(esValida).toBe(true);
  });

  it('cambiarPasswordUsuario actualiza contraseña, limpia temporal y desbloquea debeCambiarPassword', async () => {
    const usuario = await db.crearConductor({
      nombre: 'Conductor Cambio Clave',
      email: `conductor.cambio.${Date.now()}@flota.com`,
    });

    const tempPass = usuario.tempPassword!;

    // Requerir mínimo 6 caracteres
    await expect(
      db.cambiarPasswordUsuario({
        usuarioId: usuario.id,
        passwordAnterior: tempPass,
        passwordNuevo: '123',
      })
    ).rejects.toThrow('al menos 6 caracteres');

    // Clave anterior incorrecta debe fallar
    await expect(
      db.cambiarPasswordUsuario({
        usuarioId: usuario.id,
        passwordAnterior: 'ClaveEquivocada',
        passwordNuevo: 'NuevaClaveSegura2026',
      })
    ).rejects.toThrow('incorrecta');

    // Cambio exitoso
    const res = await db.cambiarPasswordUsuario({
      usuarioId: usuario.id,
      passwordAnterior: tempPass,
      passwordNuevo: 'NuevaClaveSegura2026',
    });

    expect(res.exito).toBe(true);
    expect(usuario.debeCambiarPassword).toBe(false);
    expect(usuario.tempPassword).toBeUndefined();
    expect(usuario.passwordHash).toBeDefined();

    // Verificar que la nueva clave funciona con bcrypt.compare
    const nuevaCoincide = await bcrypt.compare('NuevaClaveSegura2026', usuario.passwordHash!);
    expect(nuevaCoincide).toBe(true);

    // Validar login con nueva clave
    const loginOk = await db.validarPassword(usuario, 'NuevaClaveSegura2026');
    expect(loginOk).toBe(true);

    // La clave temporal vieja ya no debe funcionar
    const loginViejo = await db.validarPassword(usuario, tempPass);
    expect(loginViejo).toBe(false);
  });
});
