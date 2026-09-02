/**
 * Pantalla de Subir Documentos y Registrar Carga (Mobile-First Stepper)
 * - 2 Pasos visuales compactos: 1. Factura, 2. Odómetro
 * - Áreas táctiles para cámara y archivo
 * - Botón de procesamiento siempre visible (Sticky Bottom)
 * - Animación de carga y feedback visual inmediato sin cambiar de pantalla
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Receipt,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Fuel,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Image as ImageIcon,
  Check,
  Zap,
  MessageSquare,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Vehiculo, SolicitudAutorizacion, DatosExtraidosIA } from '../../types';
import { PhotoViewerModal } from '../../components/PhotoViewerModal';

interface RegistrarCargaProps {
  setVistaActiva: (v: string) => void;
}

export const RegistrarCarga: React.FC<RegistrarCargaProps> = ({ setVistaActiva }) => {
  const { usuario } = useAuth();
  const [pasoActual, setPasoActual] = useState<1 | 2>(1);

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<Vehiculo | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudAutorizacion[]>([]);
  const [solicitudVinculada, setSolicitudVinculada] = useState<SolicitudAutorizacion | null>(null);

  // Imágenes en Base64
  const [fotoFacturaBase64, setFotoFacturaBase64] = useState<string | null>(null);
  const [fotoOdometroBase64, setFotoOdometroBase64] = useState<string | null>(null);

  // Estados de IA & Formulario
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [datosIA, setDatosIA] = useState<DatosExtraidosIA | null>(null);
  const [progresoScan, setProgresoScan] = useState(0);

  const [estacion, setEstacion] = useState('Bomba Nosara Central');
  const [numeroTicket, setNumeroTicket] = useState('');
  const [claveNumerica, setClaveNumerica] = useState('');
  const [esDuplicado, setEsDuplicado] = useState(false);
  const [duplicadoDetalle, setDuplicadoDetalle] = useState<string | null>(null);
  const [verificandoDuplicado, setVerificandoDuplicado] = useState(false);
  const [tipoCombustible, setTipoCombustible] = useState('Diesel');
  const [litros, setLitros] = useState<number>(45);
  const [precioPorLitro, setPrecioPorLitro] = useState<number>(685);
  const [totalPagado, setTotalPagado] = useState<number>(30825);
  const [odometroActual, setOdometroActual] = useState<number>(0);
  const [codigoAutorizacion, setCodigoAutorizacion] = useState('');
  const [notaConductor, setNotaConductor] = useState<string>('');
  const [mostrarCampoNota, setMostrarCampoNota] = useState<boolean>(false);

  const [guardando, setGuardando] = useState(false);
  const [exitoGuardado, setExitoGuardado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoViewer, setPhotoViewer] = useState<{ open: boolean; title: string; url?: string }>({
    open: false,
    title: '',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const [vehs, sols] = await Promise.all([api.getVehiculos(), api.getSolicitudes()]);
        setVehiculos(vehs);

        const miVeh = vehs.find((v) => v.id === usuario?.vehiculoAsignadoId) || vehs[0];
        if (miVeh) {
          setVehiculoSeleccionado(miVeh);
          setOdometroActual(miVeh.odometroActual + 120);
          setTipoCombustible(miVeh.tipoCombustible);
        }

        const aprobadas = sols.filter((s) => s.estado === 'APROBADA');
        setSolicitudes(aprobadas);
        if (aprobadas.length > 0) {
          setSolicitudVinculada(aprobadas[0]);
          setCodigoAutorizacion(aprobadas[0].codigoAutorizacion || '');
        }
      } catch (e) {
        console.error('Error cargando datos:', e);
      }
    };
    cargar();
  }, [usuario]);

  // Manejador de carga de archivos (Factura / Odómetro)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'factura' | 'odometro') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (tipo === 'factura') {
        setFotoFacturaBase64(base64);
        procesarConIA(base64, fotoOdometroBase64);
      } else {
        setFotoOdometroBase64(base64);
        procesarConIA(fotoFacturaBase64, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  // Escaneo IA con simulación/Gemini de alta precisión y auditoría anti-duplicados
  const procesarConIA = async (facturaImg: string | null, odometroImg: string | null) => {
    if (!facturaImg && !odometroImg) return;

    setAnalizandoIA(true);
    setProgresoScan(20);

    const interval = setInterval(() => {
      setProgresoScan((p) => (p < 90 ? p + 20 : p));
    }, 250);

    try {
      const res = await api.extraerDatosIA({
        fotoFacturaBase64: facturaImg || undefined,
        fotoOdometroBase64: odometroImg || undefined,
        odometroAnteriorReferencia: vehiculoSeleccionado?.odometroActual,
      });

      clearInterval(interval);
      setProgresoScan(100);
      setDatosIA(res);

      if (res.estacion) setEstacion(res.estacion);
      if (res.numeroTicket) setNumeroTicket(res.numeroTicket);
      if (res.claveNumerica) setClaveNumerica(res.claveNumerica);
      if (res.tipoCombustible) setTipoCombustible(res.tipoCombustible);
      if (res.litros) setLitros(res.litros);
      if (res.precioPorLitro) setPrecioPorLitro(res.precioPorLitro);
      if (res.totalPagado) setTotalPagado(res.totalPagado);
      if (res.odometroLeido && res.odometroLeido > 0) setOdometroActual(res.odometroLeido);

      if (res.esDuplicado) {
        setEsDuplicado(true);
        setDuplicadoDetalle(res.duplicadoDetalle || 'Esta factura ya se encuentra registrada en el sistema.');
      } else {
        setEsDuplicado(false);
        setDuplicadoDetalle(null);
      }
    } catch (err) {
      console.warn('Error en escaneo IA, usando valores locales:', err);
    } finally {
      clearInterval(interval);
      setTimeout(() => setAnalizandoIA(false), 300);
    }
  };

  const verificarDuplicadoManual = async (tkt: string) => {
    if (!tkt || tkt.trim().length < 3) {
      setEsDuplicado(false);
      setDuplicadoDetalle(null);
      return;
    }

    setVerificandoDuplicado(true);
    try {
      const res = await api.verificarDuplicadoFactura({
        numeroTicket: tkt.trim(),
        claveNumerica: claveNumerica || undefined,
        fecha: new Date().toISOString().split('T')[0],
        totalPagado: Number(totalPagado),
        litros: Number(litros),
        estacion,
        vehiculoId: vehiculoSeleccionado?.id,
      });

      if (res.esDuplicado) {
        setEsDuplicado(true);
        setDuplicadoDetalle(res.motivo || 'Este comprobante ya fue registrado previamente.');
      } else {
        setEsDuplicado(false);
        setDuplicadoDetalle(null);
      }
    } catch (e) {
      console.error('Error verificando duplicado:', e);
    } finally {
      setVerificandoDuplicado(false);
    }
  };

  const handleGuardarCarga = async () => {
    if (!vehiculoSeleccionado) {
      setErrorMsg('Por favor selecciona un vehículo');
      return;
    }

    if (litros <= 0 || totalPagado <= 0) {
      setErrorMsg('Los litros y total pagado deben ser mayores a 0');
      return;
    }

    if (esDuplicado) {
      setErrorMsg(`No es posible registrar una factura duplicada: ${duplicadoDetalle || 'Comprobante ya registrado.'}`);
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    try {
      await api.createCarga({
        vehiculoId: vehiculoSeleccionado.id,
        solicitudAutorizacionId: solicitudVinculada?.id,
        codigoAutorizacion: codigoAutorizacion || undefined,
        estacion: estacion || 'Estación Local',
        numeroTicket: numeroTicket || undefined,
        claveNumerica: claveNumerica || undefined,
        tipoCombustible: tipoCombustible || 'Diesel',
        litros: Number(litros),
        precioPorLitro: Number(precioPorLitro) || Number(totalPagado) / Number(litros),
        totalPagado: Number(totalPagado),
        odometroActual: Number(odometroActual),
        fotoFacturaBase64: fotoFacturaBase64 || undefined,
        fotoOdometroBase64: fotoOdometroBase64 || undefined,
        notaConductor: notaConductor.trim() || undefined,
        datosIA: {
          ...(datosIA || {}),
          numeroTicket: numeroTicket || datosIA?.numeroTicket,
          claveNumerica: claveNumerica || datosIA?.claveNumerica,
          estacion,
          litros: Number(litros),
          totalPagado: Number(totalPagado),
          odometroLeido: Number(odometroActual),
        },
      });

      setExitoGuardado(true);
      setTimeout(() => {
        setVistaActiva('conductor-cargas');
      }, 1500);
    } catch (err: any) {
      if (err.message && err.message.includes('DUPLICADA')) {
        setEsDuplicado(true);
        setDuplicadoDetalle(err.message);
      }
      setErrorMsg(err.message || 'Error al registrar la carga');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-between min-h-[calc(100vh-6rem)] pb-24 lg:pb-8">
      {/* Contenido Principal */}
      <div className="space-y-3">
        {/* Header y Stepper de 2 Pasos Compacto */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h1 className="text-sm font-semibold text-slate-900 leading-tight">
                Subir Documentos de Carga
              </h1>
              <p className="text-xs text-slate-500">
                {vehiculoSeleccionado?.placa} • {vehiculoSeleccionado?.marca}
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              Paso {pasoActual} de 2
            </span>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPasoActual(1)}
              className={`p-2 rounded-md border flex items-center space-x-2 transition-colors ${
                pasoActual === 1
                  ? 'bg-slate-900 text-white border-slate-900'
                  : fotoFacturaBase64
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <span className="text-[10px] block opacity-80 uppercase tracking-wider font-medium">
                  Paso 1
                </span>
                <span className="text-xs font-medium truncate block">1. Factura / Ticket</span>
              </div>
              {fotoFacturaBase64 && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 flex-shrink-0" />}
            </button>

            <button
              onClick={() => setPasoActual(2)}
              className={`p-2 rounded-md border flex items-center space-x-2 transition-colors ${
                pasoActual === 2
                  ? 'bg-slate-900 text-white border-slate-900'
                  : fotoOdometroBase64
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 flex-shrink-0" />
              <div className="text-left min-w-0">
                <span className="text-[10px] block opacity-80 uppercase tracking-wider font-medium">
                  Paso 2
                </span>
                <span className="text-xs font-medium truncate block">2. Odómetro</span>
              </div>
              {fotoOdometroBase64 && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 flex-shrink-0" />}
            </button>
          </div>
        </div>

        {/* Feedback de Análisis IA Inline */}
        {analizandoIA && (
          <div className="bg-slate-900 text-white rounded-lg p-3 flex items-center space-x-3">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
            <div className="flex-1">
              <p className="text-xs font-medium">Escaneando con IA Gemini...</p>
              <div className="w-full bg-slate-700 h-1 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-slate-200 h-full transition-all duration-200"
                  style={{ width: `${progresoScan}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 1: Subir Factura */}
        {pasoActual === 1 && (
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-600" />
                <span>Foto de la Factura o Comprobante</span>
              </span>
              {fotoFacturaBase64 && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Cargada con éxito
                </span>
              )}
            </div>

            {fotoFacturaBase64 ? (
              <div className="relative rounded-md overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                <img
                  src={fotoFacturaBase64}
                  alt="Factura"
                  className="w-full h-44 object-contain cursor-pointer"
                  onClick={() =>
                    setPhotoViewer({
                      open: true,
                      title: 'Factura de Combustible',
                      url: fotoFacturaBase64,
                    })
                  }
                />
                <label className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium rounded-md cursor-pointer">
                  Cambiar
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e, 'factura')}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-5 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors min-h-[130px]">
                <Camera className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="text-xs font-medium text-slate-900 text-center">
                  Tomar foto o subir factura
                </span>
                <span className="text-[11px] text-slate-500 text-center mt-0.5">
                  Extracción automática de litros, monto y estación
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(e, 'factura')}
                />
              </label>
            )}

            {/* ALERTA DE FACTURA DUPLICADA */}
            {esDuplicado && (
              <div className="bg-rose-50 border border-rose-200 rounded-md p-3 flex items-start space-x-2.5 text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-900">
                      Factura Duplicada Detectada
                    </h4>
                    <span className="text-[9px] bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded font-medium">
                      Bloqueado
                    </span>
                  </div>
                  <p className="text-xs mt-1 text-rose-800 leading-relaxed font-normal">
                    {duplicadoDetalle || 'Este número de factura ya fue registrado en el sistema.'}
                  </p>
                </div>
              </div>
            )}

            {/* BADGE DE SEGURIDAD FISCAL SI NO ES DUPLICADO */}
            {!esDuplicado && numeroTicket && numeroTicket.length >= 3 && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between text-slate-800 text-xs">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="font-normal text-[11px]">
                    Identificador Único Verificado: <strong className="font-mono text-slate-900">{numeroTicket}</strong>
                  </span>
                </div>
                <span className="text-[9px] bg-slate-200 text-slate-700 font-medium px-1.5 py-0.2 rounded">
                  Válido
                </span>
              </div>
            )}

            {/* Campos de Identificación de Factura y Estación */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <label className="text-[10px] font-medium text-slate-700 flex items-center space-x-1">
                      <span>N° Factura / Consecutivo</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    {verificandoDuplicado && (
                      <span className="text-[9px] text-slate-400 flex items-center">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin mr-1" />
                        Verificando...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Ej: FAC-109482 o Consecutivo"
                    value={numeroTicket}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNumeroTicket(val);
                      verificarDuplicadoManual(val);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-md border text-xs font-mono font-medium bg-white focus:outline-none transition-colors ${
                      esDuplicado
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900'
                        : 'border-slate-200 focus:border-slate-400 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-medium text-slate-700 block mb-0.5">
                    Estación / Gasolinera
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Servicentro La Sabana RECOPE"
                    value={estacion}
                    onChange={(e) => setEstacion(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs bg-white focus:outline-none focus:border-slate-400 text-slate-900"
                  />
                </div>
              </div>

              {/* Datos numéricos rápidos de factura */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                    Litros Cargados
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={litros || ''}
                    onChange={(e) => {
                      const l = parseFloat(e.target.value) || 0;
                      setLitros(l);
                      if (precioPorLitro > 0) setTotalPagado(Math.round(l * precioPorLitro));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                    Total Pagado (₡ CRC)
                  </label>
                  <input
                    type="number"
                    value={totalPagado || ''}
                    onChange={(e) => setTotalPagado(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setPasoActual(2)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-colors"
            >
              <span>Continuar al Odómetro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* PASO 2: Subir Odómetro */}
        {pasoActual === 2 && (
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-600" />
                <span>Foto del Odómetro / Horómetro</span>
              </span>
              {fotoOdometroBase64 && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Cargada con éxito
                </span>
              )}
            </div>

            {fotoOdometroBase64 ? (
              <div className="relative rounded-md overflow-hidden border border-slate-200 bg-slate-50 max-h-48 flex items-center justify-center">
                <img
                  src={fotoOdometroBase64}
                  alt="Odómetro"
                  className="w-full h-44 object-contain cursor-pointer"
                  onClick={() =>
                    setPhotoViewer({
                      open: true,
                      title: 'Foto del Odómetro',
                      url: fotoOdometroBase64,
                    })
                  }
                />
                <label className="absolute bottom-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-medium rounded-md cursor-pointer">
                  Cambiar
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e, 'odometro')}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-5 border border-dashed border-slate-300 hover:border-slate-400 rounded-lg bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors min-h-[130px]">
                <Camera className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="text-xs font-medium text-slate-900 text-center">
                  Tomar foto del tablero / odómetro
                </span>
                <span className="text-[11px] text-slate-500 text-center mt-0.5">
                  Lectura directa del kilometraje o conteo de horas
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(e, 'odometro')}
                />
              </label>
            )}

            {/* Lectura de Odómetro */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[10px] font-medium text-slate-500 block mb-0.5">
                Odómetro / Horómetro Actual
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={odometroActual || ''}
                  onChange={(e) => setOdometroActual(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 text-xs font-mono font-medium bg-white focus:outline-none focus:border-slate-400"
                />
                <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-md border border-slate-200">
                  {vehiculoSeleccionado?.tipoControlMedicion === 'HORAS' ? 'Horas' : 'Km'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setPasoActual(1)}
              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md flex items-center justify-center space-x-1.5 transition-colors border border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver a Factura</span>
            </button>
          </div>
        )}

        {/* Sección de Nota u Observación del Conductor (Opcional) */}
        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5 cursor-pointer" onClick={() => setMostrarCampoNota(!mostrarCampoNota)}>
              <MessageSquare className="w-3.5 h-3.5 text-slate-600" />
              <span>Nota u observación</span>
              <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                Opcional
              </span>
            </label>
            <button
              type="button"
              onClick={() => setMostrarCampoNota(!mostrarCampoNota)}
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {mostrarCampoNota ? 'Ocultar' : notaConductor ? 'Editar nota' : '+ Agregar'}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-1">
            Si el monto facturado, litros o el odómetro difieren de la bomba, anótalo aquí.
          </p>

          {(mostrarCampoNota || notaConductor.length > 0) && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
              <textarea
                rows={2}
                value={notaConductor}
                onChange={(e) => setNotaConductor(e.target.value)}
                placeholder="Ej: El cobro en tarjeta fue por ₡30,825 pero el ticket impreso se mojó..."
                className="w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-slate-400 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 transition-colors resize-none"
              />

              {/* Sugerencias Rápidas de Discrepancia */}
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-slate-400 self-center mr-1">Rápido:</span>
                {[
                  'Redondeo en bomba',
                  'Discrepancia ticket vs cobro',
                  'Odómetro con lectura parcial',
                  'Recarga de emergencia',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() =>
                      setNotaConductor((prev) =>
                        prev ? `${prev} • ${sug}` : sug
                      )
                    }
                    className="text-[10px] font-normal bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded transition-colors border border-slate-200"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de Error si existe */}
        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center space-x-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Confirmación de Éxito */}
        {exitoGuardado && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-xs">¡Carga Registrada Exitosamente!</p>
              <p className="text-[11px] text-emerald-700">Redirigiendo a tu historial de cargas...</p>
            </div>
          </div>
        )}
      </div>

      {/* Botón Sticky Bottom de Procesamiento (Siempre visible) */}
      <div className="sticky bottom-14 lg:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border border-slate-200 p-2.5 mt-3 rounded-lg">
        <button
          id="btn-procesar-carga"
          onClick={handleGuardarCarga}
          disabled={guardando || exitoGuardado || esDuplicado}
          className={`w-full min-h-[44px] py-2.5 px-4 rounded-md font-medium text-xs flex items-center justify-center space-x-2 transition-colors ${
            esDuplicado
              ? 'bg-rose-100 border border-rose-300 text-rose-700 cursor-not-allowed opacity-90'
              : 'bg-slate-900 hover:bg-slate-800 active:scale-[0.99] disabled:bg-slate-400 text-white'
          }`}
        >
          {guardando ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-300" />
              <span>Guardando y Validando...</span>
            </>
          ) : esDuplicado ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Factura Duplicada (Bloqueado)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Procesar y Registrar Carga</span>
            </>
          )}
        </button>
      </div>

      {/* Visor de Fotos Modal */}
      <PhotoViewerModal
        isOpen={photoViewer.open}
        onClose={() => setPhotoViewer({ open: false, title: '' })}
        title={photoViewer.title}
        imageUrl={photoViewer.url}
      />
    </div>
  );
};
