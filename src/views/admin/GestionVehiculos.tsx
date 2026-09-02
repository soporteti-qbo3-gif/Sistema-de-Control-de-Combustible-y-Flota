/**
 * Módulo de Gestión y Catálogo de Flota de Vehículos y Maquinaria
 * Sistema de Control de Parque Vehicular según Inventario Operativo
 */

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Edit2,
  Trash2,
  Gauge,
  Fuel,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  MapPin,
  Clock,
  LayoutGrid,
  List,
  Filter,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Info,
  Camera,
  Upload,
  Check,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../services/api';
import { Vehiculo, Usuario, EstadoFinancieroVehiculo } from '../../types';

export const GestionVehiculos: React.FC = () => {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [conductores, setConductores] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('TODOS');
  const [filtroTipoMedicion, setFiltroTipoMedicion] = useState('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroEstadoFinanciero, setFiltroEstadoFinanciero] = useState('TODOS');
  const [vistaModo, setVistaModo] = useState<'TABLA' | 'CUADRICULA'>('TABLA');
  const [cargando, setCargando] = useState(true);

  // Modal Crear/Editar
  const [modalOpen, setModalOpen] = useState(false);
  const [vehiculoEdit, setVehiculoEdit] = useState<Partial<Vehiculo> | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Modal Visor de Fotografía
  const [fotoModalVehiculo, setFotoModalVehiculo] = useState<Vehiculo | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  const handleSubirFotoDirecta = async (vehiculoId: string, file: File) => {
    if (!file) return;
    setSubiendoFoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const vehActualizado = await api.actualizarFotoVehiculo(vehiculoId, base64);
        setVehiculos((prev) => prev.map((v) => (v.id === vehiculoId ? vehActualizado : v)));
        if (fotoModalVehiculo && fotoModalVehiculo.id === vehiculoId) {
          setFotoModalVehiculo(vehActualizado);
        }
      } catch (err: any) {
        alert(`Error al actualizar fotografía: ${err.message}`);
      } finally {
        setSubiendoFoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [vehs, conds] = await Promise.all([api.getVehiculos(), api.getConductores()]);
      setVehiculos(vehs);
      setConductores(conds);
    } catch (e) {
      console.error('Error cargando vehículos:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (fotoModalVehiculo) setFotoModalVehiculo(null);
        if (modalOpen) setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, fotoModalVehiculo]);

  const handleOpenAdd = () => {
    const nextSerie = vehiculos.length > 0 
      ? Math.max(...vehiculos.map(v => typeof v.numeroSerie === 'number' ? v.numeroSerie : 0)) + 1 
      : 1;

    setVehiculoEdit({
      numeroSerie: nextSerie,
      tipoVehiculo: 'Camión',
      placa: '',
      marca: '',
      modelo: '',
      anio: new Date().getFullYear(),
      tipoCombustible: 'Diesel',
      capacidadTanqueLitros: 100,
      odometroInicial: 0,
      odometroActual: 0,
      rendimientoTeoricoKmL: 10.0,
      ubicacion: 'Nosara',
      fechaLecturaInicial: '21/7/2025',
      controlaKilometraje: true,
      tipoControlMedicion: 'KILOMETROS',
      estadoFinanciero: 'Libre',
      imagenUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&w=600&q=80',
      estado: 'Activo',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (v: Vehiculo) => {
    setVehiculoEdit({ ...v });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehiculoEdit) return;

    setGuardando(true);
    try {
      if (vehiculoEdit.id) {
        await api.updateVehiculo(vehiculoEdit.id, vehiculoEdit);
      } else {
        await api.createVehiculo(vehiculoEdit);
      }
      setModalOpen(false);
      setVehiculoEdit(null);
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al guardar vehículo: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (id: string, placa: string) => {
    if (!confirm(`¿Confirmas la eliminación de la unidad ${placa}?`)) return;
    try {
      await api.deleteVehiculo(id);
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleResetKilometraje = async () => {
    if (
      !confirm(
        '¿Deseas poner el kilometraje/horas y registros de combustible de TODOS los vehículos en 0?\n\nEsta acción reiniciará los odómetros iniciales y actuales a 0.'
      )
    ) {
      return;
    }
    setCargando(true);
    try {
      const resp = await api.resetKilometrajeVehiculos();
      alert(resp.message || 'Kilometraje restablecido a 0 en todos los vehículos.');
      await cargarDatos();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Helper para badge de Estado Financiero
  const renderBadgeFinanciero = (estadoFinanciero?: EstadoFinancieroVehiculo) => {
    const estado = estadoFinanciero || 'Libre';
    switch (estado) {
      case 'Leasing':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Leasing
          </span>
        );
      case 'Préstamo':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200">
            Préstamo
          </span>
        );
      case 'Alquiler':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Alquiler
          </span>
        );
      case 'Libre':
      default:
        return (
          <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Libre
          </span>
        );
    }
  };

  // Obtener lista única de ubicaciones para el filtro
  const ubicacionesDisponibles = Array.from(
    new Set(vehiculos.map((v) => v.ubicacion).filter(Boolean))
  ) as string[];

  // Categorías
  const categoriasMap: Record<string, string[]> = {
    MAQUINARIA: ['Backhoe', 'Hormigonera', 'Mini cargador', 'Retroexcavadora'],
    PESADO: ['Vagoneta', 'Camión', 'Camion plataforma', 'Camión plataforma'],
    PASAJEROS: ['Bus', 'Buseta', 'Microbús'],
    LIVIANO: ['Pick up', 'Moto', 'Carro personal', 'Carro personal Mario', 'Carro personal Fabiana'],
  };

  // Filtrado de vehículos
  const vehiculosFiltrados = vehiculos.filter((v) => {
    const matchBusqueda =
      v.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (v.tipoVehiculo && v.tipoVehiculo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (v.ubicacion && v.ubicacion.toLowerCase().includes(busqueda.toLowerCase())) ||
      (v.estadoFinanciero && v.estadoFinanciero.toLowerCase().includes(busqueda.toLowerCase())) ||
      (v.conductorNombre && v.conductorNombre.toLowerCase().includes(busqueda.toLowerCase()));

    const matchUbicacion = filtroUbicacion === 'TODOS' || v.ubicacion === filtroUbicacion;

    const matchMedicion =
      filtroTipoMedicion === 'TODOS' ||
      (filtroTipoMedicion === 'HORAS' && (v.tipoControlMedicion === 'HORAS' || v.controlaKilometraje === 'Por horas')) ||
      (filtroTipoMedicion === 'KILOMETROS' && (v.tipoControlMedicion === 'KILOMETROS' || v.controlaKilometraje === true || v.controlaKilometraje === 'Si')) ||
      (filtroTipoMedicion === 'SIN_CONTROL' && (v.tipoControlMedicion === 'NO_APLICA' || v.controlaKilometraje === false || v.controlaKilometraje === 'No'));

    const matchEstadoFinanciero =
      filtroEstadoFinanciero === 'TODOS' ||
      (v.estadoFinanciero || 'Libre') === filtroEstadoFinanciero;

    let matchCat = true;
    if (filtroCategoria !== 'TODOS') {
      const tiposValidos = categoriasMap[filtroCategoria] || [];
      matchCat = tiposValidos.some(
        (t) => v.tipoVehiculo && v.tipoVehiculo.toLowerCase().includes(t.toLowerCase())
      );
    }

    return matchBusqueda && matchUbicacion && matchMedicion && matchEstadoFinanciero && matchCat;
  });

  // Métricas rápidas
  const totalUnidades = vehiculos.length;
  const unidadesKm = vehiculos.filter(
    (v) => v.tipoControlMedicion === 'KILOMETROS' || v.controlaKilometraje === true || v.controlaKilometraje === 'Si'
  ).length;
  const unidadesHoras = vehiculos.filter(
    (v) => v.tipoControlMedicion === 'HORAS' || v.controlaKilometraje === 'Por horas'
  ).length;
  const unidadesMantenimiento = vehiculos.filter((v) => v.estado === 'En Mantenimiento').length;

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header Principal */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold text-slate-900">Catálogo e Inventario de Flota</h1>
              <span className="text-xs font-mono font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                {totalUnidades} Unidades
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Control de maquinaria pesada, camiones, transporte y unidades con odómetro u horómetro al 21/7/2025
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Selector de Vista: Tabla vs Cuadrícula */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setVistaModo('TABLA')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                vistaModo === 'TABLA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de Tabla / Hoja de Inventario"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabla</span>
            </button>
            <button
              onClick={() => setVistaModo('CUADRICULA')}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center space-x-1 transition-colors ${
                vistaModo === 'CUADRICULA'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vista de Cuadrícula / Tarjetas"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tarjetas</span>
            </button>
          </div>

          <button
            id="btn-reset-km"
            onClick={handleResetKilometraje}
            className="px-2.5 py-1.5 rounded-md border border-slate-300 hover:border-amber-400 hover:bg-amber-50 text-slate-700 hover:text-amber-900 font-medium text-xs flex items-center space-x-1 transition-colors"
            title="Poner odómetro y kilometraje de todos los vehículos en 0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Poner en 0</span>
          </button>

          <button
            id="btn-add-vehicle"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Unidad</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de Resumen del Inventario */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-700">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Total Flota</span>
            <span className="text-base font-mono font-semibold text-slate-900">{totalUnidades}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-700">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Por Odómetro</span>
            <span className="text-base font-mono font-semibold text-emerald-800">{unidadesKm} unid.</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-700">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">Por Horómetro</span>
            <span className="text-base font-mono font-semibold text-amber-800">{unidadesHoras} unid.</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center text-rose-700">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block">En Taller</span>
            <span className="text-base font-mono font-semibold text-rose-800">{unidadesMantenimiento} unid.</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros Combinados */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2.5">
        <div className="flex flex-col md:flex-row gap-2">
          {/* Buscador */}
          <div className="flex-1 flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa, tipo, marca, modelo, ubicación o conductor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtro Ubicación */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value="TODOS">Todas las Ubicaciones</option>
              {ubicacionesDisponibles.map((ub) => (
                <option key={ub} value={ub}>
                  📍 {ub}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo Medición */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroTipoMedicion}
              onChange={(e) => setFiltroTipoMedicion(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value="TODOS">Todos los Controles</option>
              <option value="KILOMETROS">Odómetro (Km)</option>
              <option value="HORAS">Horas (Horómetro)</option>
              <option value="SIN_CONTROL">Sin Control</option>
            </select>
          </div>

          {/* Filtro Categoría */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value="TODOS">Todas las Categorías</option>
              <option value="MAQUINARIA">Maquinaria Pesada</option>
              <option value="PESADO">Camiones / Vagonetas</option>
              <option value="PASAJEROS">Buses / Busetas</option>
              <option value="LIVIANO">Pick ups / Livianos / Motos</option>
            </select>
          </div>

          {/* Filtro Estado Financiero */}
          <div className="flex items-center space-x-1.5">
            <select
              value={filtroEstadoFinanciero}
              onChange={(e) => setFiltroEstadoFinanciero(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium rounded-md px-2.5 py-1.5 focus:outline-none"
            >
              <option value="TODOS">Estado Financiero</option>
              <option value="Libre">Libre (Propio)</option>
              <option value="Leasing">Leasing</option>
              <option value="Préstamo">Préstamo</option>
              <option value="Alquiler">Alquiler</option>
            </select>
          </div>
        </div>

        {/* Badges de filtros activos */}
        {(filtroUbicacion !== 'TODOS' || filtroTipoMedicion !== 'TODOS' || filtroCategoria !== 'TODOS' || filtroEstadoFinanciero !== 'TODOS' || busqueda) && (
          <div className="flex items-center flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-medium">Filtros:</span>
            {busqueda && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>Búsqueda: "{busqueda}"</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setBusqueda('')} />
              </span>
            )}
            {filtroUbicacion !== 'TODOS' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>Ubicación: {filtroUbicacion}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFiltroUbicacion('TODOS')} />
              </span>
            )}
            {filtroTipoMedicion !== 'TODOS' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>Control: {filtroTipoMedicion}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFiltroTipoMedicion('TODOS')} />
              </span>
            )}
            {filtroCategoria !== 'TODOS' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>Categoría: {filtroCategoria}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFiltroCategoria('TODOS')} />
              </span>
            )}
            {filtroEstadoFinanciero !== 'TODOS' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center space-x-1">
                <span>Financiero: {filtroEstadoFinanciero}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFiltroEstadoFinanciero('TODOS')} />
              </span>
            )}
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroUbicacion('TODOS');
                setFiltroTipoMedicion('TODOS');
                setFiltroCategoria('TODOS');
                setFiltroEstadoFinanciero('TODOS');
              }}
              className="text-slate-500 hover:text-slate-900 underline ml-2 cursor-pointer font-medium"
            >
              Restablecer todo
            </button>
          </div>
        )}
      </div>

      {/* VISTA 1: TABLA DE INVENTARIO */}
      {vistaModo === 'TABLA' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5 w-10 text-center">N°</th>
                  <th className="px-3.5 py-2.5 w-16 text-center">Foto</th>
                  <th className="px-3.5 py-2.5 font-semibold">Tipo</th>
                  <th className="px-3.5 py-2.5 font-semibold">Marca & Modelo</th>
                  <th className="px-3.5 py-2.5 font-semibold">Placa</th>
                  <th className="px-3.5 py-2.5 font-semibold">Ubicación</th>
                  <th className="px-3.5 py-2.5 font-semibold">Lectura (21/7/2025)</th>
                  <th className="px-3.5 py-2.5 font-semibold">Control</th>
                  <th className="px-3.5 py-2.5 font-semibold">Financiero</th>
                  <th className="px-3.5 py-2.5 font-semibold">Tanque</th>
                  <th className="px-3.5 py-2.5 font-semibold">Estado</th>
                  <th className="px-3.5 py-2.5 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehiculosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron vehículos registrados con esos criterios de búsqueda.
                    </td>
                  </tr>
                ) : (
                  vehiculosFiltrados.map((v) => {
                    const isHoras = v.tipoControlMedicion === 'HORAS' || v.controlaKilometraje === 'Por horas';
                    const isSinControl = v.tipoControlMedicion === 'NO_APLICA' || v.controlaKilometraje === false || v.controlaKilometraje === 'No';

                    return (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        {/* Serie # */}
                        <td className="px-3.5 py-2.5 text-center font-mono font-medium text-slate-900 bg-slate-50/50">
                          {v.numeroSerie ?? '-'}
                        </td>

                        {/* Fotografía Miniatura con botón para ampliar */}
                        <td className="px-3.5 py-2.5 text-center">
                          <div
                            onClick={() => setFotoModalVehiculo(v)}
                            className="relative group w-12 h-9 rounded overflow-hidden border border-slate-200 mx-auto cursor-pointer bg-slate-100 flex items-center justify-center"
                          >
                            {v.imagenUrl ? (
                              <img
                                src={v.imagenUrl}
                                alt={`${v.marca} ${v.modelo}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Truck className="w-4 h-4 text-slate-400" />
                            )}
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        </td>

                        {/* Tipo de Vehículo */}
                        <td className="px-3.5 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                          {v.tipoVehiculo || 'Vehículo'}
                        </td>

                        {/* Marca & Modelo */}
                        <td className="px-3.5 py-2.5">
                          <div className="font-medium text-slate-900">{v.marca}</div>
                          <div className="text-[11px] text-slate-500">{v.modelo}</div>
                        </td>

                        {/* Placa */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs inline-block">
                            {v.placa}
                          </span>
                        </td>

                        {/* Ubicación */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center space-x-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span>{v.ubicacion || 'Sede Central'}</span>
                          </span>
                        </td>

                        {/* Kilometraje / Horómetro */}
                        <td className="px-3.5 py-2.5">
                          <div className="font-mono font-medium text-slate-900 text-xs">
                            {v.odometroActual > 0
                              ? v.odometroActual.toLocaleString('es-CR')
                              : 'N/A'}
                            {isHoras && v.odometroActual > 0 ? (
                              <span className="text-[10px] font-sans text-amber-700 font-medium ml-1">hrs</span>
                            ) : !isSinControl && v.odometroActual > 0 ? (
                              <span className="text-[10px] font-sans text-slate-500 ml-1">km</span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            Reg: {v.fechaLecturaInicial || '21/7/2025'}
                          </span>
                        </td>

                        {/* Tipo de Control */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {isHoras ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Por horas
                            </span>
                          ) : isSinControl ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              No aplica
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Sí (Km)
                            </span>
                          )}
                        </td>

                        {/* Estado Financiero */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          {renderBadgeFinanciero(v.estadoFinanciero)}
                        </td>

                        {/* Tanque */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="font-mono text-slate-800">{v.capacidadTanqueLitros} L</div>
                          <div className="text-[10px] text-slate-500">{v.tipoCombustible}</div>
                        </td>

                        {/* Estado */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              v.estado === 'Activo'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : v.estado === 'En Mantenimiento'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {v.estado}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => setFotoModalVehiculo(v)}
                              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Ver Ficha y Foto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(v)}
                              className="p-1 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(v.id, v.placa)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 2: CUADRÍCULA / TARJETAS */}
      {vistaModo === 'CUADRICULA' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {vehiculosFiltrados.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 text-xs">
              No se encontraron unidades registradas con ese criterio.
            </div>
          ) : (
            vehiculosFiltrados.map((v) => {
              const isHoras = v.tipoControlMedicion === 'HORAS' || v.controlaKilometraje === 'Por horas';
              const isSinControl = v.tipoControlMedicion === 'NO_APLICA' || v.controlaKilometraje === false || v.controlaKilometraje === 'No';

              return (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  {/* Foto del vehículo */}
                  <div className="relative h-36 bg-slate-100 overflow-hidden group">
                    {v.imagenUrl ? (
                      <img
                        src={v.imagenUrl}
                        alt={`${v.marca} ${v.modelo}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Truck className="w-10 h-10" />
                      </div>
                    )}

                    {/* Badge Serie # en la foto */}
                    <div className="absolute top-2 left-2 bg-slate-900/80 text-white font-mono font-medium text-xs px-2 py-0.5 rounded">
                      #{v.numeroSerie ?? '-'}
                    </div>

                    {/* Badge Estado */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          v.estado === 'Activo'
                            ? 'bg-emerald-600 text-white'
                            : v.estado === 'En Mantenimiento'
                            ? 'bg-amber-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {v.estado}
                      </span>
                    </div>

                    {/* Overlay para ver foto */}
                    <button
                      onClick={() => setFotoModalVehiculo(v)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-md bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                      title="Ampliar Foto"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Cuerpo de la Tarjeta */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-medium text-slate-500 uppercase">
                          {v.tipoVehiculo || 'Vehículo'}
                        </span>
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {v.placa}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900 text-sm">
                        {v.marca} {v.modelo}
                      </h3>

                      <div className="flex items-center space-x-1 text-slate-500 text-xs mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{v.ubicacion || 'Sede Central'}</span>
                      </div>
                    </div>

                    {/* Ficha métrica compacta */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">
                          {isHoras ? 'Horómetro' : 'Odómetro'}
                        </span>
                        <span className="font-mono font-semibold text-slate-900">
                          {v.odometroActual > 0 ? v.odometroActual.toLocaleString('es-CR') : 'N/A'}{' '}
                          <span className="text-[10px] text-slate-500 font-sans font-normal">
                            {isHoras ? 'hrs' : 'km'}
                          </span>
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block">Financiero</span>
                        <div>{renderBadgeFinanciero(v.estadoFinanciero)}</div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end space-x-1 pt-2.5 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center space-x-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDelete(v.id, v.placa)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL VISOR DE FOTOGRAFÍA Y FICHA DETALLADA */}
      {fotoModalVehiculo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setFotoModalVehiculo(null)}
        >
          <div
            className="w-full max-w-xl bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-900 text-white font-mono font-medium text-xs flex items-center justify-center">
                  #{fotoModalVehiculo.numeroSerie ?? '-'}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {fotoModalVehiculo.marca} {fotoModalVehiculo.modelo}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {fotoModalVehiculo.tipoVehiculo} • Placa:{' '}
                    <span className="font-mono font-medium text-slate-800">{fotoModalVehiculo.placa}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFotoModalVehiculo(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Imagen Principal en Alta Resolución */}
            <div className="relative bg-slate-900 max-h-80 min-h-[180px] flex items-center justify-center overflow-hidden group">
              {fotoModalVehiculo.imagenUrl ? (
                <img
                  src={fotoModalVehiculo.imagenUrl}
                  alt={`${fotoModalVehiculo.marca} ${fotoModalVehiculo.modelo}`}
                  className="w-full max-h-80 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-12 text-center text-slate-500">
                  <Truck className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <span className="text-xs">Sin fotografía registrada</span>
                </div>
              )}

              {/* Botón flotante para subir/cambiar fotografía */}
              <div className="absolute bottom-2.5 right-2.5">
                <label className="cursor-pointer bg-slate-900/90 hover:bg-slate-900 text-white px-2.5 py-1.5 rounded-md font-medium text-xs flex items-center space-x-1.5 border border-slate-700 transition-colors">
                  <Camera className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{subiendoFoto ? 'Subiendo...' : 'Cambiar Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={subiendoFoto}
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && fotoModalVehiculo) handleSubirFotoDirecta(fotoModalVehiculo.id, f);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Ficha de Información */}
            <div className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Ubicación</span>
                  <span className="font-medium text-slate-900 text-xs">📍 {fotoModalVehiculo.ubicacion || 'Sede Central'}</span>
                </div>

                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">
                    {fotoModalVehiculo.tipoControlMedicion === 'HORAS' || fotoModalVehiculo.controlaKilometraje === 'Por horas'
                      ? 'Horómetro'
                      : 'Odómetro'}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 text-xs">
                    {fotoModalVehiculo.odometroActual > 0 ? fotoModalVehiculo.odometroActual.toLocaleString('es-CR') : 'N/A'}{' '}
                    {fotoModalVehiculo.tipoControlMedicion === 'HORAS' || fotoModalVehiculo.controlaKilometraje === 'Por horas' ? 'hrs' : 'km'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Tanque</span>
                  <span className="font-medium text-slate-900 text-xs">
                    {fotoModalVehiculo.capacidadTanqueLitros} L ({fotoModalVehiculo.tipoCombustible})
                  </span>
                </div>

                <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Estado Financiero</span>
                  <div className="mt-0.5">
                    {renderBadgeFinanciero(fotoModalVehiculo.estadoFinanciero)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    const veh = fotoModalVehiculo;
                    setFotoModalVehiculo(null);
                    handleOpenEdit(veh);
                  }}
                  className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Unidad</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR / EDITAR VEHÍCULO */}
      {modalOpen && vehiculoEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white border border-slate-200 rounded-lg p-5 shadow-xl space-y-3.5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-slate-800" />
                <h3 className="text-sm font-semibold text-slate-900">
                  {vehiculoEdit.id ? 'Editar Ficha del Vehículo' : 'Registrar Nueva Unidad'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">N° Serie (#) *</label>
                  <input
                    type="number"
                    required
                    value={vehiculoEdit.numeroSerie || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, numeroSerie: Number(e.target.value) })}
                    placeholder="Ej. 1, 2..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Tipo de Vehículo *</label>
                  <select
                    value={vehiculoEdit.tipoVehiculo || 'Camión'}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, tipoVehiculo: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="Backhoe">Backhoe (Retroexcavadora)</option>
                    <option value="Vagoneta">Vagoneta</option>
                    <option value="Hormigonera">Hormigonera</option>
                    <option value="Moto">Moto</option>
                    <option value="Camión">Camión</option>
                    <option value="Camion plataforma">Camión plataforma</option>
                    <option value="Buseta">Buseta</option>
                    <option value="Bus">Bus</option>
                    <option value="Mini cargador">Mini cargador</option>
                    <option value="Pick up">Pick up</option>
                    <option value="Carro personal">Carro personal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Placa *</label>
                  <input
                    type="text"
                    required
                    value={vehiculoEdit.placa || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, placa: e.target.value })}
                    placeholder="Ej. CL285360"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 uppercase font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Marca *</label>
                  <input
                    type="text"
                    required
                    value={vehiculoEdit.marca || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, marca: e.target.value })}
                    placeholder="Ej. Toyota, Mack..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Modelo *</label>
                  <input
                    type="text"
                    required
                    value={vehiculoEdit.modelo || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, modelo: e.target.value })}
                    placeholder="Ej. Hilux, QKR55L..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Ubicación</label>
                  <input
                    type="text"
                    value={vehiculoEdit.ubicacion || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, ubicacion: e.target.value })}
                    placeholder="Ej. Nosara, Zapotal..."
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Control / Medición</label>
                  <select
                    value={
                      vehiculoEdit.tipoControlMedicion ||
                      (vehiculoEdit.controlaKilometraje === 'Por horas' ? 'HORAS' : 'KILOMETROS')
                    }
                    onChange={(e) => {
                      const val = e.target.value as 'KILOMETROS' | 'HORAS' | 'NO_APLICA';
                      setVehiculoEdit({
                        ...vehiculoEdit,
                        tipoControlMedicion: val,
                        controlaKilometraje: val === 'HORAS' ? 'Por horas' : val === 'KILOMETROS' ? true : false,
                      });
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="KILOMETROS">Odómetro (Km)</option>
                    <option value="HORAS">Horómetro (Horas)</option>
                    <option value="NO_APLICA">Sin Control</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">
                    Lectura al 21/7/2025
                  </label>
                  <input
                    type="number"
                    value={vehiculoEdit.odometroActual ?? ''}
                    onChange={(e) =>
                      setVehiculoEdit({
                        ...vehiculoEdit,
                        odometroActual: Number(e.target.value),
                        odometroInicial: Number(e.target.value),
                      })
                    }
                    placeholder="Ej. 294105"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Combustible</label>
                  <select
                    value={vehiculoEdit.tipoCombustible || 'Diesel'}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, tipoCombustible: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Gasolina Regular">Gasolina Regular</option>
                    <option value="Gasolina Premium">Gasolina Super</option>
                    <option value="Gas LP">Gas LP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Tanque (Litros)</label>
                  <input
                    type="number"
                    value={vehiculoEdit.capacidadTanqueLitros || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, capacidadTanqueLitros: Number(e.target.value) })}
                    placeholder="Ej. 80"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Rendimiento (km/L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={vehiculoEdit.rendimientoTeoricoKmL || ''}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, rendimientoTeoricoKmL: Number(e.target.value) })}
                    placeholder="Ej. 10.5"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Financiero</label>
                  <select
                    value={vehiculoEdit.estadoFinanciero || 'Libre'}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, estadoFinanciero: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="Libre">Libre (Propio)</option>
                    <option value="Leasing">Leasing</option>
                    <option value="Préstamo">Préstamo</option>
                    <option value="Alquiler">Alquiler</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-0.5">Estado</label>
                  <select
                    value={vehiculoEdit.estado || 'Activo'}
                    onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, estado: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Sección de Fotografía del Vehículo */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-slate-800 text-xs">
                    Fotografía del Vehículo
                  </label>
                  <span className="text-[10px] text-slate-500">Cámara, archivo o URL</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  {/* Vista previa miniatura */}
                  <div className="w-20 h-16 rounded-md bg-slate-200 border border-slate-300 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {vehiculoEdit.imagenUrl ? (
                      <>
                        <img
                          src={vehiculoEdit.imagenUrl}
                          alt="Previsualización"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setVehiculoEdit({ ...vehiculoEdit, imagenUrl: '' })}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] hover:bg-rose-700"
                          title="Eliminar foto"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <div className="text-center text-slate-400">
                        <Truck className="w-5 h-5 mx-auto" />
                      </div>
                    )}
                  </div>

                  {/* Controles de subida */}
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="w-full cursor-pointer bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1.5 rounded-md font-medium text-xs flex items-center justify-center space-x-1.5 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-slate-600" />
                      <span>Subir Foto / Archivo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setVehiculoEdit({ ...vehiculoEdit, imagenUrl: reader.result as string });
                            };
                            reader.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={vehiculoEdit.imagenUrl || ''}
                      onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, imagenUrl: e.target.value })}
                      placeholder="O pega una URL: https://images.unsplash.com/photo-..."
                      className="w-full px-2.5 py-1 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 text-[11px] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-0.5">Conductor Asignado</label>
                <select
                  value={vehiculoEdit.conductorId || ''}
                  onChange={(e) => setVehiculoEdit({ ...vehiculoEdit, conductorId: e.target.value || undefined })}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 bg-white"
                >
                  <option value="">-- Sin conductor asignado --</option>
                  {conductores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.licencia || 'Conductor'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-3.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar Unidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
