import React, { useState } from 'react';
import { ApiErrorBody, CierreResponse, MiCitaApi, UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface CancelarCitaModalProps {
  session: UserSession;
  cita: MiCitaApi;
  resumen: { sedeNombre: string; especialidadNombre: string; profesionalNombre: string };
  onClose: () => void;
  onCancelada: (resultado: CierreResponse) => void;
}

/** HU-018: POST /api/appointments/{id}/cancel contra el backend real. */
export const CancelarCitaModal: React.FC<CancelarCitaModalProps> = ({
  session,
  cita,
  resumen,
  onClose,
  onCancelada
}) => {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setEnviando(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/appointments/${cita.citaId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      if (resp.status === 409 || resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || 'Esta cita ya no se puede cancelar.');
        return;
      }
      if (!resp.ok) {
        setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
        return;
      }

      const resultado: CierreResponse = await resp.json();
      onCancelada(resultado);
    } catch {
      setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#233144]/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-[#d5e3fc]">
        <div className="p-5 bg-[#eff4ff] flex items-start justify-between gap-3 border-b border-[#e6eeff]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">event_busy</span>
            </div>
            <div>
              <h2 id="cancel-modal-title" className="font-display text-lg font-bold text-[#0d1c2e]">
                Cancelar Cita Médica
              </h2>
              <p className="text-xs text-[#3e494a]">Se liberará el cupo en el sistema central</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#3e494a] hover:text-[#0d1c2e] p-1.5 rounded-lg hover:bg-[#dce9ff] transition-colors"
            title="Cerrar ventana"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-[#0d1c2e]">¿Estás seguro de que deseas cancelar la siguiente cita?</p>

          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e6eeff] flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-start">
              <span className="text-[#3e494a]">Especialidad:</span>
              <span className="font-semibold text-[#0d1c2e] text-right">{resumen.especialidadNombre}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[#3e494a]">Profesional:</span>
              <span className="font-medium text-[#0d1c2e] text-right">{resumen.profesionalNombre}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[#3e494a]">Sede:</span>
              <span className="text-[#0d1c2e] text-right max-w-xs">{resumen.sedeNombre}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-[#e6eeff]">
              <span className="text-[#3e494a]">Fecha &amp; Hora:</span>
              <span className="font-bold text-[#006066]">
                {cita.inicio.replace('T', ' ').slice(0, 16)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-950 rounded-xl flex items-start gap-2.5 text-xs border border-red-200">
              <span className="material-symbols-outlined text-[20px] text-[#ba1a1a] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 border border-amber-200">
            <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0 mt-0.5">warning</span>
            <p className="text-amber-900 leading-snug">
              Esta acción libera de inmediato tu turno. Una vez cancelada, el cupo queda disponible para otros
              pacientes y no puede reactivarse.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#eff4ff] flex items-center justify-end gap-3 border-t border-[#e6eeff]">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#436088] hover:bg-[#dce9ff] transition-colors disabled:opacity-50"
          >
            Conservar Cita
          </button>
          <button
            type="button"
            disabled={enviando}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white shadow-md hover:bg-[#93000a] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {enviando ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Sí, Cancelar Cita</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
