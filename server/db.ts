/**
 * Capa de Base de Datos y Persistencia de la Flota (Costa Rica - Colones Costarricenses ₡ / CRC)
 * Con datos iniciales realistas para demostración y evaluación completa
 */

import {
  Usuario,
  Vehiculo,
  SolicitudAutorizacion,
  CargaCombustible,
  Mantenimiento,
  Estacion,
  SaldoEstacion,
  MovimientoSaldo,
  CajaChica,
  MovimientoCajaChica,
  ArqueoCajaChica,
  MetricasCajaChica,
  DesgloseDenominacion,
} from './types';
import { procesarMetricasCarga } from './calculos';

// Generador de imágenes muestra SVG en Base64 para facturas electrónicas y odómetros en Costa Rica
export function generarTicketSvgBase64(estacion: string, litros: number, total: number, fecha: string, folio: string): string {
  const precioUnitario = Math.round(total / (litros || 1));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520" style="background:#fdfcf7;font-family:monospace;padding:15px;">
    <rect width="370" height="490" x="15" y="15" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" rx="10" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))"/>
    <text x="200" y="55" text-anchor="middle" font-size="16" font-weight="bold" fill="#0f172a">⛽ ${estacion}</text>
    <text x="200" y="75" text-anchor="middle" font-size="11" fill="#64748b">SERVICENTRO Y DISTRIBUIDORA DE COMBUSTIBLES S.A.</text>
    <text x="200" y="92" text-anchor="middle" font-size="10" fill="#64748b">CÉDULA JURÍDICA: 3-101-492018 | AUT. MINAE/ARESEP</text>
    <line x1="35" y1="110" x2="365" y2="110" stroke="#cbd5e1" stroke-dasharray="4 4"/>
    
    <text x="45" y="135" font-size="12" fill="#334155">CLAVE NUM: <tspan font-weight="bold">${folio}</tspan></text>
    <text x="45" y="155" font-size="12" fill="#334155">FECHA: ${fecha}  14:32 hrs</text>
    <text x="45" y="175" font-size="12" fill="#334155">DISPENSADOR: 04  |  POSICIÓN: 02</text>
    
    <line x1="35" y1="195" x2="365" y2="195" stroke="#cbd5e1"/>
    <text x="45" y="218" font-size="12" font-weight="bold" fill="#0f172a">DESCRIPCIÓN</text>
    <text x="220" y="218" font-size="12" font-weight="bold" fill="#0f172a">CANT</text>
    <text x="290" y="218" font-size="12" font-weight="bold" fill="#0f172a">TOTAL</text>
    
    <text x="45" y="245" font-size="12" fill="#334155">COMBUSTIBLE RECOPE</text>
    <text x="220" y="245" font-size="12" fill="#334155">${litros.toFixed(2)} L</text>
    <text x="290" y="245" font-size="12" font-weight="bold" fill="#0f172a">₡${Math.round(total).toLocaleString('es-CR')}</text>
    
    <text x="45" y="270" font-size="11" fill="#64748b">PRECIO UNITARIO: ₡${precioUnitario.toLocaleString('es-CR')} / LITRO</text>
    <text x="45" y="288" font-size="11" fill="#64748b">IMPUESTO ÚNICO DE COMBUSTIBLES INCLUIDO</text>
    
    <line x1="35" y1="310" x2="365" y2="310" stroke="#0f172a" stroke-width="1.5"/>
    <text x="45" y="338" font-size="14" font-weight="bold" fill="#0f172a">TOTAL PAGADO:</text>
    <text x="355" y="338" text-anchor="end" font-size="17" font-weight="bold" fill="#059669">₡${Math.round(total).toLocaleString('es-CR')} CRC</text>
    
    <rect x="45" y="365" width="310" height="42" fill="#f8fafc" stroke="#e2e8f0" rx="6"/>
    <text x="200" y="386" text-anchor="middle" font-size="11" fill="#475569">MÉTODO: TARJETA FLOTA EMPRESARIAL</text>
    <text x="200" y="400" text-anchor="middle" font-size="10" fill="#64748b">AUT: 902198 | TERMINAL: BAC-04 SAN JOSÉ</text>
    
    <text x="200" y="445" text-anchor="middle" font-size="11" font-family="monospace" font-weight="bold" fill="#1c1917" letter-spacing="2">FOLIO: ${folio}</text>
    
    <text x="200" y="475" text-anchor="middle" font-size="10" fill="#a8a29e">¡MUCHAS GRACIAS POR SU PREFERENCIA!</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generarOdometroSvgBase64(odometro: number, placa: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="350" viewBox="0 0 500 350" style="background:#0f172a;font-family:sans-serif;">
    <defs>
      <radialGradient id="dial" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#1e293b"/>
        <stop offset="100%" stop-color="#020617"/>
      </radialGradient>
    </defs>
    <rect width="500" height="350" fill="#090d16" rx="12"/>
    <circle cx="250" cy="175" r="140" fill="url(#dial)" stroke="#334155" stroke-width="4"/>
    <circle cx="250" cy="175" r="110" fill="none" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="2 6"/>
    
    <!-- Velocímetro decorativo -->
    <text x="250" y="100" text-anchor="middle" font-size="12" font-weight="bold" fill="#64748b" letter-spacing="2">KILOMETRAJE TOTAL</text>
    <text x="250" y="130" text-anchor="middle" font-size="14" font-weight="bold" fill="#38bdf8">${placa}</text>
    
    <!-- Display Odómetro Digital -->
    <rect x="140" y="160" width="220" height="60" rx="8" fill="#000000" stroke="#0284c7" stroke-width="2"/>
    <text x="250" y="202" text-anchor="middle" font-size="32" font-weight="bold" fill="#22c55e" font-family="monospace" letter-spacing="3">${odometro.toLocaleString('es-CR')}</text>
    <text x="340" y="200" text-anchor="start" font-size="12" fill="#94a3b8">km</text>
    
    <!-- Indicadores del tablero -->
    <rect x="180" y="240" width="140" height="24" rx="12" fill="#1e293b"/>
    <text x="250" y="256" text-anchor="middle" font-size="11" fill="#e2e8f0">⛽ TANQUE: LLENO</text>
    
    <circle cx="160" cy="252" r="5" fill="#22c55e"/>
    <text x="250" y="310" text-anchor="middle" font-size="11" fill="#64748b">FOTO DE AUDITORÍA REGISTRADA</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

class BaseDeDatosFlota {
  public usuarios: Usuario[] = [];
  public vehiculos: Vehiculo[] = [];
  public solicitudes: SolicitudAutorizacion[] = [];
  public cargas: CargaCombustible[] = [];
  public mantenimientos: Mantenimiento[] = [];
  public estaciones: Estacion[] = [];
  public saldos: SaldoEstacion[] = [];
  public movimientosSaldo: MovimientoSaldo[] = [];
  public cajasChicas: CajaChica[] = [];
  public movimientosCajaChica: MovimientoCajaChica[] = [];
  public arqueosCajaChica: ArqueoCajaChica[] = [];

  constructor() {
    this.inicializarDatos();
  }

  public inicializarDatos() {
    // 1. Usuarios
    this.usuarios = [
      {
        id: 'usr-admin-1',
        email: 'admin@flota.com',
        nombre: 'Lic. Roberto González',
        rol: 'ADMIN',
        esAdminPrincipal: true,
        debeCambiarPassword: false,
        telefonoContacto: '+506 8876-5432',
        telefonoWhatsapp: '+506 8876-5432',
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'usr-cond-1',
        email: 'carlos.mendoza@flota.com',
        nombre: 'Carlos Mendoza',
        rol: 'CONDUCTOR',
        esAdminPrincipal: false,
        debeCambiarPassword: false,
        telefonoContacto: '+506 8345-6789',
        telefonoWhatsapp: '+506 8345-6789',
        licencia: 'LIC-CR-B2-98124',
        vehiculoAsignadoId: 'veh-serie-2',
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'usr-cond-2',
        email: 'maria.lopez@flota.com',
        nombre: 'María López',
        rol: 'CONDUCTOR',
        esAdminPrincipal: false,
        debeCambiarPassword: false,
        telefonoContacto: '+506 8765-4321',
        telefonoWhatsapp: '+506 8765-4321',
        licencia: 'LIC-CR-B1-44120',
        vehiculoAsignadoId: 'veh-serie-7',
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'usr-cond-3',
        email: 'juan.perez@flota.com',
        nombre: 'Juan Pérez',
        rol: 'CONDUCTOR',
        esAdminPrincipal: false,
        debeCambiarPassword: false,
        telefonoContacto: '+506 8944-5566',
        telefonoWhatsapp: '+506 8944-5566',
        licencia: 'LIC-CR-B3-77319',
        vehiculoAsignadoId: 'veh-serie-9',
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    // 2. Vehículos del Parque Maquinaria y Flota (Exactos según inventario operativo)
    this.vehiculos = [
      {
        id: 'veh-serie-1',
        numeroSerie: 1,
        tipoVehiculo: 'Backhoe',
        marca: 'Case',
        modelo: 'Retroexcavadora',
        placa: 'EE25804',
        anio: 2020,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 160,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 0,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: 'Por horas',
        tipoControlMedicion: 'HORAS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1579483363388-3486c9f688ca?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-2',
        numeroSerie: 2,
        tipoVehiculo: 'Vagoneta',
        marca: 'Mack',
        modelo: 'DM690S',
        placa: 'C140381',
        anio: 2018,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 280,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 3.8,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Leasing',
        imagenUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
        conductorId: 'usr-cond-1',
        conductorNombre: 'Carlos Mendoza',
        estado: 'Activo',
        ultimoMantenimientoKm: 0,
        proximoMantenimientoKm: 10000,
      },
      {
        id: 'veh-serie-3',
        numeroSerie: 3,
        tipoVehiculo: 'Hormigonera',
        marca: 'Fiori',
        modelo: 'DB460',
        placa: 'EE41417',
        anio: 2019,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 180,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 0,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: 'Por horas',
        tipoControlMedicion: 'HORAS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-4',
        numeroSerie: 4,
        tipoVehiculo: 'Moto',
        marca: 'Honda',
        modelo: 'XR150 L',
        placa: 'MT0915183',
        anio: 2022,
        tipoCombustible: 'Gasolina Regular',
        capacidadTanqueLitros: 12,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 35.0,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Préstamo',
        imagenUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-5',
        numeroSerie: 5,
        tipoVehiculo: 'Camión',
        marca: 'Isuzu',
        modelo: 'QKR55L-EE1AYVT',
        placa: 'CL285360',
        anio: 2021,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 100,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 7.5,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Leasing',
        imagenUrl: 'https://images.unsplash.com/photo-1586191582056-a602e1c94474?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-6',
        numeroSerie: 6,
        tipoVehiculo: 'Camión',
        marca: 'JMC',
        modelo: 'NHR',
        placa: 'CL311905',
        anio: 2020,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 85,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 8.2,
        ubicacion: 'Contenedor',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-7',
        numeroSerie: 7,
        tipoVehiculo: 'Buseta',
        marca: 'Nissan',
        modelo: 'Urvan',
        placa: 'CL312788',
        anio: 2019,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 65,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 10.5,
        ubicacion: 'Papagayo Diego',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Alquiler',
        imagenUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        conductorId: 'usr-cond-2',
        conductorNombre: 'María López',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-8',
        numeroSerie: 8,
        tipoVehiculo: 'Camión',
        marca: 'Jac',
        modelo: 'HFC 1042KN',
        placa: 'CL334056',
        anio: 2017,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 100,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 7.0,
        ubicacion: 'Taller',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: false,
        tipoControlMedicion: 'NO_APLICA',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1506544777-64cfbe1142df?auto=format&fit=crop&w=600&q=80',
        estado: 'En Mantenimiento',
      },
      {
        id: 'veh-serie-9',
        numeroSerie: 9,
        tipoVehiculo: 'Bus',
        marca: 'Thomas',
        modelo: 'SAFT-T-LINER',
        placa: 'CCR-694',
        anio: 2018,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 220,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 4.5,
        ubicacion: 'HE-25',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Préstamo',
        imagenUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=600&q=80',
        conductorId: 'usr-cond-3',
        conductorNombre: 'Juan Pérez',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-10',
        numeroSerie: 10,
        tipoVehiculo: 'Mini cargador',
        marca: 'Mustang',
        modelo: '2200R',
        placa: 'EE037704',
        anio: 2021,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 90,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 0,
        ubicacion: 'Zapotal',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: 'Por horas',
        tipoControlMedicion: 'HORAS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-11',
        numeroSerie: 11,
        tipoVehiculo: 'Backhoe',
        marca: 'John Deere',
        modelo: '310SJ',
        placa: 'EE28556',
        anio: 2020,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 150,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 0,
        ubicacion: 'Zapotal',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: 'Por horas',
        tipoControlMedicion: 'HORAS',
        estadoFinanciero: 'Leasing',
        imagenUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-12',
        numeroSerie: 12,
        tipoVehiculo: 'Pick up',
        marca: 'Toyota',
        modelo: 'Hilux 2.8',
        placa: 'CL 363465',
        anio: 2021,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 80,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 11.2,
        ubicacion: 'Zapotal',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-13',
        numeroSerie: 13,
        tipoVehiculo: 'Pick up',
        marca: 'Toyota',
        modelo: 'Hilux 2 RZ',
        placa: 'CL363464',
        anio: 2019,
        tipoCombustible: 'Gasolina Regular',
        capacidadTanqueLitros: 76,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 9.8,
        ubicacion: 'David',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-14',
        numeroSerie: 14,
        tipoVehiculo: 'Camion plataforma',
        marca: 'Isuzu',
        modelo: 'NPS71L-02',
        placa: 'CL 363463',
        anio: 2022,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 140,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 6.8,
        ubicacion: 'Zapotal',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Alquiler',
        imagenUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-15',
        numeroSerie: 15,
        tipoVehiculo: 'Bus',
        marca: 'Thomas',
        modelo: 'SAFT LINER',
        placa: 'ABB422',
        anio: 2017,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 220,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 4.8,
        ubicacion: 'SBE-05',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-16',
        numeroSerie: 16,
        tipoVehiculo: 'Pick up',
        marca: 'Toyota',
        modelo: 'Hilux DLX',
        placa: 'CL 365933',
        anio: 2023,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 80,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 11.5,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Leasing',
        imagenUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-17',
        numeroSerie: 17,
        tipoVehiculo: 'Camión',
        marca: 'Isuzu',
        modelo: 'NPS71L-02',
        placa: 'CL 370592',
        anio: 2022,
        tipoCombustible: 'Diesel',
        capacidadTanqueLitros: 140,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 7.0,
        ubicacion: 'Zapotal',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1586191582056-a602e1c94474?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-18',
        numeroSerie: 18,
        tipoVehiculo: 'Carro personal Mario',
        marca: 'RAM',
        modelo: '1500 Bighorn 4x4',
        placa: 'CL-RAM-701',
        anio: 2023,
        tipoCombustible: 'Gasolina Regular',
        capacidadTanqueLitros: 98,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 8.5,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
      {
        id: 'veh-serie-19',
        numeroSerie: 19,
        tipoVehiculo: 'Carro personal Fabiana',
        marca: 'Lexus',
        modelo: 'RX 450h Híbrido',
        placa: 'CL-LEX-802',
        anio: 2024,
        tipoCombustible: 'Híbrido',
        capacidadTanqueLitros: 65,
        odometroInicial: 0,
        odometroActual: 0,
        rendimientoTeoricoKmL: 16.5,
        ubicacion: 'Nosara',
        fechaLecturaInicial: '21/7/2025',
        controlaKilometraje: true,
        tipoControlMedicion: 'KILOMETROS',
        estadoFinanciero: 'Libre',
        imagenUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
        estado: 'Activo',
      },
    ];

    // 3. Solicitudes de Autorización (Inicia vacío para pruebas reales)
    this.solicitudes = [];

    // 4. Historial de Cargas de Combustible (Inicia vacío para registrar facturas y odómetros reales)
    this.cargas = [];

    // 5. Mantenimientos en Colones Costarricenses (₡)
    this.mantenimientos = [
      {
        id: 'MNT-101',
        vehiculoId: 'veh-serie-2',
        vehiculoPlaca: 'C140381',
        fecha: '2026-06-15',
        odometroKm: 0,
        tipo: 'Cambio de Aceite',
        taller: 'Taller Mack Central Guanacaste',
        descripcion: 'Servicio de cambio de aceite diésel 15W-40, filtro de aceite y filtro trampa de combustible.',
        costo: 145000.0,
        proximoMantenimientoKm: 10000,
        proximaFecha: '2026-12-15',
        registradoPor: 'Lic. Roberto González',
      },
      {
        id: 'MNT-102',
        vehiculoId: 'veh-serie-7',
        vehiculoPlaca: 'CL312788',
        fecha: '2026-07-02',
        odometroKm: 0,
        tipo: 'Frenos',
        taller: 'Frenos y Servicios Papagayo',
        descripcion: 'Cambio de pastillas y zapatas traseras, rectificación y purga de líquido DOT 4.',
        costo: 78000.0,
        proximoMantenimientoKm: 10000,
        proximaFecha: '2027-01-02',
        registradoPor: 'Lic. Roberto González',
      },
      {
        id: 'MNT-103',
        vehiculoId: 'veh-serie-8',
        vehiculoPlaca: 'CL334056',
        fecha: '2026-08-14',
        odometroKm: 0,
        tipo: 'Correctivo',
        taller: 'Taller Central de Flota',
        descripcion: 'Reparación de embrague e inspección general de suspensión en taller.',
        costo: 280000.0,
        proximoMantenimientoKm: 10000,
        proximaFecha: '2027-02-14',
        registradoPor: 'Lic. Roberto González',
      },
    ];

    // 6. Estaciones de Servicio y Servicentros Autorizados
    this.estaciones = [
      {
        id: 'est-1',
        nombre: 'Servicentro Delta Nosara',
        ubicacion: 'Nosara, Guanacaste (Carretera Principal)',
        direccion: 'Carretera principal hacia Playa Pelada, Nosara',
        moneda: 'CRC',
        cedulaJuridica: '3-101-492018',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Super'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'est-2',
        nombre: 'Bomba Costa Verde Guiones',
        ubicacion: 'Playa Guiones, Guanacaste',
        direccion: '100m Este de la entrada a Playa Guiones',
        moneda: 'CRC',
        cedulaJuridica: '3-101-582910',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'est-3',
        nombre: 'Servicentro JSM Nicoya',
        ubicacion: 'Nicoya Centro, Guanacaste',
        direccion: 'Avenida Central frente a rotonda, Nicoya',
        moneda: 'CRC',
        cedulaJuridica: '3-101-381920',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Super', 'Gas LP'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'est-4',
        nombre: 'Estación Total Samara',
        ubicacion: 'Playa Sámara, Guanacaste',
        direccion: 'Entrada principal a Playa Sámara',
        moneda: 'CRC',
        cedulaJuridica: '3-101-671294',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'est-5',
        nombre: 'Servicentro Delta Santa Cruz',
        ubicacion: 'Santa Cruz, Guanacaste',
        direccion: 'Carretera Interamericana Norte, Santa Cruz',
        moneda: 'CRC',
        cedulaJuridica: '3-101-209184',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Super'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'est-6',
        nombre: 'Estación de Servicios Sardinal S.A.',
        ubicacion: 'Entrada a Sardinal 300 m. Carretera a Playas del Coco, Carrillo, Guanacaste',
        direccion: 'Entrada a Sardinal 300 m.',
        moneda: 'CRC',
        cedulaJuridica: '3-101-344734',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Super'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
      {
        id: 'est-7',
        nombre: 'Servicentro Nosara S.A.',
        ubicacion: 'Costado del Banco de Costa Rica, Nosara, Nicoya, Guanacaste',
        direccion: 'Costado BCR Nosara',
        moneda: 'CRC',
        cedulaJuridica: '3-101-548680',
        combustiblesDisponibles: ['Diesel', 'Gasolina Regular', 'Gasolina Super'],
        activo: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      },
    ];

    // 7. Saldos Prepago por Estación (Un saldo monetario único por estación)
    this.saldos = [
      {
        id: 'saldo-1',
        estacionId: 'est-1',
        estacionNombre: 'Servicentro Delta Nosara',
        saldoActual: 695000.0,
        moneda: 'CRC',
        umbralAlerta: 120000.0,
        activo: true,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-22T14:15:00.000Z',
      },
      {
        id: 'saldo-2',
        estacionId: 'est-2',
        estacionNombre: 'Bomba Costa Verde Guiones',
        saldoActual: 620000.0,
        moneda: 'CRC',
        umbralAlerta: 100000.0,
        activo: true,
        createdAt: '2026-08-05T09:00:00.000Z',
        updatedAt: '2026-08-19T11:00:00.000Z',
      },
      {
        id: 'saldo-3',
        estacionId: 'est-3',
        estacionNombre: 'Servicentro JSM Nicoya',
        saldoActual: 550000.0,
        moneda: 'CRC',
        umbralAlerta: 100000.0,
        activo: true,
        createdAt: '2026-08-01T08:30:00.000Z',
        updatedAt: '2026-08-15T09:45:00.000Z',
      },
      {
        id: 'saldo-4',
        estacionId: 'est-4',
        estacionNombre: 'Estación Total Samara',
        saldoActual: 30000.0, // Alerta: menor al umbral de 60,000
        moneda: 'CRC',
        umbralAlerta: 60000.0,
        activo: true,
        createdAt: '2026-08-02T10:00:00.000Z',
        updatedAt: '2026-08-21T08:20:00.000Z',
      },
      {
        id: 'saldo-5',
        estacionId: 'est-5',
        estacionNombre: 'Servicentro Delta Santa Cruz',
        saldoActual: 420000.0,
        moneda: 'CRC',
        umbralAlerta: 80000.0,
        activo: true,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
      {
        id: 'saldo-6',
        estacionId: 'est-6',
        estacionNombre: 'Estación de Servicios Sardinal S.A.',
        saldoActual: 850000.0,
        moneda: 'CRC',
        umbralAlerta: 150000.0,
        activo: true,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-24T16:00:00.000Z',
      },
      {
        id: 'saldo-7',
        estacionId: 'est-7',
        estacionNombre: 'Servicentro Nosara S.A.',
        saldoActual: 720000.0,
        moneda: 'CRC',
        umbralAlerta: 120000.0,
        activo: true,
        createdAt: '2026-08-01T08:00:00.000Z',
        updatedAt: '2026-08-24T16:00:00.000Z',
      },
    ];

    // 8. Historial de Movimientos de Saldo (Depósitos, Descuentos y Ajustes con Bitácora)
    this.movimientosSaldo = [
      {
        id: 'mov-1',
        saldoId: 'saldo-1',
        estacionNombre: 'Servicentro Delta Nosara',
        tipo: 'carga_inicial',
        monto: 500000.0,
        saldoAnterior: 0,
        saldoNuevo: 500000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-01T08:00:00.000Z',
        fechaDeposito: '2026-08-01',
        notas: 'Fondo de apertura de mes',
        comprobanteReferencia: 'TRANSF-BAC-88129',
      },
      {
        id: 'mov-2',
        saldoId: 'saldo-1',
        estacionNombre: 'Servicentro Delta Nosara',
        tipo: 'deposito',
        monto: 300000.0,
        saldoAnterior: 500000.0,
        saldoNuevo: 800000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-15T14:20:00.000Z',
        fechaDeposito: '2026-08-15',
        notas: 'Recarga quincenal tarjeta de flota',
        comprobanteReferencia: 'DEP-BCR-99412',
      },
      {
        id: 'mov-3',
        saldoId: 'saldo-1',
        estacionNombre: 'Servicentro Delta Nosara',
        tipoCombustible: 'Gasolina Regular',
        tipo: 'descuento',
        monto: -105000.0,
        saldoAnterior: 800000.0,
        saldoNuevo: 695000.0,
        registroCombustibleId: 'CRG-200001',
        vehiculoPlaca: 'SJZ-451',
        numeroTicket: 'TKT-884210',
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-22T14:15:00.000Z',
        fechaDeposito: '2026-08-22',
        notas: 'Consumos acumulados semana 3 - Gasolina Regular',
        comprobanteReferencia: 'CORTE-SEM-03',
      },
      {
        id: 'mov-4',
        saldoId: 'saldo-2',
        estacionNombre: 'Bomba Costa Verde Guiones',
        tipo: 'carga_inicial',
        monto: 400000.0,
        saldoAnterior: 0,
        saldoNuevo: 400000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-05T09:00:00.000Z',
        fechaDeposito: '2026-08-05',
        notas: 'Depósito operativo para vagonetas y maquinaria',
        comprobanteReferencia: 'TRANSF-BN-44102',
      },
      {
        id: 'mov-5',
        saldoId: 'saldo-2',
        estacionNombre: 'Bomba Costa Verde Guiones',
        tipo: 'deposito',
        monto: 220000.0,
        saldoAnterior: 400000.0,
        saldoNuevo: 620000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-10T09:00:00.000Z',
        fechaDeposito: '2026-08-10',
        notas: 'Depósito regular Guiones',
        comprobanteReferencia: 'TRANSF-BN-44103',
      },
      {
        id: 'mov-6',
        saldoId: 'saldo-3',
        estacionNombre: 'Servicentro JSM Nicoya',
        tipo: 'deposito',
        monto: 550000.0,
        saldoAnterior: 0,
        saldoNuevo: 550000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-01T08:30:00.000Z',
        fechaDeposito: '2026-08-01',
        notas: 'Convenio corporativo JSM',
        comprobanteReferencia: 'TRANSF-BAC-88135',
      },
      {
        id: 'mov-7',
        saldoId: 'saldo-4',
        estacionNombre: 'Estación Total Samara',
        tipo: 'deposito',
        monto: 150000.0,
        saldoAnterior: 0,
        saldoNuevo: 150000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-02T10:00:00.000Z',
        fechaDeposito: '2026-08-02',
        notas: 'Depósito ruta Samara',
        comprobanteReferencia: 'DEP-BCR-99420',
      },
      {
        id: 'mov-8',
        saldoId: 'saldo-4',
        estacionNombre: 'Estación Total Samara',
        tipoCombustible: 'Diesel',
        tipo: 'descuento',
        monto: -120000.0,
        saldoAnterior: 150000.0,
        saldoNuevo: 30000.0,
        registroCombustibleId: 'CRG-200002',
        vehiculoPlaca: 'B-77291',
        numeroTicket: 'TKT-991044',
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-21T08:20:00.000Z',
        fechaDeposito: '2026-08-21',
        notas: 'Consumo busetas y camiones Samara (Diesel)',
        comprobanteReferencia: 'FACT-CONSOLIDADA-SAMARA',
      },
      {
        id: 'mov-9',
        saldoId: 'saldo-5',
        estacionNombre: 'Servicentro Delta Santa Cruz',
        tipo: 'deposito',
        monto: 420000.0,
        saldoAnterior: 0,
        saldoNuevo: 420000.0,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Lic. Roberto González',
        fecha: '2026-08-01T08:00:00.000Z',
        fechaDeposito: '2026-08-01',
        notas: 'Depósito inicial para ruta Santa Cruz',
        comprobanteReferencia: 'TRANSF-BAC-88155',
      },
    ];

    // 9. Cajas Chicas de Combustibles (Fondos Fijos para Emergencias y Despachos en Efectivo)
    this.cajasChicas = [
      {
        id: 'cch-1',
        codigo: 'CCH-01',
        nombre: 'Caja Chica Principal - Despacho Flota',
        custodioId: 'usr-admin-1',
        custodioNombre: 'Lic. Roberto González',
        custodioTelefono: '+506 8876-5432',
        montoFondoFijo: 350000.0,
        saldoEfectivoActual: 215000.0,
        saldoComprobantesPendientes: 135000.0,
        umbralReposicion: 90000.0,
        moneda: 'CRC',
        ubicacion: 'Oficinas Centrales - San José',
        estado: 'ABIERTA',
        fechaApertura: '2026-08-01T08:00:00.000Z',
        fechaUltimoArqueo: '2026-08-20T16:30:00.000Z',
        observaciones: 'Fondo fijo para compras directas de combustible, vales provisionales a conductores y contingencias.',
        activo: true,
        createdAt: '2026-08-01T08:00:00.000Z',
      },
      {
        id: 'cch-2',
        codigo: 'CCH-02',
        nombre: 'Caja Chica Base Nosara / Guanacaste',
        custodioId: 'usr-admin-1',
        custodioNombre: 'Lic. Roberto González',
        custodioTelefono: '+506 8876-5432',
        montoFondoFijo: 250000.0,
        saldoEfectivoActual: 185000.0,
        saldoComprobantesPendientes: 65000.0,
        umbralReposicion: 75000.0,
        moneda: 'CRC',
        ubicacion: 'Plantel Operativo Nosara',
        estado: 'ABIERTA',
        fechaApertura: '2026-08-01T08:30:00.000Z',
        fechaUltimoArqueo: '2026-08-22T17:00:00.000Z',
        observaciones: 'Fondo de soporte para maquinaria y vehículos de ruta Pacífico Norte.',
        activo: true,
        createdAt: '2026-08-01T08:30:00.000Z',
      },
      {
        id: 'cch-3',
        codigo: 'CCH-03',
        nombre: 'Fondo Fijo Emergencias Ruta Atlántico',
        custodioId: 'usr-admin-1',
        custodioNombre: 'Lic. Roberto González',
        custodioTelefono: '+506 8876-5432',
        montoFondoFijo: 150000.0,
        saldoEfectivoActual: 45000.0, // En alerta de reposición
        saldoComprobantesPendientes: 105000.0,
        umbralReposicion: 50000.0,
        moneda: 'CRC',
        ubicacion: 'Base Operativa Limón / Guápiles',
        estado: 'EN_REPOSICION',
        fechaApertura: '2026-08-05T09:00:00.000Z',
        fechaUltimoArqueo: '2026-08-24T10:00:00.000Z',
        observaciones: 'Fondo para contingencias de combustible en la Ruta 32.',
        activo: true,
        createdAt: '2026-08-05T09:00:00.000Z',
      },
    ];

    // 10. Movimientos de Caja Chica
    this.movimientosCajaChica = [
      {
        id: 'mov-cch-1',
        cajaChicaId: 'cch-1',
        cajaChicaNombre: 'Caja Chica Principal - Despacho Flota',
        tipo: 'APERTURA',
        monto: 350000.0,
        saldoEfectivoAnterior: 0,
        saldoEfectivoNuevo: 350000.0,
        fecha: '2026-08-01T08:00:00.000Z',
        fechaDocumento: '2026-08-01',
        concepto: 'Dotación y apertura inicial de fondo fijo de caja chica',
        estado: 'COMPLETADO',
        registradoPorId: 'usr-admin-1',
        registradoPorNombre: 'Lic. Roberto González',
        comprobanteReferencia: 'CHQ-BAC-10492',
      },
      {
        id: 'mov-cch-2',
        cajaChicaId: 'cch-1',
        cajaChicaNombre: 'Caja Chica Principal - Despacho Flota',
        tipo: 'EGRESO_COMBUSTIBLE',
        monto: 45000.0,
        saldoEfectivoAnterior: 350000.0,
        saldoEfectivoNuevo: 305000.0,
        fecha: '2026-08-08T11:20:00.000Z',
        fechaDocumento: '2026-08-08',
        numeroFactura: 'FAC-NOSARA-98214',
        vehiculoId: 'veh-serie-2',
        vehiculoPlaca: 'C140381',
        conductorId: 'usr-cond-1',
        conductorNombre: 'Carlos Mora Solano',
        estacionServicio: 'Servicentro Delta Nosara',
        tipoCombustible: 'Diesel',
        litros: 68.5,
        precioPorLitro: 657,
        odometro: 145200,
        concepto: 'Compra de diésel para cabezal Mack C140381 en ruta',
        motivo: 'Carga de emergencia por retraso en despacho con tarjeta',
        estado: 'COMPLETADO',
        registradoPorId: 'usr-admin-1',
        registradoPorNombre: 'Lic. Roberto González',
      },
      {
        id: 'mov-cch-3',
        cajaChicaId: 'cch-1',
        cajaChicaNombre: 'Caja Chica Principal - Despacho Flota',
        tipo: 'VALE_PROVISIONAL',
        monto: 50000.0,
        saldoEfectivoAnterior: 305000.0,
        saldoEfectivoNuevo: 255000.0,
        fecha: '2026-08-14T07:45:00.000Z',
        fechaDocumento: '2026-08-14',
        numeroVale: 'VALE-2026-001',
        vehiculoId: 'veh-serie-1',
        vehiculoPlaca: 'CL291880',
        conductorId: 'usr-cond-2',
        conductorNombre: 'Juan Pérez Jiménez',
        concepto: 'Adelanto en efectivo para combustible de ruta especial San José - Nicoya',
        motivo: 'Despacho de fin de semana fuera de zona con cobertura de tarjeta',
        estado: 'COMPLETADO',
        registradoPorId: 'usr-admin-1',
        registradoPorNombre: 'Lic. Roberto González',
      },
      {
        id: 'mov-cch-4',
        cajaChicaId: 'cch-1',
        cajaChicaNombre: 'Caja Chica Principal - Despacho Flota',
        tipo: 'LIQUIDACION_VALE',
        monto: 40000.0, // Gasto real
        vueltoDevuelto: 10000.0, // Vuelto reingresado a caja
        saldoEfectivoAnterior: 255000.0,
        saldoEfectivoNuevo: 265000.0, // Reingresó 10k vuelto
        fecha: '2026-08-16T15:30:00.000Z',
        fechaDocumento: '2026-08-16',
        numeroVale: 'VALE-2026-001',
        numeroFactura: 'FAC-JSM-48201',
        vehiculoId: 'veh-serie-1',
        vehiculoPlaca: 'CL291880',
        conductorId: 'usr-cond-2',
        conductorNombre: 'Juan Pérez Jiménez',
        estacionServicio: 'Servicentro JSM Nicoya',
        tipoCombustible: 'Diesel',
        litros: 60.88,
        precioPorLitro: 657,
        odometro: 120500,
        concepto: 'Liquidación de vale provisional VALE-2026-001 con factura (Vuelto reingresado: ₡10,000)',
        estado: 'COMPLETADO',
        registradoPorId: 'usr-admin-1',
        registradoPorNombre: 'Lic. Roberto González',
      },
      {
        id: 'mov-cch-5',
        cajaChicaId: 'cch-1',
        cajaChicaNombre: 'Caja Chica Principal - Despacho Flota',
        tipo: 'VALE_PROVISIONAL',
        monto: 50000.0,
        saldoEfectivoAnterior: 265000.0,
        saldoEfectivoNuevo: 215000.0,
        fecha: '2026-08-25T08:15:00.000Z',
        fechaDocumento: '2026-08-25',
        numeroVale: 'VALE-2026-002',
        vehiculoId: 'veh-serie-7',
        vehiculoPlaca: 'CL312788',
        conductorId: 'usr-cond-1',
        conductorNombre: 'Carlos Mora Solano',
        concepto: 'Vale provisional para carga diésel vagoneta CL312788 en ruta Guanacaste',
        motivo: 'Abastecimiento en estación no afiliada a convenio',
        estado: 'PENDIENTE_LIQUIDACION',
        registradoPorId: 'usr-admin-1',
        registradoPorNombre: 'Lic. Roberto González',
      },
    ];

    // 11. Arqueos de Caja Chica
    this.arqueosCajaChica = [
      {
        id: 'arq-1',
        cajaChicaId: 'cch-1',
        cajaChicaNombre: 'Caja Chica Principal - Despacho Flota',
        fechaArqueo: '2026-08-20T16:30:00.000Z',
        auditorId: 'usr-admin-1',
        auditorNombre: 'Lic. Roberto González',
        custodioNombre: 'Lic. Roberto González',
        fondoFijoTotal: 350000.0,
        efectivoContado: 265000.0,
        comprobantesMonto: 85000.0,
        valesPendientesMonto: 0,
        totalAuditado: 350000.0,
        diferencia: 0,
        resultado: 'CUADRE_EXACTO',
        desgloseBilletesMonedas: [
          { denominacion: 20000, cantidad: 8, subtotal: 160000 },
          { denominacion: 10000, cantidad: 6, subtotal: 60000 },
          { denominacion: 5000, cantidad: 6, subtotal: 30000 },
          { denominacion: 2000, cantidad: 5, subtotal: 10000 },
          { denominacion: 1000, cantidad: 4, subtotal: 4000 },
          { denominacion: 500, cantidad: 2, subtotal: 1000 },
        ],
        observaciones: 'Arqueo quincenal ordinario satisfactorio. Todos los comprobantes cuentan con firma y timbres correspondientes.',
        estado: 'APROBADO',
      },
    ];
  }

  // ==========================================
  // Métodos de Gestión de Saldos y Movimientos
  // ==========================================

  public normalizarTexto(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  public buscarSaldoPorEstacion(estacionNombre: string, estacionId?: string): SaldoEstacion | undefined {
    if (estacionId) {
      const saldoPorId = this.saldos.find((s) => s.estacionId === estacionId || s.id === estacionId);
      if (saldoPorId) return saldoPorId;
    }

    const estNorm = this.normalizarTexto(estacionNombre);
    if (!estNorm) return this.saldos[0];

    // Coincidencia exacta o parcial por nombre de estación
    let saldo = this.saldos.find((s) => {
      const sEstNorm = this.normalizarTexto(s.estacionNombre);
      return sEstNorm === estNorm || sEstNorm.includes(estNorm) || estNorm.includes(sEstNorm);
    });

    if (saldo) return saldo;

    // Fallback: Primer saldo activo
    return this.saldos.find((s) => s.activo) || this.saldos[0];
  }

  public buscarSaldoPorEstacionYCombustible(estacionNombre: string, tipoCombustible?: string): SaldoEstacion | undefined {
    return this.buscarSaldoPorEstacion(estacionNombre);
  }

  public verificarSaldoSuficiente(saldoId: string, monto: number): {
    suficiente: boolean;
    saldoActual: number;
    faltante: number;
    saldo?: SaldoEstacion;
  } {
    const saldo = this.saldos.find((s) => s.id === saldoId);
    if (!saldo) {
      return { suficiente: false, saldoActual: 0, faltante: monto };
    }

    const suficiente = saldo.saldoActual >= monto;
    const faltante = suficiente ? 0 : Number((monto - saldo.saldoActual).toFixed(2));

    return {
      suficiente,
      saldoActual: saldo.saldoActual,
      faltante,
      saldo,
    };
  }

  public registrarDeposito(params: {
    saldoId: string;
    monto: number;
    fechaDeposito?: string;
    usuarioId: string;
    usuarioNombre: string;
    notas?: string;
    comprobanteReferencia?: string;
  }): { saldo: SaldoEstacion; movimiento: MovimientoSaldo } {
    const saldo = this.saldos.find((s) => s.id === params.saldoId);
    if (!saldo) {
      throw new Error('Saldo por estación no encontrado.');
    }

    const montoNum = Number(params.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      throw new Error('El monto del depósito debe ser un valor positivo mayor a cero.');
    }

    const saldoAnterior = saldo.saldoActual;
    const saldoNuevo = Number((saldoAnterior + montoNum).toFixed(2));
    const nowIso = new Date().toISOString();

    saldo.saldoActual = saldoNuevo;
    saldo.updatedAt = nowIso;

    const nuevoMovimiento: MovimientoSaldo = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      saldoId: saldo.id,
      estacionNombre: saldo.estacionNombre,
      tipoCombustible: saldo.tipoCombustible,
      tipo: 'deposito',
      monto: montoNum,
      saldoAnterior,
      saldoNuevo,
      usuarioId: params.usuarioId,
      usuarioNombre: params.usuarioNombre,
      fecha: nowIso,
      fechaDeposito: params.fechaDeposito || nowIso.split('T')[0],
      notas: params.notas || 'Depósito de saldo prepago',
      comprobanteReferencia: params.comprobanteReferencia,
    };

    this.movimientosSaldo.unshift(nuevoMovimiento);

    return { saldo, movimiento: nuevoMovimiento };
  }

  public ajustarSaldo(params: {
    saldoId: string;
    nuevoSaldo: number;
    usuarioId: string;
    usuarioNombre: string;
    notas: string;
  }): { saldo: SaldoEstacion; movimiento: MovimientoSaldo } {
    const saldo = this.saldos.find((s) => s.id === params.saldoId);
    if (!saldo) {
      throw new Error('Saldo por estación no encontrado.');
    }

    const nuevoSaldoNum = Number(params.nuevoSaldo);
    if (isNaN(nuevoSaldoNum) || nuevoSaldoNum < 0) {
      throw new Error('El nuevo saldo debe ser un número igual o mayor a cero.');
    }

    const saldoAnterior = saldo.saldoActual;
    const delta = Number((nuevoSaldoNum - saldoAnterior).toFixed(2));
    const nowIso = new Date().toISOString();

    saldo.saldoActual = nuevoSaldoNum;
    saldo.updatedAt = nowIso;

    const nuevoMovimiento: MovimientoSaldo = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      saldoId: saldo.id,
      estacionNombre: saldo.estacionNombre,
      tipoCombustible: saldo.tipoCombustible,
      tipo: 'ajuste',
      monto: delta,
      saldoAnterior,
      saldoNuevo: nuevoSaldoNum,
      usuarioId: params.usuarioId,
      usuarioNombre: params.usuarioNombre,
      fecha: nowIso,
      fechaDeposito: nowIso.split('T')[0],
      notas: params.notas || 'Ajuste manual de saldo realizado por administración',
    };

    this.movimientosSaldo.unshift(nuevoMovimiento);

    return { saldo, movimiento: nuevoMovimiento };
  }

  public descontarSaldo(params: {
    saldoId: string;
    monto: number;
    registroCombustibleId: string;
    tipoCombustible?: string;
    vehiculoPlaca?: string;
    numeroTicket?: string;
    usuarioId: string;
    usuarioNombre: string;
    notas?: string;
  }): { exito: boolean; saldo?: SaldoEstacion; movimiento?: MovimientoSaldo; error?: string; saldoActual?: number; faltante?: number } {
    const saldo = this.saldos.find((s) => s.id === params.saldoId);
    if (!saldo) {
      return { exito: false, error: 'Estación / saldo no encontrado.' };
    }

    const montoNum = Number(params.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return { exito: false, error: 'Monto inválido a descontar.' };
    }

    if (saldo.saldoActual < montoNum) {
      const faltante = Number((montoNum - saldo.saldoActual).toFixed(2));
      return {
        exito: false,
        error: `Saldo insuficiente. Saldo disponible: ₡${saldo.saldoActual.toLocaleString('es-CR')}, Faltante: ₡${faltante.toLocaleString('es-CR')}`,
        saldoActual: saldo.saldoActual,
        faltante,
      };
    }

    // Transacción atómica
    const saldoAnterior = saldo.saldoActual;
    const saldoNuevo = Number((saldoAnterior - montoNum).toFixed(2));
    const nowIso = new Date().toISOString();

    saldo.saldoActual = saldoNuevo;
    saldo.updatedAt = nowIso;

    const movimiento: MovimientoSaldo = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      saldoId: saldo.id,
      estacionNombre: saldo.estacionNombre,
      tipoCombustible: params.tipoCombustible || saldo.tipoCombustible,
      tipo: 'descuento',
      monto: -montoNum, // Negativo para descuentos
      saldoAnterior,
      saldoNuevo,
      registroCombustibleId: params.registroCombustibleId,
      vehiculoPlaca: params.vehiculoPlaca,
      numeroTicket: params.numeroTicket,
      usuarioId: params.usuarioId,
      usuarioNombre: params.usuarioNombre,
      fecha: nowIso,
      fechaDeposito: nowIso.split('T')[0],
      notas: params.notas || `Descuento automático por validación de carga #${params.numeroTicket || params.registroCombustibleId} (${params.vehiculoPlaca || 'Flota'})`,
    };

    this.movimientosSaldo.unshift(movimiento);

    return { exito: true, saldo, movimiento };
  }

  public obtenerSaldosConDetalle(): SaldoEstacion[] {
    return this.saldos.map((s) => {
      const movs = this.movimientosSaldo.filter((m) => m.saldoId === s.id);
      const totalDepositado = movs
        .filter((m) => m.tipo === 'deposito' || m.tipo === 'carga_inicial' || (m.tipo === 'ajuste' && m.monto > 0))
        .reduce((acc, m) => acc + Math.max(0, m.monto), 0);
      const totalDescontado = movs
        .filter((m) => m.tipo === 'descuento' || (m.tipo === 'ajuste' && m.monto < 0))
        .reduce((acc, m) => acc + Math.abs(Math.min(0, m.monto)), 0);
      const ultimoMov = movs[0];

      return {
        ...s,
        enAlerta: s.saldoActual <= s.umbralAlerta,
        totalDepositado,
        totalDescontado,
        ultimoMovimientoFecha: ultimoMov?.fecha,
        movimientosCount: movs.length,
      };
    });
  }

  // ==========================================
  // Métodos de Gestión Administrativa y Control
  // ==========================================

  public verificarDependenciasUsuario(usuarioId: string): {
    puedeEliminar: boolean;
    motivo?: string;
    conteoRegistros: number;
    conteoValidaciones: number;
    conteoMovimientos: number;
    conteoAprobaciones: number;
  } {
    const usuario = this.usuarios.find((u) => u.id === usuarioId);
    if (!usuario) {
      return { puedeEliminar: false, motivo: 'Usuario no encontrado.', conteoRegistros: 0, conteoValidaciones: 0, conteoMovimientos: 0, conteoAprobaciones: 0 };
    }

    const cargasRegistradas = this.cargas.filter((c) => c.conductorId === usuarioId).length;
    const cargasValidadas = this.cargas.filter((c) => c.validadoPor === usuario.nombre || c.validadoPor === usuario.email).length;
    const solicitudesConductor = this.solicitudes.filter((s) => s.conductorId === usuarioId).length;
    const solicitudesAprobadas = this.solicitudes.filter((s) => s.aprobadoPor === usuario.nombre || s.aprobadoPor === usuario.email).length;
    const movimientosSaldo = this.movimientosSaldo.filter((m) => m.usuarioId === usuarioId).length;

    const totalActividad = cargasRegistradas + cargasValidadas + solicitudesConductor + solicitudesAprobadas + movimientosSaldo;

    if (totalActividad > 0) {
      const motivos: string[] = [];
      if (cargasRegistradas > 0) motivos.push(`${cargasRegistradas} registro(s) de combustible`);
      if (cargasValidadas > 0) motivos.push(`${cargasValidadas} validación(es) realizada(s)`);
      if (solicitudesConductor > 0) motivos.push(`${solicitudesConductor} solicitud(es) de autorización`);
      if (solicitudesAprobadas > 0) motivos.push(`${solicitudesAprobadas} autorización(es) aprobada(s)`);
      if (movimientosSaldo > 0) motivos.push(`${movimientosSaldo} movimiento(s) de saldo`);

      return {
        puedeEliminar: false,
        motivo: `No se puede eliminar porque tiene historial operativo asociado: ${motivos.join(', ')}. En su lugar, el usuario debe ser suspendido o desactivado para mantener la trazabilidad.`,
        conteoRegistros: cargasRegistradas + solicitudesConductor,
        conteoValidaciones: cargasValidadas,
        conteoMovimientos: movimientosSaldo,
        conteoAprobaciones: solicitudesAprobadas,
      };
    }

    return {
      puedeEliminar: true,
      conteoRegistros: 0,
      conteoValidaciones: 0,
      conteoMovimientos: 0,
      conteoAprobaciones: 0,
    };
  }

  public crearAdmin(params: {
    nombre: string;
    email: string;
    telefonoContacto?: string;
    telefonoWhatsapp?: string;
    tempPassword?: string;
    activo?: boolean;
  }): Usuario {
    const emailNorm = params.email.trim().toLowerCase();
    if (!emailNorm) throw new Error('El correo electrónico es requerido.');
    if (!params.nombre.trim()) throw new Error('El nombre completo es requerido.');

    const existe = this.usuarios.find((u) => u.email.toLowerCase() === emailNorm);
    if (existe) {
      throw new Error(`El correo ${emailNorm} ya se encuentra registrado en el sistema.`);
    }

    const nuevoAdmin: Usuario = {
      id: `usr-admin-${Date.now()}`,
      nombre: params.nombre.trim(),
      email: emailNorm,
      rol: 'ADMIN',
      esAdminPrincipal: false,
      debeCambiarPassword: true,
      tempPassword: params.tempPassword || 'FlotaAdmin2026!',
      telefonoContacto: params.telefonoContacto || '+506 2000-0000',
      telefonoWhatsapp: params.telefonoWhatsapp || params.telefonoContacto || '+506 2000-0000',
      activo: params.activo !== undefined ? params.activo : true,
      createdAt: new Date().toISOString(),
    };

    this.usuarios.push(nuevoAdmin);
    return nuevoAdmin;
  }

  public editarAdmin(
    id: string,
    params: {
      nombre?: string;
      email?: string;
      telefonoContacto?: string;
      telefonoWhatsapp?: string;
      activo?: boolean;
    },
    adminSolicitanteId: string
  ): Usuario {
    const admin = this.usuarios.find((u) => u.id === id && u.rol === 'ADMIN');
    if (!admin) throw new Error('Administrador no encontrado.');

    if (params.email) {
      const emailNorm = params.email.trim().toLowerCase();
      const existeOtro = this.usuarios.find((u) => u.email.toLowerCase() === emailNorm && u.id !== id);
      if (existeOtro) throw new Error(`El correo ${emailNorm} ya está siendo utilizado por otro usuario.`);
      admin.email = emailNorm;
    }

    if (params.nombre) admin.nombre = params.nombre.trim();
    if (params.telefonoContacto !== undefined) admin.telefonoContacto = params.telefonoContacto;
    if (params.telefonoWhatsapp !== undefined) admin.telefonoWhatsapp = params.telefonoWhatsapp;

    if (params.activo !== undefined) {
      if (admin.esAdminPrincipal && !params.activo) {
        throw new Error('El Administrador Principal del sistema no puede ser desactivado.');
      }
      if (admin.id === adminSolicitanteId && !params.activo) {
        throw new Error('No puedes desactivar tu propia cuenta de administrador.');
      }
      admin.activo = params.activo;
    }

    return admin;
  }

  public eliminarAdmin(id: string, adminSolicitanteId: string): { exito: boolean; mensaje: string; usuarioDesactivado?: Usuario } {
    const admin = this.usuarios.find((u) => u.id === id && u.rol === 'ADMIN');
    if (!admin) throw new Error('Administrador no encontrado.');

    if (admin.esAdminPrincipal) {
      throw new Error('El Administrador Principal del sistema no puede ser eliminado.');
    }

    if (admin.id === adminSolicitanteId) {
      throw new Error('No puedes eliminar tu propia cuenta de administrador.');
    }

    const check = this.verificarDependenciasUsuario(id);
    if (!check.puedeEliminar) {
      // Si tiene historial, se desactiva automáticamente para proteger la integridad de datos
      admin.activo = false;
      return {
        exito: false,
        mensaje: `${check.motivo} La cuenta ha sido desactivada automáticamente.`,
        usuarioDesactivado: admin,
      };
    }

    this.usuarios = this.usuarios.filter((u) => u.id !== id);
    return { exito: true, mensaje: 'Administrador eliminado exitosamente del sistema.' };
  }

  public crearConductor(params: {
    nombre: string;
    email: string;
    telefonoContacto?: string;
    telefonoWhatsapp?: string;
    licencia?: string;
    vehiculoAsignadoId?: string;
    tempPassword?: string;
    activo?: boolean;
  }): Usuario {
    const emailNorm = params.email.trim().toLowerCase();
    if (!emailNorm) throw new Error('El correo electrónico es requerido.');
    if (!params.nombre.trim()) throw new Error('El nombre completo es requerido.');

    const existe = this.usuarios.find((u) => u.email.toLowerCase() === emailNorm);
    if (existe) {
      throw new Error(`El correo ${emailNorm} ya está en uso.`);
    }

    const nuevoConductor: Usuario = {
      id: `usr-cond-${Date.now()}`,
      nombre: params.nombre.trim(),
      email: emailNorm,
      rol: 'CONDUCTOR',
      esAdminPrincipal: false,
      debeCambiarPassword: true,
      tempPassword: params.tempPassword || 'Conductor2026!',
      telefonoContacto: params.telefonoContacto || '+506 8000-0000',
      telefonoWhatsapp: params.telefonoWhatsapp || params.telefonoContacto || '+506 8000-0000',
      licencia: params.licencia,
      vehiculoAsignadoId: params.vehiculoAsignadoId || undefined,
      activo: params.activo !== undefined ? params.activo : true,
      createdAt: new Date().toISOString(),
    };

    // Si se asignó un vehículo, vincularlo bidireccionalmente
    if (params.vehiculoAsignadoId) {
      const veh = this.vehiculos.find((v) => v.id === params.vehiculoAsignadoId);
      if (veh) {
        veh.conductorId = nuevoConductor.id;
        veh.conductorNombre = nuevoConductor.nombre;
      }
    }

    this.usuarios.push(nuevoConductor);
    return nuevoConductor;
  }

  public editarConductor(
    id: string,
    params: {
      nombre?: string;
      email?: string;
      telefonoContacto?: string;
      telefonoWhatsapp?: string;
      licencia?: string;
      vehiculoAsignadoId?: string;
      activo?: boolean;
    }
  ): Usuario {
    const cond = this.usuarios.find((u) => u.id === id && u.rol === 'CONDUCTOR');
    if (!cond) throw new Error('Conductor no encontrado.');

    if (params.email) {
      const emailNorm = params.email.trim().toLowerCase();
      const existeOtro = this.usuarios.find((u) => u.email.toLowerCase() === emailNorm && u.id !== id);
      if (existeOtro) throw new Error(`El correo ${emailNorm} ya está registrado.`);
      cond.email = emailNorm;
    }

    if (params.nombre) cond.nombre = params.nombre.trim();
    if (params.telefonoContacto !== undefined) cond.telefonoContacto = params.telefonoContacto;
    if (params.telefonoWhatsapp !== undefined) cond.telefonoWhatsapp = params.telefonoWhatsapp;
    if (params.licencia !== undefined) cond.licencia = params.licencia;
    if (params.activo !== undefined) cond.activo = params.activo;

    // Actualización de asignación de vehículo
    if (params.vehiculoAsignadoId !== undefined) {
      const oldVehId = cond.vehiculoAsignadoId;
      if (oldVehId && oldVehId !== params.vehiculoAsignadoId) {
        const oldVeh = this.vehiculos.find((v) => v.id === oldVehId);
        if (oldVeh && oldVeh.conductorId === cond.id) {
          oldVeh.conductorId = undefined;
          oldVeh.conductorNombre = undefined;
        }
      }

      cond.vehiculoAsignadoId = params.vehiculoAsignadoId || undefined;

      if (params.vehiculoAsignadoId) {
        const newVeh = this.vehiculos.find((v) => v.id === params.vehiculoAsignadoId);
        if (newVeh) {
          newVeh.conductorId = cond.id;
          newVeh.conductorNombre = cond.nombre;
        }
      }
    }

    return cond;
  }

  public suspenderConductor(id: string, motivo?: string): Usuario {
    const cond = this.usuarios.find((u) => u.id === id && u.rol === 'CONDUCTOR');
    if (!cond) throw new Error('Conductor no encontrado.');

    cond.activo = false;
    return cond;
  }

  public eliminarConductor(id: string): { exito: boolean; mensaje: string; conductorSuspendido?: Usuario } {
    const cond = this.usuarios.find((u) => u.id === id && u.rol === 'CONDUCTOR');
    if (!cond) throw new Error('Conductor no encontrado.');

    const check = this.verificarDependenciasUsuario(id);
    if (!check.puedeEliminar) {
      cond.activo = false;
      return {
        exito: false,
        mensaje: `${check.motivo} El conductor ha sido suspendido automáticamente.`,
        conductorSuspendido: cond,
      };
    }

    // Desvincular de vehículo si tenía
    if (cond.vehiculoAsignadoId) {
      const veh = this.vehiculos.find((v) => v.id === cond.vehiculoAsignadoId);
      if (veh && veh.conductorId === id) {
        veh.conductorId = undefined;
        veh.conductorNombre = undefined;
      }
    }

    this.usuarios = this.usuarios.filter((u) => u.id !== id);
    return { exito: true, mensaje: 'Conductor eliminado exitosamente del catálogo.' };
  }

  // ==========================================
  // Métodos de Gestión de Estaciones de Servicio
  // ==========================================

  public verificarDependenciasEstacion(estacionId: string): { puedeEliminar: boolean; motivo?: string } {
    const estacion = this.estaciones.find((e) => e.id === estacionId);
    if (!estacion) return { puedeEliminar: false, motivo: 'Estación no encontrada.' };

    const estNorm = this.normalizarTexto(estacion.nombre);

    const cargasEnEstacion = this.cargas.filter((c) => {
      const cNorm = this.normalizarTexto(c.estacion);
      return cNorm === estNorm || cNorm.includes(estNorm) || estNorm.includes(cNorm);
    }).length;

    const saldosAsociados = this.saldos.filter((s) => s.estacionId === estacionId || this.normalizarTexto(s.estacionNombre) === estNorm);
    const movsAsociados = this.movimientosSaldo.filter((m) => {
      const mNorm = this.normalizarTexto(m.estacionNombre);
      return saldosAsociados.some((s) => s.id === m.saldoId) || mNorm === estNorm;
    }).length;

    const totalActividad = cargasEnEstacion + movsAsociados;

    if (totalActividad > 0) {
      return {
        puedeEliminar: false,
        motivo: `La estación cuenta con ${cargasEnEstacion} registro(s) de combustible y ${movsAsociados} movimiento(s) de saldo registrados en el historial contable. Por auditoría, debe permanecer en estado inactivo en vez de ser borrada.`,
      };
    }

    return { puedeEliminar: true };
  }

  public crearEstacion(params: {
    nombre: string;
    ubicacion?: string;
    direccion?: string;
    moneda?: string;
    cedulaJuridica?: string;
    combustiblesDisponibles?: string[];
    saldoInicial?: number;
    umbralAlerta?: number;
    activo?: boolean;
  }): { estacion: Estacion; saldo: SaldoEstacion } {
    const nombreTrim = params.nombre.trim();
    if (!nombreTrim) throw new Error('El nombre de la estación es requerido.');

    const existe = this.estaciones.find(
      (e) => this.normalizarTexto(e.nombre) === this.normalizarTexto(nombreTrim)
    );
    if (existe) {
      throw new Error(`Ya existe una estación registrada con el nombre "${nombreTrim}".`);
    }

    const nuevaEstacion: Estacion = {
      id: `est-${Date.now()}`,
      nombre: nombreTrim,
      ubicacion: params.ubicacion || params.direccion || 'Costa Rica',
      direccion: params.direccion || params.ubicacion || 'Costa Rica',
      moneda: params.moneda || 'CRC',
      cedulaJuridica: params.cedulaJuridica,
      combustiblesDisponibles: params.combustiblesDisponibles || ['Diesel', 'Gasolina Regular', 'Gasolina Super'],
      activo: params.activo !== undefined ? params.activo : true,
      createdAt: new Date().toISOString(),
    };

    this.estaciones.push(nuevaEstacion);

    // Auto-generar saldo prepago para la estación
    const saldoInicialNum = Number(params.saldoInicial) || 0;
    const umbralNum = Number(params.umbralAlerta) || 100000;
    const nowIso = new Date().toISOString();

    const nuevoSaldo: SaldoEstacion = {
      id: `saldo-${Date.now()}`,
      estacionId: nuevaEstacion.id,
      estacionNombre: nuevaEstacion.nombre,
      saldoActual: saldoInicialNum,
      moneda: nuevaEstacion.moneda,
      umbralAlerta: umbralNum,
      activo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.saldos.push(nuevoSaldo);

    if (saldoInicialNum > 0) {
      this.movimientosSaldo.unshift({
        id: `mov-${Date.now()}-init`,
        saldoId: nuevoSaldo.id,
        estacionNombre: nuevaEstacion.nombre,
        tipo: 'carga_inicial',
        monto: saldoInicialNum,
        saldoAnterior: 0,
        saldoNuevo: saldoInicialNum,
        usuarioId: 'usr-admin-1',
        usuarioNombre: 'Administrador del Sistema',
        fecha: nowIso,
        fechaDeposito: nowIso.split('T')[0],
        notas: 'Fondo de apertura y saldo inicial de la estación',
      });
    }

    return { estacion: nuevaEstacion, saldo: nuevoSaldo };
  }

  public editarEstacion(
    id: string,
    params: {
      nombre?: string;
      ubicacion?: string;
      direccion?: string;
      moneda?: string;
      cedulaJuridica?: string;
      combustiblesDisponibles?: string[];
      activo?: boolean;
    }
  ): Estacion {
    const estacion = this.estaciones.find((e) => e.id === id);
    if (!estacion) throw new Error('Estación no encontrada.');

    if (params.nombre && params.nombre.trim() !== estacion.nombre) {
      const nombreTrim = params.nombre.trim();
      const existeOtra = this.estaciones.find(
        (e) => e.id !== id && this.normalizarTexto(e.nombre) === this.normalizarTexto(nombreTrim)
      );
      if (existeOtra) {
        throw new Error(`Ya existe otra estación con el nombre "${nombreTrim}".`);
      }
      estacion.nombre = nombreTrim;

      // Actualizar nombre en saldos asociados
      this.saldos.forEach((s) => {
        if (s.estacionId === id) {
          s.estacionNombre = nombreTrim;
        }
      });
    }

    if (params.ubicacion !== undefined) estacion.ubicacion = params.ubicacion;
    if (params.direccion !== undefined) estacion.direccion = params.direccion;
    if (params.moneda !== undefined) {
      estacion.moneda = params.moneda;
      this.saldos.forEach((s) => {
        if (s.estacionId === id) s.moneda = params.moneda!;
      });
    }
    if (params.cedulaJuridica !== undefined) estacion.cedulaJuridica = params.cedulaJuridica;
    if (params.combustiblesDisponibles !== undefined) estacion.combustiblesDisponibles = params.combustiblesDisponibles;
    if (params.activo !== undefined) estacion.activo = params.activo;

    return estacion;
  }

  public eliminarEstacion(id: string): { exito: boolean; mensaje: string; estacionDesactivada?: Estacion } {
    const estacion = this.estaciones.find((e) => e.id === id);
    if (!estacion) throw new Error('Estación no encontrada.');

    const check = this.verificarDependenciasEstacion(id);
    if (!check.puedeEliminar) {
      estacion.activo = false;
      return {
        exito: false,
        mensaje: `${check.motivo} La estación ha sido marcada como inactiva.`,
        estacionDesactivada: estacion,
      };
    }

    // Si no tiene registros, eliminar la estación y sus saldos vírgenes
    this.estaciones = this.estaciones.filter((e) => e.id !== id);
    this.saldos = this.saldos.filter((s) => s.estacionId !== id);
    return { exito: true, mensaje: 'Estación eliminada exitosamente.' };
  }

  public cambiarPasswordUsuario(params: {
    usuarioId: string;
    passwordAnterior?: string;
    passwordNuevo: string;
    forzarSinAnterior?: boolean;
  }): { exito: boolean; mensaje: string; usuario: Usuario } {
    const usuario = this.usuarios.find((u) => u.id === params.usuarioId);
    if (!usuario) throw new Error('Usuario no encontrado.');

    if (!params.passwordNuevo || params.passwordNuevo.trim().length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    if (!params.forzarSinAnterior && usuario.tempPassword && params.passwordAnterior) {
      if (params.passwordAnterior !== usuario.tempPassword && params.passwordAnterior !== usuario.passwordHash) {
        throw new Error('La contraseña temporal o anterior ingresada es incorrecta.');
      }
    }

    usuario.passwordHash = params.passwordNuevo;
    usuario.tempPassword = undefined;
    usuario.debeCambiarPassword = false;

    return {
      exito: true,
      mensaje: 'Contraseña actualizada exitosamente.',
      usuario,
    };
  }

  public crearSaldo(params: {
    estacionId: string;
    estacionNombre?: string;
    saldoInicial: number;
    umbralAlerta: number;
    moneda?: string;
    usuarioId: string;
    usuarioNombre: string;
  }): { saldo: SaldoEstacion; movimiento?: MovimientoSaldo } {
    const est = this.estaciones.find((e) => e.id === params.estacionId);
    const nombre = est?.nombre || params.estacionNombre || 'Estación de Servicio';

    const existe = this.saldos.find((s) => s.estacionId === params.estacionId);
    if (existe) {
      throw new Error(`La estación ${nombre} ya cuenta con una cuenta de saldo activa.`);
    }

    const montoInit = Number(params.saldoInicial) || 0;
    const umbral = Number(params.umbralAlerta) || 100000;
    const nowIso = new Date().toISOString();

    const nuevoSaldo: SaldoEstacion = {
      id: `saldo-${Date.now()}`,
      estacionId: params.estacionId,
      estacionNombre: nombre,
      saldoActual: montoInit,
      moneda: params.moneda || est?.moneda || 'CRC',
      umbralAlerta: umbral,
      activo: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.saldos.push(nuevoSaldo);

    let mov: MovimientoSaldo | undefined = undefined;
    if (montoInit > 0) {
      mov = {
        id: `mov-${Date.now()}-init`,
        saldoId: nuevoSaldo.id,
        estacionNombre: nombre,
        tipo: 'carga_inicial',
        monto: montoInit,
        saldoAnterior: 0,
        saldoNuevo: montoInit,
        usuarioId: params.usuarioId,
        usuarioNombre: params.usuarioNombre,
        fecha: nowIso,
        fechaDeposito: nowIso.split('T')[0],
        notas: 'Saldo inicial registrado al dar de alta la cuenta de prepago.',
      };
      this.movimientosSaldo.unshift(mov);
    }

    return { saldo: nuevoSaldo, movimiento: mov };
  }

  // ==========================================
  // Métodos de Control de Caja Chica de Combustibles
  // ==========================================

  public getCajasChicas(): CajaChica[] {
    return this.cajasChicas.map((c) => {
      const enAlertaReposicion = c.saldoEfectivoActual <= c.umbralReposicion;
      const porcentajeDisponible = c.montoFondoFijo > 0 ? Math.round((c.saldoEfectivoActual / c.montoFondoFijo) * 100) : 0;
      const totalMovimientos = this.movimientosCajaChica.filter((m) => m.cajaChicaId === c.id).length;
      return {
        ...c,
        enAlertaReposicion,
        porcentajeDisponible,
        totalMovimientos,
      };
    });
  }

  public getCajaChicaById(id: string): CajaChica | undefined {
    const c = this.cajasChicas.find((item) => item.id === id);
    if (!c) return undefined;
    const enAlertaReposicion = c.saldoEfectivoActual <= c.umbralReposicion;
    const porcentajeDisponible = c.montoFondoFijo > 0 ? Math.round((c.saldoEfectivoActual / c.montoFondoFijo) * 100) : 0;
    const totalMovimientos = this.movimientosCajaChica.filter((m) => m.cajaChicaId === c.id).length;
    return {
      ...c,
      enAlertaReposicion,
      porcentajeDisponible,
      totalMovimientos,
    };
  }

  public crearCajaChica(params: {
    nombre: string;
    codigo?: string;
    custodioId: string;
    custodioNombre: string;
    custodioTelefono?: string;
    montoFondoFijo: number;
    saldoInicial?: number;
    umbralReposicion?: number;
    moneda?: string;
    ubicacion?: string;
    observaciones?: string;
    usuarioId: string;
    usuarioNombre: string;
  }): { caja: CajaChica; movimiento?: MovimientoCajaChica } {
    const nowIso = new Date().toISOString();
    const id = `cch-${Date.now()}`;
    const codigo = params.codigo || `CCH-0${this.cajasChicas.length + 1}`;
    const montoFondoFijo = Number(params.montoFondoFijo) || 100000;
    const saldoEfectivoActual = params.saldoInicial !== undefined ? Number(params.saldoInicial) : montoFondoFijo;
    const umbralReposicion = params.umbralReposicion !== undefined ? Number(params.umbralReposicion) : Math.round(montoFondoFijo * 0.25);

    const nuevaCaja: CajaChica = {
      id,
      codigo,
      nombre: params.nombre.trim(),
      custodioId: params.custodioId,
      custodioNombre: params.custodioNombre,
      custodioTelefono: params.custodioTelefono,
      montoFondoFijo,
      saldoEfectivoActual,
      saldoComprobantesPendientes: 0,
      umbralReposicion,
      moneda: params.moneda || 'CRC',
      ubicacion: params.ubicacion || 'Plantel Principal',
      estado: 'ABIERTA',
      fechaApertura: nowIso,
      observaciones: params.observaciones,
      activo: true,
      createdAt: nowIso,
    };

    this.cajasChicas.push(nuevaCaja);

    let mov: MovimientoCajaChica | undefined = undefined;
    if (saldoEfectivoActual > 0) {
      mov = {
        id: `mov-cch-${Date.now()}`,
        cajaChicaId: id,
        cajaChicaNombre: nuevaCaja.nombre,
        tipo: 'APERTURA',
        monto: saldoEfectivoActual,
        saldoEfectivoAnterior: 0,
        saldoEfectivoNuevo: saldoEfectivoActual,
        fecha: nowIso,
        fechaDocumento: nowIso.split('T')[0],
        concepto: 'Apertura y dotación inicial del fondo fijo de caja chica',
        estado: 'COMPLETADO',
        registradoPorId: params.usuarioId,
        registradoPorNombre: params.usuarioNombre,
        notas: params.observaciones,
      };
      this.movimientosCajaChica.unshift(mov);
    }

    return { caja: nuevaCaja, movimiento: mov };
  }

  public actualizarCajaChica(
    id: string,
    params: {
      nombre?: string;
      codigo?: string;
      custodioId?: string;
      custodioNombre?: string;
      custodioTelefono?: string;
      montoFondoFijo?: number;
      umbralReposicion?: number;
      ubicacion?: string;
      estado?: CajaChica['estado'];
      observaciones?: string;
      activo?: boolean;
    }
  ): CajaChica {
    const caja = this.cajasChicas.find((c) => c.id === id);
    if (!caja) throw new Error('Caja chica no encontrada.');

    if (params.nombre) caja.nombre = params.nombre.trim();
    if (params.codigo) caja.codigo = params.codigo.trim();
    if (params.custodioId) caja.custodioId = params.custodioId;
    if (params.custodioNombre) caja.custodioNombre = params.custodioNombre;
    if (params.custodioTelefono !== undefined) caja.custodioTelefono = params.custodioTelefono;
    if (params.montoFondoFijo !== undefined) caja.montoFondoFijo = Number(params.montoFondoFijo);
    if (params.umbralReposicion !== undefined) caja.umbralReposicion = Number(params.umbralReposicion);
    if (params.ubicacion !== undefined) caja.ubicacion = params.ubicacion;
    if (params.estado) caja.estado = params.estado;
    if (params.observaciones !== undefined) caja.observaciones = params.observaciones;
    if (params.activo !== undefined) caja.activo = params.activo;
    caja.updatedAt = new Date().toISOString();

    return caja;
  }

  public eliminarCajaChica(id: string): { message: string } {
    const idx = this.cajasChicas.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Caja chica no encontrada.');

    const tieneValesPendientes = this.movimientosCajaChica.some(
      (m) => m.cajaChicaId === id && m.tipo === 'VALE_PROVISIONAL' && m.estado === 'PENDIENTE_LIQUIDACION'
    );
    if (tieneValesPendientes) {
      throw new Error('No se puede eliminar la caja chica porque tiene vales provisionales pendientes de liquidación.');
    }

    // Desactivar en lugar de purgar para preservar integridad contable
    this.cajasChicas[idx].activo = false;
    this.cajasChicas[idx].estado = 'CERRADA';
    this.cajasChicas[idx].updatedAt = new Date().toISOString();

    return { message: 'Caja chica desactivada y archivada exitosamente.' };
  }

  public registrarEgresoCajaChica(params: {
    cajaChicaId: string;
    monto: number;
    fechaDocumento?: string;
    numeroFactura?: string;
    vehiculoId?: string;
    vehiculoPlaca?: string;
    conductorId?: string;
    conductorNombre?: string;
    estacionServicio?: string;
    tipoCombustible?: string;
    litros?: number;
    precioPorLitro?: number;
    odometro?: number;
    concepto: string;
    motivo?: string;
    comprobanteUrl?: string;
    usuarioId: string;
    usuarioNombre: string;
    notas?: string;
  }): { caja: CajaChica; movimiento: MovimientoCajaChica } {
    const caja = this.cajasChicas.find((c) => c.id === params.cajaChicaId);
    if (!caja) throw new Error('Caja chica no encontrada.');
    if (!caja.activo) throw new Error('La caja chica está desactivada o cerrada.');

    const monto = Number(params.monto);
    if (isNaN(monto) || monto <= 0) {
      throw new Error('El monto del egreso debe ser mayor a cero.');
    }

    if (caja.saldoEfectivoActual < monto) {
      throw new Error(
        `Efectivo insuficiente en caja. Disponible: ₡${caja.saldoEfectivoActual.toLocaleString('es-CR')} vs Requerido: ₡${monto.toLocaleString('es-CR')}. Solicite un reintegro o reposición.`
      );
    }

    const saldoAnterior = caja.saldoEfectivoActual;
    caja.saldoEfectivoActual = Number((caja.saldoEfectivoActual - monto).toFixed(2));
    caja.saldoComprobantesPendientes = Number((caja.saldoComprobantesPendientes + monto).toFixed(2));
    if (caja.saldoEfectivoActual <= caja.umbralReposicion) {
      caja.estado = 'EN_REPOSICION';
    }
    caja.updatedAt = new Date().toISOString();

    const nowIso = new Date().toISOString();
    const movimiento: MovimientoCajaChica = {
      id: `mov-cch-${Date.now()}`,
      cajaChicaId: caja.id,
      cajaChicaNombre: caja.nombre,
      tipo: 'EGRESO_COMBUSTIBLE',
      monto,
      saldoEfectivoAnterior: saldoAnterior,
      saldoEfectivoNuevo: caja.saldoEfectivoActual,
      fecha: nowIso,
      fechaDocumento: params.fechaDocumento || nowIso.split('T')[0],
      numeroFactura: params.numeroFactura,
      vehiculoId: params.vehiculoId,
      vehiculoPlaca: params.vehiculoPlaca,
      conductorId: params.conductorId,
      conductorNombre: params.conductorNombre,
      estacionServicio: params.estacionServicio,
      tipoCombustible: params.tipoCombustible,
      litros: params.litros ? Number(params.litros) : undefined,
      precioPorLitro: params.precioPorLitro ? Number(params.precioPorLitro) : undefined,
      odometro: params.odometro ? Number(params.odometro) : undefined,
      concepto: params.concepto,
      motivo: params.motivo,
      estado: 'COMPLETADO',
      comprobanteUrl: params.comprobanteUrl,
      registradoPorId: params.usuarioId,
      registradoPorNombre: params.usuarioNombre,
      notas: params.notas,
    };

    this.movimientosCajaChica.unshift(movimiento);
    return { caja, movimiento };
  }

  public emitirValeProvisional(params: {
    cajaChicaId: string;
    montoEstimado: number;
    conductorId: string;
    conductorNombre: string;
    vehiculoId?: string;
    vehiculoPlaca?: string;
    concepto: string;
    motivo?: string;
    fechaDocumento?: string;
    usuarioId: string;
    usuarioNombre: string;
    notas?: string;
  }): { caja: CajaChica; movimiento: MovimientoCajaChica } {
    const caja = this.cajasChicas.find((c) => c.id === params.cajaChicaId);
    if (!caja) throw new Error('Caja chica no encontrada.');
    if (!caja.activo) throw new Error('La caja chica está inactiva.');

    const monto = Number(params.montoEstimado);
    if (isNaN(monto) || monto <= 0) {
      throw new Error('El monto estimado del vale debe ser mayor a cero.');
    }

    if (caja.saldoEfectivoActual < monto) {
      throw new Error(
        `Efectivo insuficiente para emitir el vale. Disponible en caja: ₡${caja.saldoEfectivoActual.toLocaleString('es-CR')}.`
      );
    }

    const saldoAnterior = caja.saldoEfectivoActual;
    caja.saldoEfectivoActual = Number((caja.saldoEfectivoActual - monto).toFixed(2));
    caja.saldoComprobantesPendientes = Number((caja.saldoComprobantesPendientes + monto).toFixed(2));
    if (caja.saldoEfectivoActual <= caja.umbralReposicion) {
      caja.estado = 'EN_REPOSICION';
    }
    caja.updatedAt = new Date().toISOString();

    const totalVales = this.movimientosCajaChica.filter((m) => m.tipo === 'VALE_PROVISIONAL').length + 1;
    const numeroVale = `VALE-${new Date().getFullYear()}-${String(totalVales).padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const movimiento: MovimientoCajaChica = {
      id: `mov-cch-${Date.now()}`,
      cajaChicaId: caja.id,
      cajaChicaNombre: caja.nombre,
      tipo: 'VALE_PROVISIONAL',
      monto,
      saldoEfectivoAnterior: saldoAnterior,
      saldoEfectivoNuevo: caja.saldoEfectivoActual,
      fecha: nowIso,
      fechaDocumento: params.fechaDocumento || nowIso.split('T')[0],
      numeroVale,
      conductorId: params.conductorId,
      conductorNombre: params.conductorNombre,
      vehiculoId: params.vehiculoId,
      vehiculoPlaca: params.vehiculoPlaca,
      concepto: params.concepto || `Vale provisional en efectivo para combustible - ${numeroVale}`,
      motivo: params.motivo,
      estado: 'PENDIENTE_LIQUIDACION',
      registradoPorId: params.usuarioId,
      registradoPorNombre: params.usuarioNombre,
      notas: params.notas,
    };

    this.movimientosCajaChica.unshift(movimiento);
    return { caja, movimiento };
  }

  public liquidarValeProvisional(
    valeId: string,
    params: {
      montoGastoReal: number;
      numeroFactura?: string;
      estacionServicio?: string;
      tipoCombustible?: string;
      litros?: number;
      precioPorLitro?: number;
      odometro?: number;
      comprobanteUrl?: string;
      usuarioId: string;
      usuarioNombre: string;
      notas?: string;
    }
  ): { caja: CajaChica; valeOriginal: MovimientoCajaChica; movimientoLiquidacion: MovimientoCajaChica } {
    const vale = this.movimientosCajaChica.find((m) => m.id === valeId || m.numeroVale === valeId);
    if (!vale) throw new Error('Vale provisional no encontrado.');
    if (vale.tipo !== 'VALE_PROVISIONAL') throw new Error('El movimiento seleccionado no es un vale provisional.');
    if (vale.estado !== 'PENDIENTE_LIQUIDACION') throw new Error('Este vale ya ha sido liquidado previamente.');

    const caja = this.cajasChicas.find((c) => c.id === vale.cajaChicaId);
    if (!caja) throw new Error('Caja chica asociada al vale no encontrada.');

    const gastoReal = Number(params.montoGastoReal);
    if (isNaN(gastoReal) || gastoReal <= 0) {
      throw new Error('El monto real gastado en combustible debe ser mayor a cero.');
    }

    const adelanto = vale.monto;
    const diferencia = adelanto - gastoReal;
    const saldoAnterior = caja.saldoEfectivoActual;

    // Si diferencia > 0: El conductor gastó menos y devuelve vuelto a caja (entra efectivo)
    // Si diferencia < 0: El conductor gastó más de su bolsillo y la caja le reembolsa la diferencia (sale efectivo)
    if (diferencia > 0) {
      caja.saldoEfectivoActual = Number((caja.saldoEfectivoActual + diferencia).toFixed(2));
      caja.saldoComprobantesPendientes = Number((caja.saldoComprobantesPendientes - adelanto + gastoReal).toFixed(2));
    } else if (diferencia < 0) {
      const faltante = Math.abs(diferencia);
      if (caja.saldoEfectivoActual < faltante) {
        throw new Error(
          `Efectivo insuficiente en caja para reembolsar el excedente de ₡${faltante.toLocaleString('es-CR')}.`
        );
      }
      caja.saldoEfectivoActual = Number((caja.saldoEfectivoActual - faltante).toFixed(2));
      caja.saldoComprobantesPendientes = Number((caja.saldoComprobantesPendientes - adelanto + gastoReal).toFixed(2));
    } else {
      // Gasto exacto
      caja.saldoComprobantesPendientes = Number((caja.saldoComprobantesPendientes - adelanto + gastoReal).toFixed(2));
    }

    caja.updatedAt = new Date().toISOString();
    vale.estado = 'COMPLETADO';

    const nowIso = new Date().toISOString();
    const movimientoLiquidacion: MovimientoCajaChica = {
      id: `mov-cch-${Date.now()}`,
      cajaChicaId: caja.id,
      cajaChicaNombre: caja.nombre,
      tipo: 'LIQUIDACION_VALE',
      monto: gastoReal,
      saldoEfectivoAnterior: saldoAnterior,
      saldoEfectivoNuevo: caja.saldoEfectivoActual,
      fecha: nowIso,
      fechaDocumento: nowIso.split('T')[0],
      numeroVale: vale.numeroVale,
      numeroFactura: params.numeroFactura,
      conductorId: vale.conductorId,
      conductorNombre: vale.conductorNombre,
      vehiculoId: vale.vehiculoId,
      vehiculoPlaca: vale.vehiculoPlaca,
      estacionServicio: params.estacionServicio,
      tipoCombustible: params.tipoCombustible,
      litros: params.litros ? Number(params.litros) : undefined,
      precioPorLitro: params.precioPorLitro ? Number(params.precioPorLitro) : undefined,
      odometro: params.odometro ? Number(params.odometro) : undefined,
      vueltoDevuelto: diferencia > 0 ? diferencia : undefined,
      concepto: `Liquidación de ${vale.numeroVale} (Adelanto: ₡${adelanto.toLocaleString('es-CR')} | Gasto: ₡${gastoReal.toLocaleString('es-CR')}${
        diferencia > 0 ? ` | Vuelto devuelto: ₡${diferencia.toLocaleString('es-CR')}` : ''
      })`,
      estado: 'COMPLETADO',
      comprobanteUrl: params.comprobanteUrl,
      registradoPorId: params.usuarioId,
      registradoPorNombre: params.usuarioNombre,
      notas: params.notas,
    };

    this.movimientosCajaChica.unshift(movimientoLiquidacion);
    return { caja, valeOriginal: vale, movimientoLiquidacion };
  }

  public reposicionFondoCajaChica(
    cajaId: string,
    params: {
      montoReposicion?: number;
      comprobanteReferencia?: string;
      fechaDocumento?: string;
      usuarioId: string;
      usuarioNombre: string;
      notas?: string;
    }
  ): { caja: CajaChica; movimiento: MovimientoCajaChica } {
    const caja = this.cajasChicas.find((c) => c.id === cajaId);
    if (!caja) throw new Error('Caja chica no encontrada.');

    // Por defecto reintegra el total de comprobantes pendientes o hasta el fondo fijo
    const monto = params.montoReposicion !== undefined ? Number(params.montoReposicion) : caja.saldoComprobantesPendientes;
    if (isNaN(monto) || monto <= 0) {
      throw new Error('El monto de reposición o reintegro debe ser mayor a cero.');
    }

    const saldoAnterior = caja.saldoEfectivoActual;
    caja.saldoEfectivoActual = Number((caja.saldoEfectivoActual + monto).toFixed(2));
    caja.saldoComprobantesPendientes = Number(Math.max(0, caja.saldoComprobantesPendientes - monto).toFixed(2));
    caja.estado = 'ABIERTA';
    caja.updatedAt = new Date().toISOString();

    const nowIso = new Date().toISOString();
    const movimiento: MovimientoCajaChica = {
      id: `mov-cch-${Date.now()}`,
      cajaChicaId: caja.id,
      cajaChicaNombre: caja.nombre,
      tipo: 'REPOSICION_FONDO',
      monto,
      saldoEfectivoAnterior: saldoAnterior,
      saldoEfectivoNuevo: caja.saldoEfectivoActual,
      fecha: nowIso,
      fechaDocumento: params.fechaDocumento || nowIso.split('T')[0],
      concepto: `Reintegro y reposición de fondo fijo de caja chica`,
      estado: 'COMPLETADO',
      comprobanteReferencia: params.comprobanteReferencia || `TRANSF-REINT-${Date.now().toString().slice(-5)}`,
      registradoPorId: params.usuarioId,
      registradoPorNombre: params.usuarioNombre,
      notas: params.notas,
    };

    this.movimientosCajaChica.unshift(movimiento);
    return { caja, movimiento };
  }

  public realizarArqueoCajaChica(params: {
    cajaChicaId: string;
    efectivoContado: number;
    comprobantesMonto?: number;
    valesPendientesMonto?: number;
    desgloseBilletesMonedas?: DesgloseDenominacion[];
    observaciones?: string;
    auditorId: string;
    auditorNombre: string;
    ajustarSaldoAutomaticamente?: boolean;
  }): { arqueo: ArqueoCajaChica; caja: CajaChica; movimientoAjuste?: MovimientoCajaChica } {
    const caja = this.cajasChicas.find((c) => c.id === params.cajaChicaId);
    if (!caja) throw new Error('Caja chica no encontrada.');

    const efectivoContado = Number(params.efectivoContado);
    const comprobantesMonto = params.comprobantesMonto !== undefined ? Number(params.comprobantesMonto) : caja.saldoComprobantesPendientes;
    const valesPendientesMonto =
      params.valesPendientesMonto !== undefined
        ? Number(params.valesPendientesMonto)
        : this.movimientosCajaChica
            .filter((m) => m.cajaChicaId === caja.id && m.tipo === 'VALE_PROVISIONAL' && m.estado === 'PENDIENTE_LIQUIDACION')
            .reduce((acc, m) => acc + m.monto, 0);

    const totalAuditado = Number((efectivoContado + comprobantesMonto + valesPendientesMonto).toFixed(2));
    const diferencia = Number((totalAuditado - caja.montoFondoFijo).toFixed(2));

    let resultado: ArqueoCajaChica['resultado'] = 'CUADRE_EXACTO';
    if (diferencia > 0) resultado = 'SOBRANTE';
    else if (diferencia < 0) resultado = 'FALTANTE';

    const nowIso = new Date().toISOString();
    const nuevoArqueo: ArqueoCajaChica = {
      id: `arq-${Date.now()}`,
      cajaChicaId: caja.id,
      cajaChicaNombre: caja.nombre,
      fechaArqueo: nowIso,
      auditorId: params.auditorId,
      auditorNombre: params.auditorNombre,
      custodioNombre: caja.custodioNombre,
      fondoFijoTotal: caja.montoFondoFijo,
      efectivoContado,
      comprobantesMonto,
      valesPendientesMonto,
      totalAuditado,
      diferencia,
      resultado,
      desgloseBilletesMonedas: params.desgloseBilletesMonedas,
      observaciones: params.observaciones,
      estado: resultado === 'CUADRE_EXACTO' ? 'APROBADO' : 'OBSERVADO',
    };

    this.arqueosCajaChica.unshift(nuevoArqueo);
    caja.fechaUltimoArqueo = nowIso;
    caja.estado = 'ARQUEADA';
    caja.updatedAt = nowIso;

    let movimientoAjuste: MovimientoCajaChica | undefined = undefined;
    if (params.ajustarSaldoAutomaticamente && efectivoContado !== caja.saldoEfectivoActual) {
      const saldoAnterior = caja.saldoEfectivoActual;
      caja.saldoEfectivoActual = efectivoContado;

      movimientoAjuste = {
        id: `mov-cch-${Date.now()}`,
        cajaChicaId: caja.id,
        cajaChicaNombre: caja.nombre,
        tipo: 'AJUSTE_ARQUEO',
        monto: Math.abs(efectivoContado - saldoAnterior),
        saldoEfectivoAnterior: saldoAnterior,
        saldoEfectivoNuevo: efectivoContado,
        fecha: nowIso,
        fechaDocumento: nowIso.split('T')[0],
        concepto: `Ajuste de saldo por arqueo físico (${resultado})`,
        estado: 'COMPLETADO',
        registradoPorId: params.auditorId,
        registradoPorNombre: params.auditorNombre,
        notas: params.observaciones || `Diferencia auditada de arqueo: ₡${diferencia.toLocaleString('es-CR')}`,
      };
      this.movimientosCajaChica.unshift(movimientoAjuste);
    }

    return { arqueo: nuevoArqueo, caja, movimientoAjuste };
  }

  public getMovimientosCajaChica(filtros?: {
    cajaChicaId?: string;
    tipo?: string;
    estado?: string;
    conductorId?: string;
    vehiculoPlaca?: string;
    fechaDesde?: string;
    fechaHasta?: string;
  }): MovimientoCajaChica[] {
    let movs = [...this.movimientosCajaChica];

    if (filtros?.cajaChicaId) {
      movs = movs.filter((m) => m.cajaChicaId === filtros.cajaChicaId);
    }
    if (filtros?.tipo && filtros.tipo !== 'TODOS') {
      movs = movs.filter((m) => m.tipo === filtros.tipo);
    }
    if (filtros?.estado && filtros.estado !== 'TODOS') {
      movs = movs.filter((m) => m.estado === filtros.estado);
    }
    if (filtros?.conductorId) {
      movs = movs.filter((m) => m.conductorId === filtros.conductorId);
    }
    if (filtros?.vehiculoPlaca) {
      const plNorm = filtros.vehiculoPlaca.toUpperCase().trim();
      movs = movs.filter((m) => m.vehiculoPlaca?.toUpperCase().includes(plNorm));
    }
    if (filtros?.fechaDesde) {
      movs = movs.filter((m) => (m.fechaDocumento || m.fecha) >= filtros.fechaDesde!);
    }
    if (filtros?.fechaHasta) {
      movs = movs.filter((m) => (m.fechaDocumento || m.fecha) <= filtros.fechaHasta!);
    }

    return movs;
  }

  public getArqueosCajaChica(cajaChicaId?: string): ArqueoCajaChica[] {
    if (cajaChicaId) {
      return this.arqueosCajaChica.filter((a) => a.cajaChicaId === cajaChicaId);
    }
    return [...this.arqueosCajaChica];
  }

  public getMetricasCajaChica(): MetricasCajaChica {
    const activas = this.cajasChicas.filter((c) => c.activo);
    const totalFondosFijos = activas.reduce((acc, c) => acc + c.montoFondoFijo, 0);
    const totalEfectivoDisponible = activas.reduce((acc, c) => acc + c.saldoEfectivoActual, 0);
    const totalComprobantesPorReintegrar = activas.reduce((acc, c) => acc + c.saldoComprobantesPendientes, 0);
    const totalValesPendientes = this.movimientosCajaChica.filter(
      (m) => m.tipo === 'VALE_PROVISIONAL' && m.estado === 'PENDIENTE_LIQUIDACION'
    ).length;
    const cajasEnAlertaReposicion = activas.filter((c) => c.saldoEfectivoActual <= c.umbralReposicion).length;

    return {
      totalFondosFijos,
      totalEfectivoDisponible,
      totalComprobantesPorReintegrar,
      totalValesPendientes,
      cajasEnAlertaReposicion,
      totalCajasActivas: activas.length,
    };
  }

  private construirCargaSeed(params: {
    id: string;
    fecha: string;
    conductorId: string;
    conductorNombre: string;
    vehiculoId: string;
    vehiculoPlaca: string;
    estacion: string;
    tipoCombustible: string;
    litros: number;
    precioPorLitro: number;
    totalPagado: number;
    odometroAnterior: number;
    odometroActual: number;
    rendimientoTeorico: number;
    estadoValidacion: CargaCombustible['estadoValidacion'];
    validadoPor?: string;
    notasValidacion?: string;
    notaConductor?: string;
    folioTicket: string;
  }): CargaCombustible {
    const metricas = procesarMetricasCarga(
      params.odometroActual,
      params.odometroAnterior,
      params.litros,
      params.totalPagado,
      params.rendimientoTeorico
    );

    const fotoFacturaUrl = generarTicketSvgBase64(
      params.estacion,
      params.litros,
      params.totalPagado,
      params.fecha.split('T')[0],
      params.folioTicket
    );

    const fotoOdometroUrl = generarOdometroSvgBase64(params.odometroActual, params.vehiculoPlaca);

    return {
      id: params.id,
      fecha: params.fecha,
      conductorId: params.conductorId,
      conductorNombre: params.conductorNombre,
      vehiculoId: params.vehiculoId,
      vehiculoPlaca: params.vehiculoPlaca,
      estacion: params.estacion,
      tipoCombustible: params.tipoCombustible,
      litros: params.litros,
      precioPorLitro: params.precioPorLitro,
      totalPagado: params.totalPagado,
      odometroAnterior: params.odometroAnterior,
      odometroActual: params.odometroActual,
      kmRecorridos: metricas.kmRecorridos,
      costoPorKm: metricas.costoPorKm,
      rendimientoKmL: metricas.rendimientoKmL,
      estadoValidacion: params.estadoValidacion,
      validadoPor: params.validadoPor,
      fechaValidacion: params.validadoPor ? params.fecha : undefined,
      notasValidacion: params.notasValidacion,
      notaConductor: params.notaConductor,
      fotoFacturaUrl,
      fotoOdometroUrl,
      anomaliaDetectada: metricas.anomalia,
      motivoAnomalia: metricas.motivoAnomalia,
      datosIA: {
        estacion: params.estacion,
        numeroTicket: params.folioTicket,
        fecha: params.fecha.split('T')[0],
        tipoCombustible: params.tipoCombustible,
        litros: params.litros,
        precioPorLitro: params.precioPorLitro,
        totalPagado: params.totalPagado,
        odometroLeido: params.odometroActual,
        confianzaScore: 96,
        advertencias: [],
      },
    };
  }
}

export const db = new BaseDeDatosFlota();
