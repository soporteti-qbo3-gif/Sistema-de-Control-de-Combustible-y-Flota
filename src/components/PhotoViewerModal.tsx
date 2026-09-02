/**
 * Modal Visor de Fotos con Zoom para Auditoría de Tickets y Odómetros
 */

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Eye } from 'lucide-react';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  imageUrl?: string;
  subtitle?: string;
  metadata?: { label: string; value: string | number | undefined }[];
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  title,
  imageUrl,
  subtitle,
  metadata = [],
}) => {
  const [scale, setScale] = useState(1);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.3, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.3, 0.7));
  const resetZoom = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-white">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center">
              <Eye className="w-4 h-4 mr-2 text-slate-600" />
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono text-slate-600 w-10 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoom}
              className="p-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Restablecer zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 ml-1.5"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenido / Imagen */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 flex items-center justify-center min-h-[320px]">
          <div
            className="transition-transform duration-100 origin-center"
            style={{ transform: `scale(${scale})` }}
          >
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[60vh] max-w-full rounded-md object-contain border border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* Metadatos en pie de modal */}
        {metadata.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-200 bg-white flex flex-wrap gap-2 text-xs">
            {metadata.map((item, idx) => (
              <div key={idx} className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <span className="text-slate-500 mr-1.5">{item.label}:</span>
                <span className="font-medium text-slate-900">{item.value ?? 'N/A'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
