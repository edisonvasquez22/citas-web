import React, { useState } from 'react';
import { ApiErrorBody, AvailabilityBlockApi, SEDES, UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface DeleteAvailabilityBlockModalProps {
  block: AvailabilityBlockApi | null;
  session: UserSession;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

function horaCorta(hhmmss: string): string {
  return hhmmss.slice(0, 5);
}

export const DeleteAvailabilityBlockModal: React.FC<DeleteAvailabilityBlockModalProps> = ({
  block,
  session,
  onClose,
  onDeleted
}) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!block) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/professionals/me/availability-blocks/${block.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      if (resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || 'No se pudo eliminar el bloque.');
        return;
      }
      if (!resp.ok && resp.status !== 204) {
        setError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      onDeleted(block.id);
      onClose();
    } catch {
      setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-xl relative border border-[#e6eeff] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-[#ba1a1a]"></div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">delete_sweep</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-[17px] text-[#0d1c2e]">
                ¿Eliminar bloque de disponibilidad?
              </h3>
              <p className="text-[13px] text-[#3e494a] mt-1 leading-relaxed">
                Se liberará la franja de{' '}
                <strong className="text-[#0d1c2e]">
                  {horaCorta(block.horaInicio)} a {horaCorta(block.horaFin)} en {SEDES[block.sedeId].corto}
                </strong>{' '}
                del {block.fecha}. Los pacientes ya no verán esa oferta disponible.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-[#ffdad6] border-l-4 border-[#ba1a1a] rounded text-[12px] text-[#93000a] flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e6eeff]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#bdc9ca] text-[13px] font-semibold text-[#3e494a] hover:bg-[#eff4ff] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>{deleting ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
