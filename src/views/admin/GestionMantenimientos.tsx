/**
 * Bitácora y Registro de Mantenimientos de la Flota (Admin)
 */

import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, DollarSign, Truck, Search, X, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { Mantenimiento, Vehiculo } from '../../types';

export const GestionMantenimientos: React.FC = () => {
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [mantenimientoEdit, setMantenimientoEdit] = useState<Partial<Mantenimiento> | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [mants, vehs] = await Promise.all([api.getMantenimientos(), api.getVehiculos()]);
      setMantenimientos(mants);
      setVehiculos(vehs);
    } catch (e) {
      console.error('Error cargando mantenimientos:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalOpen) {
        setModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  const handleOpenAdd = () => {
    const v = vehiculos[0];
    setMantenimientoEdit({
      vehiculoId: v?.id || '',
      vehiculoPlaca: v?.placa || '',
      fecha: new Date().toISOString().split('T')[0],
      odometroKm: v ? v.odometroActual : 50000,
      tipo: 'Preventivo',
      taller: 'Taller Central de Flota',
      descripcion: 'Servicio mayor de afinación, cambio de aceite sintético y filtros',
      costo: 85000,
      proximoMantenimientoKm: v ? v.odometroActual + 10000 : 60000,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mantenimientoEdit) return;

    setGuardando(true);
    try {
      await api.createMantenimiento(mantenimientoEdit);
      setModalOpen(false);
      setMantenimientoEdit(null);
      await cargarDatos();
    } catch (err: any) {
      alert(`Error al registrar mantenimiento: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  const mantenimientosFiltrados = mantenimientos.filter(
    (m) =>
      m.vehiculoPlaca.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.taller.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
      m.descripcion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalInvertido = mantenimientos.reduce((acc, m) => acc + m.costo, 0);

  return (
    <div className="space-y-4 w-full pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 leading-tight">Bitácora de Mantenimientos</h1>
            <p className="text-xs text-slate-500">
              Control de servicios preventivos, correctivos, afinaciones y talleres mecánicos
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-right hidden sm:block">
            <span className="text-[10px] text-slate-500 block font-medium">Inversión Total Servicios</span>
            <span className="text-xs font-mono font-semibold text-slate-900">₡{Math.round(totalInvertido).toLocaleString('es-CR')} CRC</span>
          </div>

          <button
            id="btn-add-maintenance"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Servicio</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por placa, taller, tipo de servicio o descripción..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
        />
      </div>

      {/* Lista de Registros */}
      <div className="space-y-2.5">
        {mantenimientosFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500 text-xs">
            <Wrench className="w-6 h-6 mx-auto mb-2 text-slate-400" />
            No se encontraron mantenimientos con ese criterio de búsqueda.
          </div>
        ) : (
          mantenimientosFiltrados.map((m) => (
            <div
              key={m.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 space-y-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {m.vehiculoPlaca}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">{m.tipo}</span>
                  <span className="text-[10px] text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded font-mono border border-slate-200">
                    {m.odometroKm.toLocaleString('es-CR')} km
                  </span>
                </div>
                <p className="text-xs text-slate-700">{m.descripcion}</p>
                <p className="text-[11px] text-slate-500">
                  Taller: <span className="text-slate-800 font-medium">{m.taller}</span> • Fecha: {new Date(m.fecha).toLocaleDateString('es-CR')} • Registró: {m.registradoPor}
                </p>
              </div>

              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-sm font-mono font-semibold text-slate-900 block">
                  ₡{Math.round(m.costo).toLocaleString('es-CR')}
                </span>
                {m.proximoMantenimientoKm && (
                  <span className="text-[10px] text-slate-500 font-mono">
                    Próx: {m.proximoMantenimientoKm.toLocaleString('es-CR')} km
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Registrar Mantenimiento */}
      {modalOpen && mantenimientoEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-5 shadow-xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-semibold text-slate-900">Registrar Mantenimiento</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Vehículo *</label>
                  <select
                    value={mantenimientoEdit.vehiculoId}
                    onChange={(e) => {
                      const v = vehiculos.find((x) => x.id === e.target.value);
                      if (v) {
                        setMantenimientoEdit({
                          ...mantenimientoEdit,
                          vehiculoId: v.id,
                          vehiculoPlaca: v.placa,
                          odometroKm: v.odometroActual,
                        });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.placa} - {v.marca} {v.modelo}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tipo de Servicio</label>
                  <select
                    value={mantenimientoEdit.tipo}
                    onChange={(e) => setMantenimientoEdit({ ...mantenimientoEdit, tipo: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                  >
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                    <option value="Cambio de Aceite">Cambio de Aceite</option>
                    <option value="Frenos">Frenos</option>
                    <option value="Neumáticos">Neumáticos</option>
                    <option value="Afinación">Afinación</option>
                    <option value="Inspección General">Inspección General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kilometraje Actual</label>
                  <input
                    type="number"
                    value={mantenimientoEdit.odometroKm}
                    onChange={(e) => setMantenimientoEdit({ ...mantenimientoEdit, odometroKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Costo Total (₡ CRC)</label>
                  <input
                    type="number"
                    value={mantenimientoEdit.costo}
                    onChange={(e) => setMantenimientoEdit({ ...mantenimientoEdit, costo: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Próx. Servicio (km)</label>
                  <input
                    type="number"
                    value={mantenimientoEdit.proximoMantenimientoKm}
                    onChange={(e) => setMantenimientoEdit({ ...mantenimientoEdit, proximoMantenimientoKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 font-mono focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Taller / Proveedor Mecánico</label>
                <input
                  type="text"
                  value={mantenimientoEdit.taller}
                  onChange={(e) => setMantenimientoEdit({ ...mantenimientoEdit, taller: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Descripción del Servicio Realizado *</label>
                <textarea
                  rows={2}
                  required
                  value={mantenimientoEdit.descripcion}
                  onChange={(e) => setMantenimientoEdit({ ...mantenimientoEdit, descripcion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium disabled:opacity-50 transition-colors"
                >
                  {guardando ? 'Guardando...' : 'Guardar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
