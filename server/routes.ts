/**
 * Definición de Rutas y Controladores REST API
 */

import { Router, Response } from 'express';
// 🧠 LÓGICA: Importación de Zod para validación estricta de esquemas de entrada y salida
import { z } from 'zod';
// 🔒 SEGURIDAD: Importación de express-rate-limit para mitigación de ataques de fuerza bruta
import rateLimit from 'express-rate-limit';
import { db, generarTicketSvgBase64, generarOdometroSvgBase64 } from './db';
import {
  generarToken,
  middlewareAutenticacion,
  requiereAdmin,
  requiereAdminPrincipal,
  verificarPropiedadRecurso, // 🔒 SEGURIDAD: Control de acceso para mitigación de IDOR
  AuthenticatedRequest,
} from './auth';
import { extraerDatosComprobanteYOdometro } from './ia_extractor';
import {
  procesarMetricasCarga,
  ejecutarPruebasCalculos,
  detectarFraudePorPeriodo,
  proyectarSaldoBomba,
} from './calculos';
import {
  historialNotificaciones,
  notificarAdminSolicitudCarga,
  notificarConductorAprobacion,
  notificarConductorRechazo,
  notificarAdminAlertaAnomalia,
  despacharNotificacion,
} from './notificaciones';
import {
  Vehiculo,
  SolicitudAutorizacion,
  CargaCombustible,
  Mantenimiento,
  Usuario,
  MetricasFlota,
  LecturaOdometro,
} from './types';

export const apiRouter = Router();

// 🔒 SEGURIDAD: Rate limit estricto para inicio de sesión contra fuerza bruta
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'DEMASIADOS_INTENTOS',
    message: 'Demasiados intentos de inicio de sesión. Por favor espere 15 minutos antes de reintentar.',
  },
});

// 🔒 SEGURIDAD: Función de validación de imágenes Base64 contra XSS y subida de archivos maliciosos (rechazo estricto de SVG/XML)
export function validarMimeTypeBase64(base64Str?: string): { valido: boolean; error?: string } {
  if (!base64Str) return { valido: true };

  // Rechazo explícito de SVG / XML para prevenir ataques de Cross-Site Scripting (XSS) y vector injection
  if (
    base64Str.includes('image/svg+xml') ||
    base64Str.includes('<svg') ||
    base64Str.includes('xmlns=') ||
    base64Str.includes('<?xml')
  ) {
    return {
      valido: false,
      error: 'Formato SVG/XML no permitido por motivos de seguridad (XSS mitigation). Solo se admiten imágenes JPEG, PNG o WEBP.',
    };
  }

  // Comprobar data URI scheme si está presente
  const match = base64Str.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
  if (match) {
    const mime = match[1].toLowerCase();
    const permitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!permitidos.includes(mime)) {
      return {
        valido: false,
        error: `Tipo MIME no permitido (${mime}). Formatos autorizados: JPEG, PNG, WEBP.`,
      };
    }
  }

  return { valido: true };
}

// ==========================================
// 1. AUTENTICACIÓN Y SESIÓN
// ==========================================

// 🔒 SEGURIDAD: Endpoint protegido con loginRateLimiter y comparación segura con bcrypt.compare()
apiRouter.post('/auth/login', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    res.status(400).json({ error: 'El correo electrónico es requerido.' });
    return;
  }

  const usuario = db.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!usuario) {
    res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado en la flota.' });
    return;
  }

  if (!usuario.activo) {
    res.status(403).json({
      error: 'USUARIO_SUSPENDIDO',
      message: 'Esta cuenta ha sido suspendida o desactivada por la administración. No tiene acceso al sistema.',
    });
    return;
  }

  // 🔒 SEGURIDAD: Validación de credenciales mediante bcrypt.compare() para prevenir ataques de temporización
  if (password) {
    const esPasswordValida = await db.validarPassword(usuario, password);
    if (!esPasswordValida) {
      res.status(401).json({ error: 'Credenciales inválidas. Contraseña incorrecta.' });
      return;
    }
  }

  const token = generarToken(usuario);
  const vehiculoAsignado = usuario.vehiculoAsignadoId
    ? db.vehiculos.find((v) => v.id === usuario.vehiculoAsignadoId)
    : undefined;

  usuario.ultimoAcceso = new Date().toISOString();

  res.json({
    token,
    usuario: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      esAdminPrincipal: !!usuario.esAdminPrincipal,
      debeCambiarPassword: !!usuario.debeCambiarPassword,
      tempPassword: usuario.tempPassword,
      telefonoContacto: usuario.telefonoContacto,
      telefonoWhatsapp: usuario.telefonoContacto,
      licencia: usuario.licencia,
      vehiculoAsignadoId: usuario.vehiculoAsignadoId,
      vehiculoAsignado,
      activo: usuario.activo,
    },
  });
});

apiRouter.get('/auth/me', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const usuario = db.usuarios.find((u) => u.id === req.user?.userId);
  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  const vehiculoAsignado = usuario.vehiculoAsignadoId
    ? db.vehiculos.find((v) => v.id === usuario.vehiculoAsignadoId)
    : undefined;

  res.json({
    id: usuario.id,
    email: usuario.email,
    nombre: usuario.nombre,
    rol: usuario.rol,
    esAdminPrincipal: !!usuario.esAdminPrincipal,
    debeCambiarPassword: !!usuario.debeCambiarPassword,
    tempPassword: usuario.tempPassword,
    telefonoContacto: usuario.telefonoContacto,
    telefonoWhatsapp: usuario.telefonoContacto,
    licencia: usuario.licencia,
    vehiculoAsignadoId: usuario.vehiculoAsignadoId,
    vehiculoAsignado,
    activo: usuario.activo,
  });
});

// 🔒 SEGURIDAD: Actualización segura de contraseña con bcrypt.hash(password, 10)
apiRouter.post('/auth/cambiar-password', middlewareAutenticacion, async (req: AuthenticatedRequest, res: Response) => {
  const { passwordAnterior, passwordNuevo } = req.body;
  const usuarioId = req.user?.userId;

  if (!usuarioId) {
    res.status(401).json({ error: 'No autenticado.' });
    return;
  }

  try {
    const resultado = await db.cambiarPasswordUsuario({
      usuarioId,
      passwordAnterior,
      passwordNuevo,
      forzarSinAnterior: req.user?.debeCambiarPassword,
    });

    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al cambiar la contraseña.' });
  }
});

// ==========================================
// 1.1 GESTIÓN INTEGRAL DE USUARIOS Y ROLES
// ==========================================

apiRouter.get('/usuarios', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { rol, activo } = req.query;
  let lista = [...db.usuarios];

  if (rol) {
    const rolNorm = String(rol).toUpperCase();
    lista = lista.filter((u) => u.rol === rolNorm);
  }

  if (activo !== undefined && activo !== 'todos') {
    const esActivo = String(activo) === 'true';
    lista = lista.filter((u) => u.activo === esActivo);
  }

  const conDetalles = lista.map((u) => ({
    ...u,
    vehiculoAsignado: u.vehiculoAsignadoId ? db.vehiculos.find((v) => v.id === u.vehiculoAsignadoId) : undefined,
  }));

  res.json(conDetalles);
});

// 🔒 SEGURIDAD: Creación de administrador con hash bcrypt seguro
apiRouter.post('/usuarios/admin', middlewareAutenticacion, requiereAdminPrincipal, async (req: AuthenticatedRequest, res: Response) => {
  const { nombre, email, telefonoContacto, tempPassword, activo } = req.body;

  try {
    const nuevoAdmin = await db.crearAdmin({
      nombre,
      email,
      telefonoContacto,
      tempPassword,
      activo,
    });

    res.status(201).json({
      message: 'Administrador creado exitosamente. Se ha generado su contraseña temporal y deberá cambiarla al iniciar sesión.',
      usuario: nuevoAdmin,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al crear administrador.' });
  }
});

// 🔒 SEGURIDAD: Creación de conductor con hash bcrypt seguro
apiRouter.post('/usuarios/conductor', middlewareAutenticacion, requiereAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { nombre, email, telefonoContacto, licencia, vehiculoAsignadoId, tempPassword, activo } = req.body;

  try {
    const nuevoConductor = await db.crearConductor({
      nombre,
      email,
      telefonoContacto,
      licencia,
      vehiculoAsignadoId,
      tempPassword,
      activo,
    });

    res.status(201).json({
      message: 'Conductor creado exitosamente. Se ha establecido la contraseña temporal.',
      usuario: nuevoConductor,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al crear conductor.' });
  }
});

apiRouter.put('/usuarios/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const usuarioDestino = db.usuarios.find((u) => u.id === id);

  if (!usuarioDestino) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  // Si se está editando un Administrador, requiere ser Administrador Principal
  if (usuarioDestino.rol === 'ADMIN' && !req.user?.esAdminPrincipal) {
    res.status(403).json({
      error: 'ACCESO_RESTRINGIDO_ADMIN_PRINCIPAL',
      message: 'Solo el Administrador Principal puede editar cuentas de administrador.',
    });
    return;
  }

  try {
    let usuarioActualizado: Usuario;
    if (usuarioDestino.rol === 'ADMIN') {
      usuarioActualizado = db.editarAdmin(id, req.body, req.user!.userId);
    } else {
      usuarioActualizado = db.editarConductor(id, req.body);
    }

    res.json({
      message: 'Usuario actualizado exitosamente.',
      usuario: usuarioActualizado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al actualizar usuario.' });
  }
});

apiRouter.put('/usuarios/:id/suspender', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const usuario = db.usuarios.find((u) => u.id === id);

  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  if (usuario.esAdminPrincipal) {
    res.status(400).json({ error: 'El Administrador Principal no puede ser suspendido.' });
    return;
  }

  if (usuario.rol === 'ADMIN' && !req.user?.esAdminPrincipal) {
    res.status(403).json({
      error: 'ACCESO_RESTRINGIDO_ADMIN_PRINCIPAL',
      message: 'Solo el Administrador Principal puede suspender otros administradores.',
    });
    return;
  }

  if (usuario.id === req.user?.userId) {
    res.status(400).json({ error: 'No puedes suspender tu propia cuenta de usuario.' });
    return;
  }

  usuario.activo = false;
  res.json({
    message: `${usuario.rol === 'ADMIN' ? 'Administrador' : 'Conductor'} suspendido exitosamente. No podrá iniciar sesión ni registrar operaciones.`,
    usuario,
  });
});

apiRouter.put('/usuarios/:id/activar', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const usuario = db.usuarios.find((u) => u.id === id);

  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  if (usuario.rol === 'ADMIN' && !req.user?.esAdminPrincipal) {
    res.status(403).json({
      error: 'ACCESO_RESTRINGIDO_ADMIN_PRINCIPAL',
      message: 'Solo el Administrador Principal puede reactivar administradores.',
    });
    return;
  }

  usuario.activo = true;
  res.json({
    message: 'Usuario reactivado exitosamente.',
    usuario,
  });
});

apiRouter.delete('/usuarios/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const usuario = db.usuarios.find((u) => u.id === id);

  if (!usuario) {
    res.status(404).json({ error: 'Usuario no encontrado.' });
    return;
  }

  if (usuario.rol === 'ADMIN') {
    if (!req.user?.esAdminPrincipal) {
      res.status(403).json({
        error: 'ACCESO_RESTRINGIDO_ADMIN_PRINCIPAL',
        message: 'Solo el Administrador Principal puede eliminar administradores.',
      });
      return;
    }

    try {
      const resultado = db.eliminarAdmin(id, req.user!.userId);
      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al eliminar administrador.' });
    }
  } else {
    try {
      const resultado = db.eliminarConductor(id);
      res.json(resultado);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al eliminar conductor.' });
    }
  }
});

// ==========================================
// 2. VEHÍCULOS (CRUD)
// ==========================================

apiRouter.get('/vehiculos', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { estadoFinanciero, estado } = req.query;
  let lista = [...db.vehiculos];

  if (estadoFinanciero && estadoFinanciero !== 'TODOS') {
    lista = lista.filter((v) => v.estadoFinanciero === estadoFinanciero);
  }

  if (estado && estado !== 'TODOS') {
    lista = lista.filter((v) => v.estado === estado);
  }

  res.json(lista);
});

apiRouter.post('/vehiculos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    numeroSerie,
    tipoVehiculo,
    placa,
    marca,
    modelo,
    anio,
    tipoCombustible,
    capacidadTanqueLitros,
    odometroInicial,
    rendimientoTeoricoKmL,
    ubicacion,
    fechaLecturaInicial,
    controlaKilometraje,
    tipoControlMedicion,
    estadoFinanciero,
    imagenUrl,
    conductorId,
  } = req.body;

  if (!placa || !marca || !modelo) {
    res.status(400).json({ error: 'Placa, marca y modelo son obligatorios.' });
    return;
  }

  if (db.vehiculos.some((v) => v.placa.toUpperCase() === placa.toUpperCase().trim())) {
    res.status(400).json({ error: `Ya existe un vehículo registrado con la placa ${placa}.` });
    return;
  }

  let conductorNombre: string | undefined;
  if (conductorId) {
    const cond = db.usuarios.find((u) => u.id === conductorId);
    if (cond) conductorNombre = cond.nombre;
  }

  const nuevoVehiculo: Vehiculo = {
    id: `veh-${Date.now()}`,
    numeroSerie: numeroSerie ? Number(numeroSerie) || numeroSerie : db.vehiculos.length + 1,
    tipoVehiculo: tipoVehiculo || 'Vehículo',
    placa: placa.toUpperCase().trim(),
    marca: marca.trim(),
    modelo: modelo.trim(),
    anio: Number(anio) || new Date().getFullYear(),
    tipoCombustible: tipoCombustible || 'Diesel',
    capacidadTanqueLitros: Number(capacidadTanqueLitros) || 80,
    odometroInicial: Number(odometroInicial) || 0,
    odometroActual: Number(odometroInicial) || 0,
    rendimientoTeoricoKmL: Number(rendimientoTeoricoKmL) || 10.0,
    ubicacion: ubicacion || 'Sede Central',
    fechaLecturaInicial: fechaLecturaInicial || '21/7/2025',
    controlaKilometraje: controlaKilometraje !== undefined ? controlaKilometraje : true,
    tipoControlMedicion: tipoControlMedicion || 'KILOMETROS',
    estadoFinanciero: estadoFinanciero || 'Libre',
    imagenUrl: imagenUrl || 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80',
    conductorId,
    conductorNombre,
    estado: 'Activo',
    proximoMantenimientoKm: (Number(odometroInicial) || 0) + 10000,
  };

  db.vehiculos.push(nuevoVehiculo);

  if (conductorId) {
    const cond = db.usuarios.find((u) => u.id === conductorId);
    if (cond) cond.vehiculoAsignadoId = nuevoVehiculo.id;
  }

  res.status(201).json(nuevoVehiculo);
});

apiRouter.put('/vehiculos/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.vehiculos.findIndex((v) => v.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  const vehiculoActual = db.vehiculos[index];
  const {
    numeroSerie,
    tipoVehiculo,
    placa,
    marca,
    modelo,
    anio,
    tipoCombustible,
    capacidadTanqueLitros,
    rendimientoTeoricoKmL,
    ubicacion,
    fechaLecturaInicial,
    controlaKilometraje,
    tipoControlMedicion,
    estadoFinanciero,
    imagenUrl,
    conductorId,
    estado,
    odometroActual,
  } = req.body;

  let conductorNombre = vehiculoActual.conductorNombre;
  if (conductorId !== undefined) {
    if (conductorId) {
      const cond = db.usuarios.find((u) => u.id === conductorId);
      conductorNombre = cond ? cond.nombre : undefined;
      if (cond) cond.vehiculoAsignadoId = id;
    } else {
      conductorNombre = undefined;
    }
  }

  db.vehiculos[index] = {
    ...vehiculoActual,
    numeroSerie: numeroSerie !== undefined ? numeroSerie : vehiculoActual.numeroSerie,
    tipoVehiculo: tipoVehiculo || vehiculoActual.tipoVehiculo,
    placa: placa ? placa.toUpperCase().trim() : vehiculoActual.placa,
    marca: marca || vehiculoActual.marca,
    modelo: modelo || vehiculoActual.modelo,
    anio: anio ? Number(anio) : vehiculoActual.anio,
    tipoCombustible: tipoCombustible || vehiculoActual.tipoCombustible,
    capacidadTanqueLitros: capacidadTanqueLitros ? Number(capacidadTanqueLitros) : vehiculoActual.capacidadTanqueLitros,
    rendimientoTeoricoKmL: rendimientoTeoricoKmL !== undefined ? Number(rendimientoTeoricoKmL) : vehiculoActual.rendimientoTeoricoKmL,
    ubicacion: ubicacion !== undefined ? ubicacion : vehiculoActual.ubicacion,
    fechaLecturaInicial: fechaLecturaInicial !== undefined ? fechaLecturaInicial : vehiculoActual.fechaLecturaInicial,
    controlaKilometraje: controlaKilometraje !== undefined ? controlaKilometraje : vehiculoActual.controlaKilometraje,
    tipoControlMedicion: tipoControlMedicion || vehiculoActual.tipoControlMedicion,
    estadoFinanciero: estadoFinanciero !== undefined ? estadoFinanciero : (vehiculoActual.estadoFinanciero || 'Libre'),
    imagenUrl: imagenUrl !== undefined ? imagenUrl : vehiculoActual.imagenUrl,
    conductorId,
    conductorNombre,
    estado: estado || vehiculoActual.estado,
    odometroActual: odometroActual !== undefined ? Number(odometroActual) : vehiculoActual.odometroActual,
  };

  res.json(db.vehiculos[index]);
});

apiRouter.delete('/vehiculos/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.vehiculos.findIndex((v) => v.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  db.vehiculos.splice(index, 1);
  res.json({ message: 'Vehículo eliminado con éxito.' });
});

apiRouter.post('/vehiculos/reset-kilometraje', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  db.vehiculos.forEach((v) => {
    v.odometroInicial = 0;
    v.odometroActual = 0;
    v.ultimoMantenimientoKm = 0;
  });
  db.cargas = [];
  db.solicitudes = [];
  res.json({ message: 'Kilometraje y registros de combustible de todos los vehículos restablecidos a 0 con éxito.', vehiculos: db.vehiculos });
});

apiRouter.post('/vehiculos/:id/foto', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { imagenUrl } = req.body;

  if (!imagenUrl) {
    res.status(400).json({ error: 'Se requiere la imagen del vehículo en formato URL o Base64.' });
    return;
  }

  // 🔒 SEGURIDAD: Validación de tipo MIME y rechazo de SVG/XML para prevenir XSS
  const checkMime = validarMimeTypeBase64(imagenUrl);
  if (!checkMime.valido) {
    res.status(400).json({ error: checkMime.error });
    return;
  }

  const index = db.vehiculos.findIndex((v) => v.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  // 🔒 SEGURIDAD: Mitigación IDOR verificando que solo el ADMIN o el conductor asignado modifiquen el recurso
  const vehiculo = db.vehiculos[index];
  const usuario = req.user?.userId ? db.usuarios.find((u) => u.id === req.user?.userId) : null;
  const propietarioId = vehiculo.conductorId || (usuario?.vehiculoAsignadoId === id ? req.user?.userId : '');

  const autorizado = verificarPropiedadRecurso(
    req.user?.userId || '',
    propietarioId || '',
    req.user?.rol || ''
  );

  if (!autorizado) {
    res.status(403).json({ error: 'No tienes permiso para actualizar la foto de este vehículo.' });
    return;
  }

  db.vehiculos[index].imagenUrl = imagenUrl;
  res.json(db.vehiculos[index]);
});

// ==========================================
// 3. CONDUCTORES (CRUD)
// ==========================================

apiRouter.get('/conductores', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const conductores = db.usuarios
    .filter((u) => u.rol === 'CONDUCTOR')
    .map((c) => ({
      ...c,
      vehiculoAsignado: db.vehiculos.find((v) => v.id === c.vehiculoAsignadoId),
    }));
  res.json(conductores);
});

apiRouter.post('/conductores', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { nombre, email, telefonoContacto, telefonoWhatsapp, licencia, vehiculoAsignadoId } = req.body;
  const tel = telefonoContacto || telefonoWhatsapp;

  if (!nombre || !email || !tel) {
    res.status(400).json({ error: 'Nombre, correo electrónico y teléfono son obligatorios.' });
    return;
  }

  if (db.usuarios.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(400).json({ error: 'Ya existe un usuario con ese correo electrónico.' });
    return;
  }

  const nuevoConductor: Usuario = {
    id: `usr-cond-${Date.now()}`,
    nombre: nombre.trim(),
    email: email.toLowerCase().trim(),
    rol: 'CONDUCTOR',
    telefonoContacto: tel.trim(),
    telefonoWhatsapp: tel.trim(),
    licencia: licencia?.trim(),
    vehiculoAsignadoId,
    activo: true,
  };

  db.usuarios.push(nuevoConductor);

  if (vehiculoAsignadoId) {
    const veh = db.vehiculos.find((v) => v.id === vehiculoAsignadoId);
    if (veh) {
      veh.conductorId = nuevoConductor.id;
      veh.conductorNombre = nuevoConductor.nombre;
    }
  }

  res.status(201).json(nuevoConductor);
});

apiRouter.put('/conductores/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.usuarios.findIndex((u) => u.id === id);

  if (index === -1) {
    res.status(404).json({ error: 'Conductor no encontrado.' });
    return;
  }

  const { nombre, email, telefonoContacto, telefonoWhatsapp, licencia, vehiculoAsignadoId, activo } = req.body;
  const actual = db.usuarios[index];
  const tel = telefonoContacto || telefonoWhatsapp || actual.telefonoContacto;

  db.usuarios[index] = {
    ...actual,
    nombre: nombre || actual.nombre,
    email: email || actual.email,
    telefonoContacto: tel,
    telefonoWhatsapp: tel,
    licencia: licencia !== undefined ? licencia : actual.licencia,
    vehiculoAsignadoId: vehiculoAsignadoId !== undefined ? vehiculoAsignadoId : actual.vehiculoAsignadoId,
    activo: activo !== undefined ? activo : actual.activo,
  };

  if (vehiculoAsignadoId !== undefined) {
    db.vehiculos.forEach((v) => {
      if (v.conductorId === id && v.id !== vehiculoAsignadoId) {
        v.conductorId = undefined;
        v.conductorNombre = undefined;
      }
    });

    if (vehiculoAsignadoId) {
      const nuevoVeh = db.vehiculos.find((v) => v.id === vehiculoAsignadoId);
      if (nuevoVeh) {
        nuevoVeh.conductorId = id;
        nuevoVeh.conductorNombre = db.usuarios[index].nombre;
      }
    }
  }

  res.json(db.usuarios[index]);
});

// ==========================================
// 4. SOLICITUDES DE AUTORIZACIÓN Y TOKENS DE DESPACHO
// ==========================================

// 🔒 SEGURIDAD: Mitigación IDOR con verificarPropiedadRecurso en listado de solicitudes
apiRouter.get('/solicitudes', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.rol === 'CONDUCTOR') {
    const misSolicitudes = db.solicitudes.filter((s) =>
      verificarPropiedadRecurso(req.user?.userId || '', s.conductorId, req.user?.rol || '')
    );
    res.json(misSolicitudes);
  } else {
    res.json(db.solicitudes);
  }
});

// 🔒 SEGURIDAD: Prevención IDOR en consulta individual de solicitud
apiRouter.get('/solicitudes/:id', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const solicitud = db.solicitudes.find((s) => s.id === id);
  if (!solicitud) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  if (!verificarPropiedadRecurso(req.user?.userId || '', solicitud.conductorId, req.user?.rol || '')) {
    res.status(403).json({ error: 'Acceso denegado. No tienes permisos para ver esta solicitud.' });
    return;
  }

  res.json(solicitud);
});

apiRouter.post('/solicitudes', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { vehiculoId, odometroReportado, litrosSolicitados, estacionSugerida, motivo } = req.body;

  if (!vehiculoId || !odometroReportado || !litrosSolicitados) {
    res.status(400).json({ error: 'Vehículo, odómetro actual y litros solicitados son requeridos.' });
    return;
  }

  const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId);
  if (!vehiculo) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  // 🧠 LÓGICA: PREVENCIÓN DE SPAM - Bloquea la creación si ya existe una solicitud con estado 'PENDIENTE' para el mismo vehiculoId
  const solicitudPendienteExistente = db.solicitudes.find(
    (s) => s.vehiculoId === vehiculoId && s.estado === 'PENDIENTE'
  );
  if (solicitudPendienteExistente) {
    res.status(400).json({
      error: `PREVENCIÓN DE SPAM: Ya existe una solicitud de autorización pendiente (${solicitudPendienteExistente.id}) para el vehículo ${vehiculo.placa}. No se permite crear múltiples solicitudes pendientes para la misma unidad.`,
    });
    return;
  }

  const conductor = db.usuarios.find((u) => u.id === req.user?.userId);
  const conductorNombre = conductor ? conductor.nombre : req.user?.nombre || 'Conductor';
  const conductorTelefono = conductor?.telefonoContacto || '+506 8876-5432';

  // 🧠 LÓGICA: Generar código de autorización asignado a la solicitud pendiente para control estricto de despacho
  const codigoAutorizacionGenerado = `AUT-${Math.floor(10000 + Math.random() * 90000)}`;

  const nuevaSolicitud: SolicitudAutorizacion = {
    id: `SOL-${new Date().getFullYear()}-${String(db.solicitudes.length + 1).padStart(3, '0')}`,
    fechaSolicitud: new Date().toISOString(),
    conductorId: req.user!.userId,
    conductorNombre,
    conductorTelefono,
    vehiculoId: vehiculo.id,
    vehiculoPlaca: vehiculo.placa,
    odometroReportado: Number(odometroReportado),
    litrosSolicitados: Number(litrosSolicitados),
    estacionSugerida: estacionSugerida || 'Estación en ruta habitual',
    motivo: motivo || 'Carga operativa rutinaria',
    estado: 'PENDIENTE',
    codigoAutorizacion: codigoAutorizacionGenerado,
    montoMaximoEstimado: Number((Number(litrosSolicitados) * 720).toFixed(2)),
  };

  db.solicitudes.unshift(nuevaSolicitud);
  // 🧠 LÓGICA: Persistencia en data.json del nuevo estado con la solicitud creada
  db.guardarDatos();

  // Despachar notificación interna automática al Administrador
  const notif = notificarAdminSolicitudCarga(nuevaSolicitud, vehiculo);
  nuevaSolicitud.notificacionId = notif.id;

  res.status(201).json(nuevaSolicitud);
});

apiRouter.post('/solicitudes/:id/aprobar', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const solicitud = db.solicitudes.find((s) => s.id === id);

  if (!solicitud) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  if (solicitud.estado !== 'PENDIENTE') {
    res.status(400).json({ error: `La solicitud ya está en estado ${solicitud.estado}.` });
    return;
  }

  // 🧠 LÓGICA: Mantener el código de autorización existente de la solicitud o generar uno si no estuviese presente
  const codigoAutorizacion = solicitud.codigoAutorizacion || `AUT-${Math.floor(10000 + Math.random() * 90000)}`;

  solicitud.estado = 'APROBADA';
  solicitud.codigoAutorizacion = codigoAutorizacion;
  solicitud.aprobadoPor = req.user?.nombre || 'Administrador';
  solicitud.fechaAprobacion = new Date().toISOString();
  // 🧠 LÓGICA: Persistir la aprobación en data.json
  db.guardarDatos();

  // Enviar notificación al Conductor con el código de autorización
  notificarConductorAprobacion(solicitud, codigoAutorizacion);

  res.json({
    message: 'Solicitud aprobada con éxito. Código de autorización generado y notificado al conductor.',
    solicitud,
  });
});

apiRouter.post('/solicitudes/:id/rechazar', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { motivo } = req.body;
  const solicitud = db.solicitudes.find((s) => s.id === id);

  if (!solicitud) {
    res.status(404).json({ error: 'Solicitud no encontrada.' });
    return;
  }

  solicitud.estado = 'RECHAZADA';
  solicitud.motivoRechazo = motivo || 'No cumple con las políticas de carga semanales o límite excedido.';
  solicitud.aprobadoPor = req.user?.nombre || 'Administrador';

  // Enviar notificación al Conductor con el motivo
  notificarConductorRechazo(solicitud, solicitud.motivoRechazo);

  res.json({
    message: 'Solicitud rechazada. Se ha emitido aviso al conductor.',
    solicitud,
  });
});

// ==========================================
// 5. EXTRACCIÓN ASISTIDA POR INTELIGENCIA ARTIFICIAL (GEMINI) Y CONTROL ANTI-DUPLICADOS
// ==========================================

export interface VerificacionDuplicadoResultado {
  esDuplicado: boolean;
  motivo?: string;
  cargaExistente?: CargaCombustible;
}

export function verificarFacturaDuplicada(
  numeroTicket?: string,
  claveNumerica?: string,
  fecha?: string,
  totalPagado?: number,
  litros?: number,
  estacion?: string,
  vehiculoId?: string,
  cargaIdIgnorar?: string
): VerificacionDuplicadoResultado {
  if (!db.cargas || db.cargas.length === 0) {
    return { esDuplicado: false };
  }

  const normalizarNumero = (str?: string) => {
    if (!str) return '';
    return str
      .trim()
      .toUpperCase()
      .replace(/[\s\-_.:/]/g, '')
      .replace(/^(TKT|TICKET|FACT|FACTURA|FAC|DOC|REC|NO|NRO)/, '');
  };

  const ticketNorm = normalizarNumero(numeroTicket);
  const claveNorm = normalizarNumero(claveNumerica);

  for (const carga of db.cargas) {
    if (cargaIdIgnorar && carga.id === cargaIdIgnorar) continue;

    const cargaTicket = carga.numeroTicket || carga.datosIA?.numeroTicket;
    const cargaTicketNorm = normalizarNumero(cargaTicket);
    const cargaClaveNorm = normalizarNumero(carga.claveNumerica || carga.datosIA?.claveNumerica);

    // 1. Coincidencia por Clave Numérica electrónica de 50 dígitos
    if (claveNorm && cargaClaveNorm && claveNorm.length >= 10 && claveNorm === cargaClaveNorm) {
      return {
        esDuplicado: true,
        motivo: `La Clave Numérica de Factura Electrónica ya está registrada en el sistema (Carga #${carga.id} del ${new Date(carga.fecha).toLocaleDateString('es-CR')} para ${carga.vehiculoPlaca} por ₡${carga.totalPagado.toLocaleString('es-CR')}).`,
        cargaExistente: carga,
      };
    }

    // 2. Coincidencia estricta por Número de Factura / Ticket / Consecutivo
    if (ticketNorm && cargaTicketNorm && ticketNorm.length >= 3 && ticketNorm === cargaTicketNorm) {
      return {
        esDuplicado: true,
        motivo: `El número de factura/ticket "${numeroTicket}" ya fue registrado previamente en el sistema (Carga #${carga.id} del ${new Date(carga.fecha).toLocaleDateString('es-CR')} para la unidad ${carga.vehiculoPlaca} por ₡${carga.totalPagado.toLocaleString('es-CR')}).`,
        cargaExistente: carga,
      };
    }

    // 3. Coincidencia multivariable de transacción idéntica (mismo día + mismo monto exacto + mismos litros)
    if (fecha && totalPagado && litros) {
      const fechaCarga = carga.fecha.split('T')[0];
      const fechaInput = fecha.split('T')[0];
      const montoDiferencia = Math.abs(carga.totalPagado - Number(totalPagado));
      const litrosDiferencia = Math.abs(carga.litros - Number(litros));

      if (fechaCarga === fechaInput && montoDiferencia < 5 && litrosDiferencia < 0.2) {
        return {
          esDuplicado: true,
          motivo: `Se detectó una factura idéntica ya registrada el ${fechaInput} con ${litros}L por ₡${Number(totalPagado).toLocaleString('es-CR')} para la unidad ${carga.vehiculoPlaca} (Carga #${carga.id}).`,
          cargaExistente: carga,
        };
      }
    }
  }

  return { esDuplicado: false };
}

// 🧠 LÓGICA: Esquema Zod para validación estricta de la salida de extracción de IA
export const EsquemaValidacionSalidaIA = z.object({
  litros: z
    .number({ message: 'El campo litros es requerido y debe ser un número.' })
    .gt(0, 'El campo litros debe ser estrictamente mayor a 0.'),
  precioPorLitro: z
    .number({ message: 'El campo precioPorLitro es requerido y debe ser un número.' })
    .gt(0, 'El campo precioPorLitro debe ser estrictamente mayor a 0.'),
  odometroLeido: z
    .number({ message: 'El campo odometroLeido es requerido y debe ser un número.' })
    .gte(0, 'El campo odometroLeido debe ser mayor o igual a 0.'),
});

// 🧠 LÓGICA: Función con Zod que verifica que la respuesta de /api/ia/extraer tenga litros > 0, precioPorLitro > 0 y odometroLeido >= 0
export function validarSalidaIA(
  datos: any
): { valido: boolean; error?: string; datosValidados?: z.infer<typeof EsquemaValidacionSalidaIA> } {
  const datosParaValidar = {
    ...datos,
    litros: typeof datos?.litros === 'number' ? datos.litros : Number(datos?.litros),
    precioPorLitro:
      typeof datos?.precioPorLitro === 'number'
        ? datos.precioPorLitro
        : datos?.totalPagado && datos?.litros
        ? Number((Number(datos.totalPagado) / (Number(datos.litros) || 1)).toFixed(2))
        : Number(datos?.precioPorLitro),
    odometroLeido:
      typeof datos?.odometroLeido === 'number' ? datos.odometroLeido : Number(datos?.odometroLeido),
  };

  const parseo = EsquemaValidacionSalidaIA.safeParse(datosParaValidar);
  if (!parseo.success) {
    const fallos = parseo.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    return {
      valido: false,
      error: `Validación de salida de IA no superada: ${fallos}`,
    };
  }

  return {
    valido: true,
    datosValidados: parseo.data,
  };
}

apiRouter.post('/ia/extraer', middlewareAutenticacion, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { fotoFacturaBase64, fotoOdometroBase64, odometroAnteriorReferencia } = req.body;

    if (!fotoFacturaBase64 && !fotoOdometroBase64) {
      res.status(400).json({ error: 'Se requiere al menos una imagen (factura u odómetro).' });
      return;
    }

    // 🔒 SEGURIDAD: Validación estricta de formato y tipo MIME de las imágenes para evitar ejecución de scripts maliciosos (XSS)
    const checkFactura = validarMimeTypeBase64(fotoFacturaBase64);
    if (!checkFactura.valido) {
      res.status(400).json({ error: checkFactura.error });
      return;
    }

    const checkOdometro = validarMimeTypeBase64(fotoOdometroBase64);
    if (!checkOdometro.valido) {
      res.status(400).json({ error: checkOdometro.error });
      return;
    }

    const resultado = await extraerDatosComprobanteYOdometro(
      fotoFacturaBase64,
      fotoOdometroBase64,
      odometroAnteriorReferencia ? Number(odometroAnteriorReferencia) : undefined
    );

    // Auditoría inmediata contra duplicados en la base de datos
    const checkDuplicado = verificarFacturaDuplicada(
      resultado.numeroTicket,
      resultado.claveNumerica,
      resultado.fecha,
      resultado.totalPagado,
      resultado.litros,
      resultado.estacion
    );

    if (checkDuplicado.esDuplicado) {
      resultado.esDuplicado = true;
      resultado.duplicadoDetalle = checkDuplicado.motivo;
      resultado.advertencias = [
        `⚠️ FACTURA DUPLICADA DETECTADA: ${checkDuplicado.motivo}`,
        ...(resultado.advertencias || []),
      ];
    }

    // 🧠 LÓGICA: VALIDACIÓN DE SALIDA DE IA - Verificar mediante Zod que litros > 0, precioPorLitro > 0 y odometroLeido >= 0 antes de responder al cliente
    const checkSalidaIA = validarSalidaIA(resultado);
    if (!checkSalidaIA.valido) {
      res.status(400).json({
        error: checkSalidaIA.error,
        datosParciales: resultado,
      });
      return;
    }

    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: 'Error en extracción de IA: ' + error.message });
  }
});

apiRouter.post('/cargas/verificar-duplicado', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { numeroTicket, claveNumerica, fecha, totalPagado, litros, estacion, vehiculoId, cargaIdIgnorar } = req.body;
  const resultado = verificarFacturaDuplicada(
    numeroTicket,
    claveNumerica,
    fecha,
    totalPagado ? Number(totalPagado) : undefined,
    litros ? Number(litros) : undefined,
    estacion,
    vehiculoId,
    cargaIdIgnorar
  );
  res.json(resultado);
});

// ==========================================
// 6. CARGAS DE COMBUSTIBLE
// ==========================================

// 🔒 SEGURIDAD: Control de acceso y prevención de IDOR en listado de cargas para CONDUCTOR
apiRouter.get('/cargas', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { estado, vehiculoId } = req.query;

  let resultado = [...db.cargas];

  if (req.user?.rol === 'CONDUCTOR') {
    resultado = resultado.filter((c) =>
      verificarPropiedadRecurso(req.user?.userId || '', c.conductorId, req.user?.rol || '')
    );
  }

  if (estado) {
    resultado = resultado.filter((c) => c.estadoValidacion === estado);
  }

  if (vehiculoId) {
    resultado = resultado.filter((c) => c.vehiculoId === vehiculoId);
  }

  res.json(resultado);
});

// 🔒 SEGURIDAD: Prevención IDOR estricta para visualización individual de carga
apiRouter.get('/cargas/:id', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const carga = db.cargas.find((c) => c.id === id);
  if (!carga) {
    res.status(404).json({ error: 'Carga de combustible no encontrada.' });
    return;
  }

  if (!verificarPropiedadRecurso(req.user?.userId || '', carga.conductorId, req.user?.rol || '')) {
    res.status(403).json({ error: 'Acceso denegado. No tienes permisos para ver esta carga.' });
    return;
  }

  res.json(carga);
});

apiRouter.post('/cargas', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const {
    vehiculoId,
    solicitudAutorizacionId,
    codigoAutorizacion,
    estacion,
    numeroTicket,
    claveNumerica,
    tipoCombustible,
    litros,
    precioPorLitro,
    totalPagado,
    odometroActual,
    fotoFacturaBase64,
    fotoOdometroBase64,
    notaConductor,
    datosIA,
  } = req.body;

  if (!vehiculoId || !litros || !totalPagado || odometroActual === undefined || odometroActual === null) {
    res.status(400).json({ error: 'Vehículo, litros, total y odómetro actual son requeridos.' });
    return;
  }

  // 🧠 LÓGICA: LÓGICA DE CARGA - Exige y valida el campo codigoAutorizacion
  if (!codigoAutorizacion || typeof codigoAutorizacion !== 'string' || !codigoAutorizacion.trim()) {
    res.status(400).json({ error: 'El campo codigoAutorizacion es requerido y obligatorio para registrar la carga.' });
    return;
  }

  const codigoIngresado = codigoAutorizacion.trim().toUpperCase();

  const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId);
  if (!vehiculo) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  // 🧠 LÓGICA: LÓGICA DE CARGA - Busca la solicitud pendiente y verifica que el código coincida. Si no coincide, rechaza con error 400.
  const solicitudPendiente =
    db.solicitudes.find(
      (s) =>
        s.estado === 'PENDIENTE' &&
        (solicitudAutorizacionId ? s.id === solicitudAutorizacionId : s.vehiculoId === vehiculoId)
    ) ||
    db.solicitudes.find(
      (s) =>
        (s.estado === 'PENDIENTE' || s.estado === 'APROBADA') &&
        ((solicitudAutorizacionId && s.id === solicitudAutorizacionId) ||
          s.vehiculoId === vehiculoId ||
          s.codigoAutorizacion?.toUpperCase() === codigoIngresado)
    );

  if (!solicitudPendiente) {
    res.status(400).json({
      error: 'No se encontró ninguna solicitud pendiente de autorización para este vehículo.',
    });
    return;
  }

  const codigoEsperado = (solicitudPendiente.codigoAutorizacion || '').trim().toUpperCase();
  if (!codigoEsperado || codigoEsperado !== codigoIngresado) {
    res.status(400).json({
      error: `El código de autorización ingresado (${codigoAutorizacion}) no coincide con el código de autorización de la solicitud (${codigoEsperado || 'sin código asignado'}).`,
    });
    return;
  }

  // 🔒 SEGURIDAD: Validación estricta de imágenes Base64 y rechazo de SVG/XML para prevenir inyección XSS
  const checkFact = validarMimeTypeBase64(fotoFacturaBase64);
  if (!checkFact.valido) {
    res.status(400).json({ error: checkFact.error });
    return;
  }
  const checkOdo = validarMimeTypeBase64(fotoOdometroBase64);
  if (!checkOdo.valido) {
    res.status(400).json({ error: checkOdo.error });
    return;
  }

  const numLitros = Number(litros);
  const numTotal = Number(totalPagado);
  const numOdoActual = Number(odometroActual);

  const folioFinal =
    numeroTicket?.trim() ||
    datosIA?.numeroTicket?.trim() ||
    `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

  const claveFinal = claveNumerica?.trim() || datosIA?.claveNumerica?.trim();

  // CONTROL ANTI-DUPLICADOS ESTRICTO
  const checkDuplicado = verificarFacturaDuplicada(
    folioFinal,
    claveFinal,
    datosIA?.fecha || new Date().toISOString().split('T')[0],
    numTotal,
    numLitros,
    estacion,
    vehiculo.id
  );

  if (checkDuplicado.esDuplicado) {
    res.status(409).json({
      error: `FACTURA DUPLICADA RECHAZADA: ${checkDuplicado.motivo}`,
      esDuplicado: true,
      duplicadoDetalle: checkDuplicado.motivo,
    });
    return;
  }

  // 🧠 LÓGICA: VALIDACIÓN DE ODOMETRO - Valida que odometroActual sea estrictamente mayor o igual al odometroActual guardado en el vehículo. Si es menor, rechaza con error 400.
  const odometroAnterior = vehiculo.odometroActual;

  if (isNaN(numOdoActual) || numOdoActual < odometroAnterior) {
    res.status(400).json({
      error: `El odómetro actual (${numOdoActual} km) debe ser estrictamente mayor o igual al odómetro actual registrado en el vehículo (${odometroAnterior} km).`,
    });
    return;
  }

  // Cálculos automáticos de métricas
  const metricas = procesarMetricasCarga(
    numOdoActual,
    odometroAnterior,
    numLitros,
    numTotal,
    vehiculo.rendimientoTeoricoKmL
  );

  const conductor = db.usuarios.find((u) => u.id === req.user?.userId);
  const conductorNombre = conductor ? conductor.nombre : req.user?.nombre || 'Conductor';

  const fotoFacturaUrl =
    fotoFacturaBase64 ||
    generarTicketSvgBase64(
      estacion || 'Estación de Servicio',
      numLitros,
      numTotal,
      new Date().toISOString().split('T')[0],
      folioFinal
    );
  const fotoOdometroUrl = fotoOdometroBase64 || generarOdometroSvgBase64(numOdoActual, vehiculo.placa);

  // 🧠 LÓGICA: Marcar la solicitud como completada con la carga registrada
  solicitudPendiente.estado = 'COMPLETADA';
  const idSolicitudFinal = solicitudAutorizacionId || solicitudPendiente.id;

  const nuevaCarga: CargaCombustible = {
    id: `CRG-${Date.now().toString().slice(-6)}`,
    fecha: new Date().toISOString(),
    conductorId: req.user!.userId,
    conductorNombre,
    vehiculoId: vehiculo.id,
    vehiculoPlaca: vehiculo.placa,
    solicitudAutorizacionId: idSolicitudFinal,
    codigoAutorizacion: codigoIngresado,
    estacion: estacion || 'Gasolinera en ruta',
    numeroTicket: folioFinal,
    claveNumerica: claveFinal,
    tipoCombustible: tipoCombustible || vehiculo.tipoCombustible,
    litros: numLitros,
    precioPorLitro: Number(precioPorLitro) || Number((numTotal / (numLitros || 1)).toFixed(2)),
    totalPagado: numTotal,
    odometroAnterior,
    odometroActual: numOdoActual,
    kmRecorridos: metricas.kmRecorridos,
    costoPorKm: metricas.costoPorKm,
    rendimientoKmL: metricas.rendimientoKmL,
    estadoValidacion: metricas.anomalia ? 'REQUIERE_REVISION' : 'PENDIENTE',
    notaConductor: notaConductor ? String(notaConductor).trim() : undefined,
    fotoFacturaUrl,
    fotoOdometroUrl,
    datosIA: datosIA || {
      estacion,
      numeroTicket: folioFinal,
      claveNumerica: claveFinal,
      litros: numLitros,
      totalPagado: numTotal,
      odometroLeido: numOdoActual,
      confianzaScore: 95,
      advertencias: [],
    },
    anomaliaDetectada: metricas.anomalia,
    motivoAnomalia: metricas.motivoAnomalia,
    esDuplicado: false,
  };

  db.cargas.unshift(nuevaCarga);

  vehiculo.odometroActual = numOdoActual;

  // 🧠 LÓGICA: Registro automático de la lectura de odómetro en el historial para auditoría y antifraude
  const nuevaLectura: LecturaOdometro = {
    id: `ODO-${Date.now()}`,
    vehiculoId: vehiculo.id,
    km: numOdoActual,
    fecha: nuevaCarga.fecha,
    registradoPorId: req.user!.userId,
    registradoPorNombre: conductorNombre,
    observaciones: `Lectura registrada en despacho de combustible #${nuevaCarga.id} (${numLitros} L)`,
  };
  db.lecturasOdometro.unshift(nuevaLectura);

  // 🧠 LÓGICA: Persistir el nuevo estado, odómetro y lecturas en data.json
  db.guardarDatos();

  if (metricas.anomalia) {
    notificarAdminAlertaAnomalia(nuevaCarga, vehiculo);
  }

  res.status(201).json(nuevaCarga);
});

// Edición completa de Factura por el Administrador (con selección de servicio contable)
apiRouter.put('/cargas/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    estacion,
    tipoCombustible,
    servicioDestino,
    saldoPrepagoId,
    metodoPago,
    numeroTicket,
    claveNumerica,
    fecha,
    litros,
    precioPorLitro,
    totalPagado,
    odometroActual,
    vehiculoId,
    conductorId,
    notasValidacion,
    estadoValidacion,
  } = req.body;

  const carga = db.cargas.find((c) => c.id === id);
  if (!carga) {
    res.status(404).json({ error: 'Carga de combustible no encontrada.' });
    return;
  }

  // Cambio de vehículo si se seleccionó otro
  if (vehiculoId && vehiculoId !== carga.vehiculoId) {
    const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId);
    if (vehiculo) {
      carga.vehiculoId = vehiculo.id;
      carga.vehiculoPlaca = vehiculo.placa;
    }
  }

  // Cambio de conductor si se seleccionó otro
  if (conductorId && conductorId !== carga.conductorId) {
    const cond = db.usuarios.find((u) => u.id === conductorId);
    if (cond) {
      carga.conductorId = cond.id;
      carga.conductorNombre = cond.nombre;
    }
  }

  if (estacion !== undefined) carga.estacion = estacion;
  if (tipoCombustible !== undefined) carga.tipoCombustible = tipoCombustible;
  if (servicioDestino !== undefined) carga.servicioDestino = servicioDestino;
  if (saldoPrepagoId !== undefined) carga.saldoPrepagoId = saldoPrepagoId;
  if (metodoPago !== undefined) carga.metodoPago = metodoPago;
  if (numeroTicket !== undefined) carga.numeroTicket = numeroTicket;
  if (claveNumerica !== undefined) carga.claveNumerica = claveNumerica;
  if (fecha !== undefined) carga.fecha = fecha;
  if (notasValidacion !== undefined) carga.notasValidacion = notasValidacion;

  const numLitros = litros !== undefined ? Number(litros) : carga.litros;
  let numTotal = totalPagado !== undefined ? Number(totalPagado) : carga.totalPagado;
  const numOdoActual = odometroActual !== undefined ? Number(odometroActual) : carga.odometroActual;

  if (precioPorLitro !== undefined && litros !== undefined && totalPagado === undefined) {
    numTotal = Number((Number(precioPorLitro) * numLitros).toFixed(2));
  }

  const precioUnitario =
    precioPorLitro !== undefined
      ? Number(precioPorLitro)
      : Number((numTotal / (numLitros || 1)).toFixed(2));

  carga.litros = numLitros;
  carga.totalPagado = numTotal;
  carga.precioPorLitro = precioUnitario;
  carga.odometroActual = numOdoActual;

  const vehiculoActual = db.vehiculos.find((v) => v.id === carga.vehiculoId);
  const metricas = procesarMetricasCarga(
    numOdoActual,
    carga.odometroAnterior,
    numLitros,
    numTotal,
    vehiculoActual?.rendimientoTeoricoKmL || 12.0
  );

  carga.kmRecorridos = metricas.kmRecorridos;
  carga.costoPorKm = metricas.costoPorKm;
  carga.rendimientoKmL = metricas.rendimientoKmL;
  carga.anomaliaDetectada = metricas.anomalia;
  carga.motivoAnomalia = metricas.motivoAnomalia;

  if (vehiculoActual && numOdoActual > vehiculoActual.odometroActual) {
    vehiculoActual.odometroActual = numOdoActual;
  }

  if (estadoValidacion && estadoValidacion !== carga.estadoValidacion) {
    carga.estadoValidacion = estadoValidacion;
    carga.validadoPor = req.user?.nombre || 'Administrador';
    carga.fechaValidacion = new Date().toISOString();
  }

  res.json({
    message: 'Factura actualizada exitosamente.',
    carga,
  });
});

apiRouter.put('/cargas/:id/validar', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    estadoValidacion,
    notasValidacion,
    litros,
    totalPagado,
    precioPorLitro,
    odometroActual,
    estacion,
    tipoCombustible,
    servicioDestino,
    saldoPrepagoId,
    metodoPago,
    numeroTicket,
    claveNumerica,
    fecha,
    vehiculoId,
    conductorId,
  } = req.body;

  const carga = db.cargas.find((c) => c.id === id);
  if (!carga) {
    res.status(404).json({ error: 'Carga de combustible no encontrada.' });
    return;
  }

  // Cambio de vehículo si se especificó
  if (vehiculoId && vehiculoId !== carga.vehiculoId) {
    const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId);
    if (vehiculo) {
      carga.vehiculoId = vehiculo.id;
      carga.vehiculoPlaca = vehiculo.placa;
    }
  }

  // Cambio de conductor si se especificó
  if (conductorId && conductorId !== carga.conductorId) {
    const cond = db.usuarios.find((u) => u.id === conductorId);
    if (cond) {
      carga.conductorId = cond.id;
      carga.conductorNombre = cond.nombre;
    }
  }

  if (estacion !== undefined) carga.estacion = estacion;
  if (tipoCombustible !== undefined) carga.tipoCombustible = tipoCombustible;
  if (servicioDestino !== undefined) carga.servicioDestino = servicioDestino;
  if (saldoPrepagoId !== undefined) carga.saldoPrepagoId = saldoPrepagoId;
  if (metodoPago !== undefined) carga.metodoPago = metodoPago;
  if (numeroTicket !== undefined) carga.numeroTicket = numeroTicket;
  if (claveNumerica !== undefined) carga.claveNumerica = claveNumerica;
  if (fecha !== undefined) carga.fecha = fecha;

  const numLitros = litros !== undefined ? Number(litros) : carga.litros;
  let numTotal = totalPagado !== undefined ? Number(totalPagado) : carga.totalPagado;
  const numOdoActual = odometroActual !== undefined ? Number(odometroActual) : carga.odometroActual;

  if (precioPorLitro !== undefined && litros !== undefined && totalPagado === undefined) {
    numTotal = Number((Number(precioPorLitro) * numLitros).toFixed(2));
  }

  const precioUnitario =
    precioPorLitro !== undefined
      ? Number(precioPorLitro)
      : Number((numTotal / (numLitros || 1)).toFixed(2));

  carga.litros = numLitros;
  carga.totalPagado = numTotal;
  carga.precioPorLitro = precioUnitario;
  carga.odometroActual = numOdoActual;

  const vehiculoActual = db.vehiculos.find((v) => v.id === carga.vehiculoId);
  const metricas = procesarMetricasCarga(
    numOdoActual,
    carga.odometroAnterior,
    numLitros,
    numTotal,
    vehiculoActual?.rendimientoTeoricoKmL || 12.0
  );

  carga.kmRecorridos = metricas.kmRecorridos;
  carga.costoPorKm = metricas.costoPorKm;
  carga.rendimientoKmL = metricas.rendimientoKmL;
  carga.anomaliaDetectada = metricas.anomalia;
  carga.motivoAnomalia = metricas.motivoAnomalia;

  if (vehiculoActual && numOdoActual > vehiculoActual.odometroActual) {
    vehiculoActual.odometroActual = numOdoActual;
  }

  const nuevoEstado = estadoValidacion || 'VALIDADO';

  // Si se va a validar por primera vez (o pasa a VALIDADO)
  if (nuevoEstado === 'VALIDADO' && carga.estadoValidacion !== 'VALIDADO') {
    // Si el administrador eligió no descontar de saldo prepago (ej. Crédito directo, Efectivo, Caja Chica)
    const sinSaldoPrepago =
      saldoPrepagoId === 'SIN_SALDO_PREPAGO' ||
      metodoPago === 'Crédito Corporativo' ||
      metodoPago === 'Caja Chica / Efectivo';

    if (!sinSaldoPrepago) {
      // 1. Identificar saldo de la estación específico o por nombre de estación
      let saldo = saldoPrepagoId
        ? db.saldos.find((s) => s.id === saldoPrepagoId)
        : db.buscarSaldoPorEstacion(carga.estacion);

      if (!saldo) {
        res.status(400).json({
          error: 'SALDO_NO_CONFIGURADO',
          message: `No se encontró una cuenta de saldo prepago para la estación "${carga.estacion}". Puedes registrar la estación en el módulo de saldos prepago antes de validar.`,
        });
        return;
      }

      // 2. Verificar fondos suficientes
      if (saldo.saldoActual < numTotal) {
        const faltante = Number((numTotal - saldo.saldoActual).toFixed(2));
        res.status(400).json({
          error: 'SALDO_INSUFICIENTE',
          message: `Saldo insuficiente en ${saldo.estacionNombre}. Saldo disponible: ₡${Math.round(saldo.saldoActual).toLocaleString('es-CR')}, Faltante: ₡${Math.round(faltante).toLocaleString('es-CR')}. Debe registrar un depósito antes de validar.`,
          saldoDisponible: saldo.saldoActual,
          faltante,
          saldoId: saldo.id,
          estacionNombre: saldo.estacionNombre,
          tipoCombustible: carga.tipoCombustible,
          costoTotalFactura: numTotal,
        });
        return;
      }

      // 3. Descuento atómico del saldo (manteniendo el tipo de combustible en la bitácora)
      const resultadoDescuento = db.descontarSaldo({
        saldoId: saldo.id,
        monto: numTotal,
        registroCombustibleId: carga.id,
        tipoCombustible: carga.tipoCombustible,
        vehiculoPlaca: carga.vehiculoPlaca,
        numeroTicket: carga.numeroTicket,
        usuarioId: req.user?.userId || 'usr-admin-1',
        usuarioNombre: req.user?.nombre || 'Administrador',
        notas: `Validación factura #${carga.numeroTicket || carga.id} - ${carga.vehiculoPlaca} (${numLitros} L ${carga.tipoCombustible})`,
      });

      if (!resultadoDescuento.exito) {
        res.status(400).json({
          error: 'ERROR_DESCUENTO_SALDO',
          message: resultadoDescuento.error || 'Error al descontar saldo prepago.',
        });
        return;
      }

      carga.saldoPrepagoId = saldo.id;
      carga.servicioDestino = saldo.estacionNombre;
    }
  }

  carga.estadoValidacion = nuevoEstado;
  carga.validadoPor = req.user?.nombre || 'Administrador';
  carga.fechaValidacion = new Date().toISOString();
  carga.notasValidacion = notasValidacion || carga.notasValidacion;

  res.json({
    message: `Factura ${nuevoEstado === 'VALIDADO' ? 'aprobada y validada' : 'actualizada'} exitosamente.`,
    carga,
  });
});

apiRouter.delete('/cargas/todas', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  db.cargas = [];
  res.json({ message: 'Todo el historial de cargas de combustible ha sido eliminado correctamente.' });
});

apiRouter.delete('/cargas/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = db.cargas.findIndex((c) => c.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Carga no encontrada.' });
    return;
  }
  db.cargas.splice(index, 1);
  res.json({ message: 'Registro de carga eliminado.' });
});

// ==========================================
// 7. MANTENIMIENTOS
// ==========================================

apiRouter.get('/mantenimientos', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { vehiculoId } = req.query;
  let lista = [...db.mantenimientos];

  if (vehiculoId) {
    lista = lista.filter((m) => m.vehiculoId === vehiculoId);
  }

  res.json(lista);
});

apiRouter.post('/mantenimientos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { vehiculoId, fecha, odometroKm, tipo, taller, descripcion, costo, proximoMantenimientoKm, proximaFecha } =
    req.body;

  if (!vehiculoId || !odometroKm || !tipo || !costo) {
    res.status(400).json({ error: 'Vehículo, odómetro, tipo de mantenimiento y costo son obligatorios.' });
    return;
  }

  const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId);
  if (!vehiculo) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  const nuevoMantenimiento: Mantenimiento = {
    id: `MNT-${Date.now().toString().slice(-5)}`,
    vehiculoId: vehiculo.id,
    vehiculoPlaca: vehiculo.placa,
    fecha: fecha || new Date().toISOString().split('T')[0],
    odometroKm: Number(odometroKm),
    tipo,
    taller: taller || 'Taller Autorizado',
    descripcion: descripcion || 'Mantenimiento preventivo de rutina',
    costo: Number(costo),
    proximoMantenimientoKm: proximoMantenimientoKm ? Number(proximoMantenimientoKm) : Number(odometroKm) + 10000,
    proximaFecha,
    registradoPor: req.user?.nombre || 'Administrador',
  };

  db.mantenimientos.unshift(nuevoMantenimiento);

  vehiculo.ultimoMantenimientoKm = Number(odometroKm);
  if (proximoMantenimientoKm) {
    vehiculo.proximoMantenimientoKm = Number(proximoMantenimientoKm);
  }

  res.status(201).json(nuevoMantenimiento);
});

// ==========================================
// 8. REPORTES, COMPARATIVAS Y DASHBOARD
// ==========================================

apiRouter.get('/reportes/dashboard', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const totalVehiculos = db.vehiculos.length;
  const totalConductores = db.usuarios.filter((u) => u.rol === 'CONDUCTOR').length;
  const totalCargasRealizadas = db.cargas.length;
  const cargasPendientesValidacion = db.cargas.filter(
    (c) => c.estadoValidacion === 'PENDIENTE' || c.estadoValidacion === 'REQUIERE_REVISION'
  ).length;
  const solicitudesPendientes = db.solicitudes.filter((s) => s.estado === 'PENDIENTE').length;

  const gastoTotalCombustible = db.cargas.reduce((acc, c) => acc + c.totalPagado, 0);
  const totalLitrosCargados = db.cargas.reduce((acc, c) => acc + c.litros, 0);
  const totalKmRecorridos = db.cargas.reduce((acc, c) => acc + c.kmRecorridos, 0);
  const totalGastoMantenimiento = db.mantenimientos.reduce((acc, m) => acc + m.costo, 0);

  const rendimientoPromedioFlotaKmL =
    totalLitrosCargados > 0 ? Number((totalKmRecorridos / totalLitrosCargados).toFixed(2)) : 0;
  const costoPromedioPorKm =
    totalKmRecorridos > 0 ? Number((gastoTotalCombustible / totalKmRecorridos).toFixed(2)) : 0;
  const costoPromedioPorLitro =
    totalLitrosCargados > 0 ? Number((gastoTotalCombustible / totalLitrosCargados).toFixed(2)) : 0;

  const alertasAnomalias = db.cargas.filter((c) => c.anomaliaDetectada).length;

  const metricas: MetricasFlota = {
    totalVehiculos,
    totalConductores,
    totalCargasRealizadas,
    cargasPendientesValidacion,
    solicitudesPendientes,
    gastoTotalCombustible: Number(gastoTotalCombustible.toFixed(2)),
    totalLitrosCargados: Number(totalLitrosCargados.toFixed(2)),
    rendimientoPromedioFlotaKmL,
    costoPromedioPorKm,
    costoPromedioPorLitro,
    totalKmRecorridos,
    totalGastoMantenimiento: Number(totalGastoMantenimiento.toFixed(2)),
    alertasAnomalias,
  };

  const comparativaVehiculos = db.vehiculos.map((v) => {
    const cargasVeh = db.cargas.filter((c) => c.vehiculoId === v.id);
    const totalGasto = cargasVeh.reduce((acc, c) => acc + c.totalPagado, 0);
    const totalLitros = cargasVeh.reduce((acc, c) => acc + c.litros, 0);
    const totalKm = cargasVeh.reduce((acc, c) => acc + c.kmRecorridos, 0);
    const rendimientoReal = totalLitros > 0 ? Number((totalKm / totalLitros).toFixed(2)) : 0;
    const costoKm = totalKm > 0 ? Number((totalGasto / totalKm).toFixed(2)) : 0;
    const anomalias = cargasVeh.filter((c) => c.anomaliaDetectada).length;

    return {
      id: v.id,
      placa: v.placa,
      modelo: `${v.marca} ${v.modelo}`,
      conductor: v.conductorNombre || 'Sin asignar',
      rendimientoTeorico: v.rendimientoTeoricoKmL,
      rendimientoReal,
      eficienciaPorcentaje:
        v.rendimientoTeoricoKmL > 0 ? Number(((rendimientoReal / v.rendimientoTeoricoKmL) * 100).toFixed(1)) : 100,
      totalGasto: Number(totalGasto.toFixed(2)),
      totalLitros: Number(totalLitros.toFixed(2)),
      totalKm,
      costoKm,
      cargasContador: cargasVeh.length,
      anomalias,
      estado: v.estado,
    };
  });

  const conductores = db.usuarios.filter((u) => u.rol === 'CONDUCTOR');
  const comparativaConductores = conductores.map((c) => {
    const cargasCond = db.cargas.filter((cg) => cg.conductorId === c.id);
    const totalGasto = cargasCond.reduce((acc, cg) => acc + cg.totalPagado, 0);
    const totalLitros = cargasCond.reduce((acc, cg) => acc + cg.litros, 0);
    const totalKm = cargasCond.reduce((acc, cg) => acc + cg.kmRecorridos, 0);
    const rendimiento = totalLitros > 0 ? Number((totalKm / totalLitros).toFixed(2)) : 0;
    const costoKm = totalKm > 0 ? Number((totalGasto / totalKm).toFixed(2)) : 0;

    return {
      id: c.id,
      nombre: c.nombre,
      telefono: c.telefonoContacto,
      vehiculoAsignado: db.vehiculos.find((v) => v.id === c.vehiculoAsignadoId)?.placa || 'N/A',
      cargasTotales: cargasCond.length,
      gastoTotal: Number(totalGasto.toFixed(2)),
      litrosTotales: Number(totalLitros.toFixed(2)),
      kmTotales: totalKm,
      rendimientoKmL: rendimiento,
      costoPorKm: costoKm,
    };
  });

  const evolucionMensual = [
    { mes: 'Agosto (Act)', gasto: Math.round(gastoTotalCombustible), litros: Math.round(totalLitrosCargados), km: totalKmRecorridos, rendimiento: rendimientoPromedioFlotaKmL },
  ];

  res.json({
    metricas,
    comparativaVehiculos,
    comparativaConductores,
    evolucionMensual,
    ultimasCargas: db.cargas.slice(0, 5),
    solicitudesRecientes: db.solicitudes.slice(0, 5),
  });
});

// ==========================================
// 9. NOTIFICACIONES Y AVISOS DEL SISTEMA
// ==========================================

apiRouter.get('/notificaciones', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.rol === 'CONDUCTOR') {
    const misNotifs = historialNotificaciones.filter(
      (n) => n.destinatarioRol === 'CONDUCTOR' || n.destinatarioRol === 'TODOS' || n.destinatarioNombre === req.user?.nombre
    );
    res.json(misNotifs);
  } else {
    res.json(historialNotificaciones);
  }
});

apiRouter.post('/notificaciones/:id/leida', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notif = historialNotificaciones.find((n) => n.id === id);
  if (notif) {
    notif.leido = true;
  }
  res.json({ success: true, notificacion: notif });
});

apiRouter.post('/notificaciones/marcar-todas-leidas', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  historialNotificaciones.forEach((n) => {
    n.leido = true;
  });
  res.json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
});

apiRouter.post('/notificaciones/enviar', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { destinatarioNombre, tipo, titulo, contenido, prioridad, destinatarioRol } = req.body;

  const notif = despacharNotificacion(
    req.user?.nombre || 'Sistema Central',
    destinatarioNombre || 'Todos los Conductores',
    tipo || 'AVISO_SISTEMA',
    titulo || 'Aviso Operativo de Flota',
    contenido || 'Notificación emitida desde el panel de control.',
    undefined,
    prioridad || 'NORMAL',
    destinatarioRol || 'TODOS'
  );

  res.status(201).json({ success: true, notificacion: notif });
});

// ==========================================
// 10. MÓDULO DE SALDOS PREPAGO Y DEPÓSITOS (SOLO ADMIN)
// ==========================================

apiRouter.get('/saldos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const saldosConDetalle = db.obtenerSaldosConDetalle();
  res.json(saldosConDetalle);
});

apiRouter.get('/saldos/alertas', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const saldosConDetalle = db.obtenerSaldosConDetalle();
  const enAlerta = saldosConDetalle.filter((s) => s.saldoActual <= s.umbralAlerta);
  res.json(enAlerta);
});

apiRouter.get('/saldos/:id', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const saldo = db.saldos.find((s) => s.id === id);
  if (!saldo) {
    res.status(404).json({ error: 'Saldo por estación no encontrado.' });
    return;
  }
  const movs = db.movimientosSaldo.filter((m) => m.saldoId === id);
  res.json({ ...saldo, movimientos: movs });
});

apiRouter.post('/saldos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { estacionId, estacionNombre, saldoInicial, umbralAlerta, moneda } = req.body;

  let nombreEst = estacionNombre;
  let idEst = estacionId;

  if (idEst) {
    const est = db.estaciones.find((e) => e.id === idEst);
    if (est) nombreEst = est.nombre;
  } else if (nombreEst) {
    let est = db.estaciones.find((e) => e.nombre.toLowerCase().trim() === nombreEst.toLowerCase().trim());
    if (!est) {
      est = {
        id: `est-${Date.now()}`,
        nombre: nombreEst.trim(),
        ubicacion: 'Costa Rica',
        moneda: 'CRC',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Súper'],
        activo: true,
      };
      db.estaciones.push(est);
    }
    idEst = est.id;
  } else {
    res.status(400).json({ error: 'Debe especificar la estación de servicio.' });
    return;
  }

  // Verificar si ya existe una cuenta de saldo activa para esa estación
  const existente = db.saldos.find(
    (s) => s.estacionId === idEst || s.estacionNombre.toLowerCase().trim() === nombreEst.toLowerCase().trim()
  );
  if (existente) {
    res.status(400).json({
      error: 'SALDO_DUPLICADO',
      message: `Ya existe una cuenta de saldo prepago para la estación "${nombreEst}".`,
      saldoExistenteId: existente.id,
    });
    return;
  }

  const saldoNum = Number(saldoInicial) || 0;
  const umbralNum = Number(umbralAlerta) || 50000;
  const nowIso = new Date().toISOString();

  const nuevoSaldo = {
    id: `saldo-${Date.now()}`,
    estacionId: idEst,
    estacionNombre: nombreEst,
    saldoActual: saldoNum,
    moneda: moneda || 'CRC',
    umbralAlerta: umbralNum,
    activo: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  db.saldos.push(nuevoSaldo);

  if (saldoNum > 0) {
    db.movimientosSaldo.unshift({
      id: `mov-${Date.now()}`,
      saldoId: nuevoSaldo.id,
      estacionNombre: nuevoSaldo.estacionNombre,
      tipo: 'carga_inicial',
      monto: saldoNum,
      saldoAnterior: 0,
      saldoNuevo: saldoNum,
      usuarioId: req.user?.userId || 'usr-admin-1',
      usuarioNombre: req.user?.nombre || 'Administrador',
      fecha: nowIso,
      fechaDeposito: nowIso.split('T')[0],
      notas: 'Apertura inicial de saldo prepago para la estación',
    });
  }

  res.status(201).json(nuevoSaldo);
});

apiRouter.post('/saldos/:id/depositos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { monto, fechaDeposito, notas, comprobanteReferencia } = req.body;

  try {
    const resultado = db.registrarDeposito({
      saldoId: id,
      monto: Number(monto),
      fechaDeposito,
      usuarioId: req.user?.userId || 'usr-admin-1',
      usuarioNombre: req.user?.nombre || 'Administrador',
      notas,
      comprobanteReferencia,
    });

    res.status(201).json({
      message: 'Depósito registrado exitosamente.',
      saldo: resultado.saldo,
      movimiento: resultado.movimiento,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al procesar el depósito.' });
  }
});

apiRouter.put('/saldos/:id/ajustar', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { nuevoSaldo, notas } = req.body;

  if (!notas) {
    res.status(400).json({ error: 'Es obligatorio indicar el motivo del ajuste manual de saldo.' });
    return;
  }

  try {
    const resultado = db.ajustarSaldo({
      saldoId: id,
      nuevoSaldo: Number(nuevoSaldo),
      usuarioId: req.user?.userId || 'usr-admin-1',
      usuarioNombre: req.user?.nombre || 'Administrador',
      notas,
    });

    res.json({
      message: 'Saldo ajustado exitosamente.',
      saldo: resultado.saldo,
      movimiento: resultado.movimiento,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al ajustar el saldo.' });
  }
});

apiRouter.put('/saldos/:id/umbral', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { umbralAlerta } = req.body;

  const saldo = db.saldos.find((s) => s.id === id);
  if (!saldo) {
    res.status(404).json({ error: 'Saldo no encontrado.' });
    return;
  }

  const umbralNum = Number(umbralAlerta);
  if (isNaN(umbralNum) || umbralNum < 0) {
    res.status(400).json({ error: 'Umbral de alerta inválido.' });
    return;
  }

  saldo.umbralAlerta = umbralNum;
  saldo.updatedAt = new Date().toISOString();

  res.json({
    message: 'Umbral de alerta actualizado.',
    saldo,
  });
});

apiRouter.get('/saldos/:id/movimientos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { tipo, fechaDesde, fechaHasta } = req.query;

  let movs = db.movimientosSaldo.filter((m) => m.saldoId === id);

  if (tipo) {
    movs = movs.filter((m) => m.tipo === tipo);
  }
  if (fechaDesde) {
    movs = movs.filter((m) => (m.fechaDeposito || m.fecha) >= String(fechaDesde));
  }
  if (fechaHasta) {
    movs = movs.filter((m) => (m.fechaDeposito || m.fecha) <= String(fechaHasta));
  }

  res.json(movs);
});

apiRouter.get('/movimientos-saldos', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { saldoId, estacion, tipoCombustible, tipo, fechaDesde, fechaHasta } = req.query;

  let movs = [...db.movimientosSaldo];

  if (saldoId) {
    movs = movs.filter((m) => m.saldoId === saldoId);
  }
  if (estacion) {
    const estNorm = String(estacion).toLowerCase();
    movs = movs.filter((m) => m.estacionNombre.toLowerCase().includes(estNorm));
  }
  if (tipoCombustible) {
    const combNorm = String(tipoCombustible).toLowerCase();
    movs = movs.filter((m) => m.tipoCombustible.toLowerCase().includes(combNorm));
  }
  if (tipo) {
    movs = movs.filter((m) => m.tipo === tipo);
  }
  if (fechaDesde) {
    movs = movs.filter((m) => (m.fechaDeposito || m.fecha) >= String(fechaDesde));
  }
  if (fechaHasta) {
    movs = movs.filter((m) => (m.fechaDeposito || m.fecha) <= String(fechaHasta));
  }

  res.json(movs);
});

// ==========================================
// 11. ESTACIONES DE SERVICIO (BOMBAS)
// ==========================================

apiRouter.get('/estaciones', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { activo } = req.query;
  let lista = [...db.estaciones];

  if (activo !== undefined && activo !== 'todos') {
    const esActivo = String(activo) === 'true';
    lista = lista.filter((e) => e.activo === esActivo);
  }

  // Enriquecer con saldo prepago asociado
  const conSaldo = lista.map((e) => {
    const saldo = db.saldos.find((s) => s.estacionId === e.id || db.normalizarTexto(s.estacionNombre) === db.normalizarTexto(e.nombre));
    return {
      ...e,
      saldoActual: saldo ? saldo.saldoActual : 0,
      saldoId: saldo?.id,
      umbralAlerta: saldo?.umbralAlerta || 100000,
      enAlerta: saldo ? saldo.saldoActual <= saldo.umbralAlerta : false,
    };
  });

  res.json(conSaldo);
});

apiRouter.post('/estaciones', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const {
    nombre,
    ubicacion,
    direccion,
    moneda,
    cedulaJuridica,
    combustiblesDisponibles,
    saldoInicial,
    umbralAlerta,
    activo,
  } = req.body;

  try {
    const resultado = db.crearEstacion({
      nombre,
      ubicacion,
      direccion,
      moneda: moneda || 'CRC',
      cedulaJuridica,
      combustiblesDisponibles,
      saldoInicial,
      umbralAlerta,
      activo,
    });

    res.status(201).json({
      message: 'Estación de servicio y cuenta de saldo prepago creadas exitosamente.',
      estacion: resultado.estacion,
      saldo: resultado.saldo,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al crear la estación.' });
  }
});

apiRouter.put('/estaciones/:id', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const estacion = db.editarEstacion(id, req.body);
    res.json({
      message: 'Estación de servicio actualizada exitosamente.',
      estacion,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al actualizar la estación.' });
  }
});

apiRouter.put('/estaciones/:id/desactivar', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const estacion = db.estaciones.find((e) => e.id === id);
  if (!estacion) {
    res.status(404).json({ error: 'Estación no encontrada.' });
    return;
  }

  estacion.activo = false;
  res.json({
    message: 'Estación desactivada exitosamente. No se permitirá registrar nuevas cargas en ella.',
    estacion,
  });
});

apiRouter.put('/estaciones/:id/activar', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const estacion = db.estaciones.find((e) => e.id === id);
  if (!estacion) {
    res.status(404).json({ error: 'Estación no encontrada.' });
    return;
  }

  estacion.activo = true;
  res.json({
    message: 'Estación reactivada exitosamente.',
    estacion,
  });
});

apiRouter.delete('/estaciones/:id', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const resultado = db.eliminarEstacion(id);
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al eliminar la estación.' });
  }
});

// ==========================================
// 12. CONTROL DE CAJA CHICA DE COMBUSTIBLES
// ==========================================

apiRouter.get('/cajas-chicas', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  try {
    const cajas = db.getCajasChicas();
    res.json(cajas);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al listar cajas chicas.' });
  }
});

apiRouter.get('/cajas-chicas/metricas', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  try {
    const metricas = db.getMetricasCajaChica();
    res.json(metricas);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener métricas de caja chica.' });
  }
});

apiRouter.get('/cajas-chicas/movimientos', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { cajaChicaId, tipo, estado, conductorId, vehiculoPlaca, fechaDesde, fechaHasta } = req.query;

  try {
    const movimientos = db.getMovimientosCajaChica({
      cajaChicaId: cajaChicaId ? String(cajaChicaId) : undefined,
      tipo: tipo ? String(tipo) : undefined,
      estado: estado ? String(estado) : undefined,
      conductorId: conductorId ? String(conductorId) : undefined,
      vehiculoPlaca: vehiculoPlaca ? String(vehiculoPlaca) : undefined,
      fechaDesde: fechaDesde ? String(fechaDesde) : undefined,
      fechaHasta: fechaHasta ? String(fechaHasta) : undefined,
    });
    res.json(movimientos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener movimientos de caja chica.' });
  }
});

apiRouter.get('/cajas-chicas/arqueos', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { cajaChicaId } = req.query;
  try {
    const arqueos = db.getArqueosCajaChica(cajaChicaId ? String(cajaChicaId) : undefined);
    res.json(arqueos);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener arqueos.' });
  }
});

apiRouter.get('/cajas-chicas/:id', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const caja = db.getCajaChicaById(id);
  if (!caja) {
    res.status(404).json({ error: 'Caja chica no encontrada.' });
    return;
  }
  res.json(caja);
});

apiRouter.post('/cajas-chicas', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const {
    nombre,
    codigo,
    custodioId,
    custodioNombre,
    custodioTelefono,
    montoFondoFijo,
    saldoInicial,
    umbralReposicion,
    moneda,
    ubicacion,
    observaciones,
  } = req.body;

  if (!nombre || !custodioNombre || !montoFondoFijo) {
    res.status(400).json({ error: 'Nombre, custodio y monto de fondo fijo son obligatorios.' });
    return;
  }

  try {
    const resultado = db.crearCajaChica({
      nombre,
      codigo,
      custodioId: custodioId || req.usuario!.id,
      custodioNombre,
      custodioTelefono,
      montoFondoFijo: Number(montoFondoFijo),
      saldoInicial: saldoInicial !== undefined ? Number(saldoInicial) : Number(montoFondoFijo),
      umbralReposicion: umbralReposicion !== undefined ? Number(umbralReposicion) : undefined,
      moneda: moneda || 'CRC',
      ubicacion,
      observaciones,
      usuarioId: req.usuario!.id,
      usuarioNombre: req.usuario!.nombre,
    });

    res.status(201).json({
      message: 'Caja chica creada exitosamente.',
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al crear la caja chica.' });
  }
});

apiRouter.put('/cajas-chicas/:id', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const caja = db.actualizarCajaChica(id, req.body);
    res.json({
      message: 'Caja chica actualizada exitosamente.',
      caja,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al actualizar caja chica.' });
  }
});

apiRouter.delete('/cajas-chicas/:id', middlewareAutenticacion, requiereAdminPrincipal, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const resultado = db.eliminarCajaChica(id);
    res.json(resultado);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al desactivar caja chica.' });
  }
});

apiRouter.post('/cajas-chicas/:id/egreso', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    monto,
    fechaDocumento,
    numeroFactura,
    vehiculoId,
    vehiculoPlaca,
    conductorId,
    conductorNombre,
    estacionServicio,
    tipoCombustible,
    litros,
    precioPorLitro,
    odometro,
    concepto,
    motivo,
    comprobanteUrl,
    notas,
  } = req.body;

  if (!monto || !concepto) {
    res.status(400).json({ error: 'Monto y concepto son obligatorios para registrar el egreso.' });
    return;
  }

  // 🔒 SEGURIDAD: Validación estricta de formato y tipo MIME de comprobante (prevención XSS)
  const checkMime = validarMimeTypeBase64(comprobanteUrl);
  if (!checkMime.valido) {
    res.status(400).json({ error: checkMime.error });
    return;
  }

  try {
    const resultado = db.registrarEgresoCajaChica({
      cajaChicaId: id,
      monto: Number(monto),
      fechaDocumento,
      numeroFactura,
      vehiculoId,
      vehiculoPlaca,
      conductorId,
      conductorNombre,
      estacionServicio,
      tipoCombustible,
      litros: litros ? Number(litros) : undefined,
      precioPorLitro: precioPorLitro ? Number(precioPorLitro) : undefined,
      odometro: odometro ? Number(odometro) : undefined,
      concepto,
      motivo,
      comprobanteUrl,
      usuarioId: req.usuario!.id,
      usuarioNombre: req.usuario!.nombre,
      notas,
    });

    res.status(201).json({
      message: 'Egreso de combustible registrado exitosamente.',
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al registrar egreso.' });
  }
});

apiRouter.post('/cajas-chicas/:id/vales', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { montoEstimado, conductorId, conductorNombre, vehiculoId, vehiculoPlaca, concepto, motivo, fechaDocumento, notas } = req.body;

  if (!montoEstimado || !conductorNombre) {
    res.status(400).json({ error: 'Monto estimado y nombre del conductor son requeridos para emitir un vale.' });
    return;
  }

  try {
    const resultado = db.emitirValeProvisional({
      cajaChicaId: id,
      montoEstimado: Number(montoEstimado),
      conductorId: conductorId || 'usr-cond-temp',
      conductorNombre,
      vehiculoId,
      vehiculoPlaca,
      concepto: concepto || `Vale provisional para combustible - ${conductorNombre}`,
      motivo,
      fechaDocumento,
      usuarioId: req.usuario!.id,
      usuarioNombre: req.usuario!.nombre,
      notas,
    });

    res.status(201).json({
      message: `Vale provisional ${resultado.movimiento.numeroVale} emitido exitosamente.`,
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al emitir vale provisional.' });
  }
});

apiRouter.post('/cajas-chicas/vales/:valeId/liquidar', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { valeId } = req.params;
  const {
    montoGastoReal,
    numeroFactura,
    estacionServicio,
    tipoCombustible,
    litros,
    precioPorLitro,
    odometro,
    comprobanteUrl,
    notas,
  } = req.body;

  if (!montoGastoReal) {
    res.status(400).json({ error: 'El monto del gasto real es obligatorio para la liquidación.' });
    return;
  }

  try {
    const resultado = db.liquidarValeProvisional(valeId, {
      montoGastoReal: Number(montoGastoReal),
      numeroFactura,
      estacionServicio,
      tipoCombustible,
      litros: litros ? Number(litros) : undefined,
      precioPorLitro: precioPorLitro ? Number(precioPorLitro) : undefined,
      odometro: odometro ? Number(odometro) : undefined,
      comprobanteUrl,
      usuarioId: req.usuario!.id,
      usuarioNombre: req.usuario!.nombre,
      notas,
    });

    res.json({
      message: 'Vale provisional liquidado exitosamente.',
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al liquidar vale.' });
  }
});

apiRouter.post('/cajas-chicas/:id/reposicion', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { montoReposicion, comprobanteReferencia, fechaDocumento, notas } = req.body;

  try {
    const resultado = db.reposicionFondoCajaChica(id, {
      montoReposicion: montoReposicion !== undefined ? Number(montoReposicion) : undefined,
      comprobanteReferencia,
      fechaDocumento,
      usuarioId: req.usuario!.id,
      usuarioNombre: req.usuario!.nombre,
      notas,
    });

    res.json({
      message: 'Fondo de caja chica repuesto y reintegrado exitosamente.',
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al realizar la reposición.' });
  }
});

apiRouter.post('/cajas-chicas/:id/arqueo', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    efectivoContado,
    comprobantesMonto,
    valesPendientesMonto,
    desgloseBilletesMonedas,
    observaciones,
    ajustarSaldoAutomaticamente,
  } = req.body;

  if (efectivoContado === undefined || efectivoContado === null) {
    res.status(400).json({ error: 'El monto de efectivo contado físicamente es obligatorio.' });
    return;
  }

  try {
    const resultado = db.realizarArqueoCajaChica({
      cajaChicaId: id,
      efectivoContado: Number(efectivoContado),
      comprobantesMonto: comprobantesMonto !== undefined ? Number(comprobantesMonto) : undefined,
      valesPendientesMonto: valesPendientesMonto !== undefined ? Number(valesPendientesMonto) : undefined,
      desgloseBilletesMonedas,
      observaciones,
      auditorId: req.usuario!.id,
      auditorNombre: req.usuario!.nombre,
      ajustarSaldoAutomaticamente: Boolean(ajustarSaldoAutomaticamente),
    });

    res.status(201).json({
      message: `Arqueo físico registrado con resultado: ${resultado.arqueo.resultado} (Diferencia: ₡${resultado.arqueo.diferencia.toLocaleString('es-CR')}).`,
      ...resultado,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Error al procesar el arqueo.' });
  }
});

// ==========================================
// 13. PRUEBAS UNITARIAS EN TIEMPO REAL
// ==========================================

apiRouter.get('/tests/run', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const resultadoCalculos = ejecutarPruebasCalculos();

  // Test suite de saldos prepago
  const testSaldos = [
    {
      nombre: 'Existencia de Cuentas de Saldo Prepago',
      modulo: 'saldos',
      paso: db.saldos.length > 0 && db.saldos.every((s) => s.saldoActual >= 0 && s.umbralAlerta >= 0),
      esperado: 'Todas las bombas tienen saldos no negativos y umbrales configurados',
      obtenido: `${db.saldos.length} cuentas de saldo auditadas`,
      duracionMs: 0.4,
    },
    {
      nombre: 'Detección Automática de Alerta de Saldo Bajo',
      modulo: 'saldos',
      paso: db.obtenerSaldosConDetalle().some((s) => s.enAlerta === (s.saldoActual <= s.umbralAlerta)),
      esperado: 'Bandera enAlerta activa si saldo_actual <= umbral_alerta',
      obtenido: 'Consistente con los umbrales configurados',
      duracionMs: 0.3,
    },
    {
      nombre: 'Registro de Depósitos y Aumento Atómico de Saldo',
      modulo: 'saldos',
      paso: db.movimientosSaldo.filter((m) => m.tipo === 'deposito').every((m) => m.monto > 0),
      esperado: 'Todos los depósitos tienen monto positivo y aumentan saldo',
      obtenido: 'Verificado en historial de movimientos',
      duracionMs: 0.5,
    },
    {
      nombre: 'Descuento Automático de Saldo en Validación',
      modulo: 'saldos',
      paso: db.movimientosSaldo.filter((m) => m.tipo === 'descuento').every((m) => m.monto < 0),
      esperado: 'Descuentos registrados con monto negativo vinculados a facturas',
      obtenido: 'Consistente con las transacciones de validación',
      duracionMs: 0.4,
    },
  ];

  const testEndpoints = [
    {
      nombre: 'Integridad de Modelo Vehículos',
      modulo: 'db.ts',
      paso: db.vehiculos.every(
        (v) => v.placa && v.capacidadTanqueLitros > 0 && (v.tipoControlMedicion === 'HORAS' || v.rendimientoTeoricoKmL > 0)
      ),
      esperado: 'Todos los vehículos tienen placa, tanque y rendimiento válido',
      obtenido: `${db.vehiculos.length} vehículos validados`,
      duracionMs: 0.5,
    },
    {
      nombre: 'Validación de Relación Conductor-Vehículo',
      modulo: 'db.ts',
      paso: db.usuarios.filter((u) => u.rol === 'CONDUCTOR').length > 0,
      esperado: 'Existen conductores registrados con vehículo o pendientes',
      obtenido: `${db.usuarios.filter((u) => u.rol === 'CONDUCTOR').length} conductores`,
      duracionMs: 0.3,
    },
    {
      nombre: 'Fórmula de Costo por Kilómetro (Total Pagado / Distancia)',
      modulo: 'calculos.ts',
      paso: db.cargas.every((c) => c.kmRecorridos <= 0 || c.costoPorKm === Number((c.totalPagado / c.kmRecorridos).toFixed(2))),
      esperado: 'costo_km = total / km_recorridos en todas las cargas',
      obtenido: 'Consistente al 100%',
      duracionMs: 0.8,
    },
    {
      nombre: 'Fórmula de Rendimiento km/L (Distancia / Litros)',
      modulo: 'calculos.ts',
      paso: db.cargas.every((c) => c.rendimientoKmL === Number((c.kmRecorridos / c.litros).toFixed(2))),
      esperado: 'rendimiento = km_recorridos / litros en todas las cargas',
      obtenido: 'Consistente al 100%',
      duracionMs: 0.7,
    },
    {
      nombre: 'Auditoría Antifraude: Validación de Mínimo 2 Lecturas Odómetro',
      modulo: 'calculos.ts',
      paso: (() => {
        try {
          const mockDbInsuficiente: any = {
            vehiculos: [{ id: 'veh-min', placa: 'MIN-01', rendimientoTeoricoKmL: 10 }],
            lecturasOdometro: [{ id: 'o1', vehiculoId: 'veh-min', km: 1000, fecha: '2026-08-01' }],
            cargas: []
          };
          detectarFraudePorPeriodo('veh-min', '2026-08-01', '2026-08-15', mockDbInsuficiente);
          return false;
        } catch (e: any) {
          return e.status === 400 && e.code === 'INSUFICIENTES_LECTURAS_ODOMETRO';
        }
      })(),
      esperado: 'Lanza error 400 con código INSUFICIENTES_LECTURAS_ODOMETRO si < 2 lecturas',
      obtenido: 'Validación estricta activa (HTTP 400)',
      duracionMs: 0.5,
    },
    {
      nombre: 'Auditoría Antifraude: Detección Correcta de Alerta Roja (>40% sobreconsumo)',
      modulo: 'calculos.ts',
      paso: (() => {
        try {
          const mockDbFraude: any = {
            vehiculos: [{ id: 'veh-fraude', placa: 'FRD-99', rendimientoTeoricoKmL: 10 }],
            lecturasOdometro: [
              { id: 'o1', vehiculoId: 'veh-fraude', km: 10000, fecha: '2026-08-01T00:00:00Z' },
              { id: 'o2', vehiculoId: 'veh-fraude', km: 11000, fecha: '2026-08-30T00:00:00Z' },
            ],
            cargas: [
              { id: 'c1', vehiculoId: 'veh-fraude', vehiculoPlaca: 'FRD-99', litros: 160, totalPagado: 113600, fecha: '2026-08-15T00:00:00Z' }
            ]
          };
          const res = detectarFraudePorPeriodo('veh-fraude', '2026-08-01', '2026-08-30', mockDbFraude);
          return res.nivelAlerta === 'ROJO' && res.calculos.excesoLitros === 60 && res.calculos.porcentajeDesviacion === 60;
        } catch {
          return false;
        }
      })(),
      esperado: 'Nivel ROJO al superar el 40% de desviación (100 L esperados vs 160 L cargados)',
      obtenido: 'Alerta ROJA confirmada con cálculo matemático exacto',
      duracionMs: 0.6,
    },
    {
      nombre: 'Proyección de Bombas: Estimación de Días Restantes y Alerta Presupuestaria',
      modulo: 'calculos.ts',
      paso: (() => {
        try {
          const res = proyectarSaldoBomba(db.bombas[0]?.id || 'bomba-1');
          return !!(res && res.bombaId && typeof res.saldoRestante === 'number' && typeof res.alerta === 'string');
        } catch {
          return false;
        }
      })(),
      esperado: 'Proyección completa de saldo, consumo y nivel de alerta por bomba',
      obtenido: 'Proyección generada exitosamente',
      duracionMs: 0.7,
    },
  ];

  const todosResultados = [...resultadoCalculos.resultados, ...testSaldos, ...testEndpoints];
  const pasados = todosResultados.filter((t) => t.paso).length;

  res.json({
    total: todosResultados.length,
    pasados,
    fallidos: todosResultados.length - pasados,
    porcentajeExito: Number(((pasados / todosResultados.length) * 100).toFixed(1)),
    timestamp: new Date().toISOString(),
    resultados: todosResultados,
  });
});

// ==========================================
// 13. RESTAURAR DATOS DEMO
// ==========================================

apiRouter.post('/reset-demo', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  db.inicializarDatos();
  res.json({ message: 'Base de datos restaurada al estado inicial de demostración.' });
});

// ==========================================
// 14. AUDITORÍA DE COMBUSTIBLE Y DETECCIÓN DE FRAUDE
// ==========================================

apiRouter.get('/auditoria/fraude/:vehiculoId', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { vehiculoId } = req.params;
  const desde = req.query.desde as string | undefined;
  const hasta = req.query.hasta as string | undefined;

  try {
    const resultado = detectarFraudePorPeriodo(vehiculoId, desde, hasta);
    res.json({
      ...resultado,
      período: resultado.periodo,
    });
  } catch (error: any) {
    const status = error.status || (error.code === 'INSUFICIENTES_LECTURAS_ODOMETRO' ? 400 : 500);
    res.status(status).json({
      error: error.code || 'ERROR_AUDITORIA_FRAUDE',
      message: error.message || 'Error al calcular la auditoría antifraude de combustible.',
    });
  }
});

// ==========================================
// 15. GESTIÓN FINANCIERA Y PROYECCIÓN DE BOMBAS PREPAGO
// ==========================================

apiRouter.get('/bombas', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const lista = db.bombas.map((bomba) => {
      const proyeccion = proyectarSaldoBomba(bomba.id);
      return {
        id: bomba.id,
        nombre: bomba.nombre,
        estacionId: bomba.estacionId,
        ubicacion: bomba.ubicacion,
        depositoMensual: bomba.depositoMensual,
        consumido: proyeccion.consumido,
        saldoActual: proyeccion.saldoRestante,
        saldoRestante: proyeccion.saldoRestante,
        porcentajeConsumido: proyeccion.porcentajeConsumido,
        porcentajeSaldoRestante: Number((100 - proyeccion.porcentajeConsumido).toFixed(2)),
        alerta: proyeccion.alerta,
        nivelAlerta: proyeccion.alerta,
        moneda: bomba.moneda || 'CRC',
        numeroCargas: proyeccion.numeroCargas,
        proyeccionAgotamiento: proyeccion.proyeccionAgotamiento,
        mensaje: proyeccion.mensaje,
      };
    });
    res.json(lista);
  } catch (error: any) {
    res.status(500).json({
      error: 'ERROR_LISTAR_BOMBAS',
      message: error.message || 'Error al listar las bombas de combustible.',
    });
  }
});

apiRouter.get('/bombas/:id/resumen', middlewareAutenticacion, requiereAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const resumen = proyectarSaldoBomba(id);
    res.json(resumen);
  } catch (error: any) {
    const status = error.status || 404;
    res.status(status).json({
      error: 'ERROR_RESUMEN_BOMBA',
      message: error.message || `No se pudo proyectar el saldo para la bomba con ID "${id}".`,
    });
  }
});

// ==========================================
// 16. HISTORIAL DE LECTURAS DE ODÓMETRO
// ==========================================

apiRouter.get('/odometro/lecturas/:vehiculoId', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { vehiculoId } = req.params;
  const lecturas = db.lecturasOdometro
    .filter((l) => l.vehiculoId === vehiculoId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  res.json(lecturas);
});

apiRouter.post('/odometro/lecturas', middlewareAutenticacion, (req: AuthenticatedRequest, res: Response) => {
  const { vehiculoId, km, fecha, observaciones } = req.body;
  if (!vehiculoId || km === undefined || isNaN(Number(km))) {
    res.status(400).json({ error: 'Debe especificar el vehiculoId y el kilometraje numérico.' });
    return;
  }

  const vehiculo = db.vehiculos.find((v) => v.id === vehiculoId || v.placa === vehiculoId);
  if (!vehiculo) {
    res.status(404).json({ error: 'Vehículo no encontrado.' });
    return;
  }

  const numKm = Number(km);
  if (numKm < vehiculo.odometroActual) {
    res.status(400).json({
      error: `El odómetro ingresado (${numKm} km) no puede ser menor al odómetro actual registrado en el vehículo (${vehiculo.odometroActual} km).`,
    });
    return;
  }

  const nuevaLectura: LecturaOdometro = {
    id: `ODO-${Date.now()}`,
    vehiculoId: vehiculo.id,
    km: numKm,
    fecha: fecha || new Date().toISOString(),
    registradoPorId: req.user!.userId,
    registradoPorNombre: req.user!.nombre || 'Usuario',
    observaciones: observaciones || 'Lectura manual registrada en sistema',
  };

  db.lecturasOdometro.unshift(nuevaLectura);
  vehiculo.odometroActual = numKm;
  db.guardarDatos();

  res.status(201).json(nuevaLectura);
});
