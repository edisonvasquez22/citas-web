import React, { useEffect, useState } from 'react';
import { ApiErrorBody, SolicitudReprogramacionApi, UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const PRESET_MOTIVOS = [
  'El nuevo horario ya no está disponible para el profesional.',
  'Solicitud duplicada o ya gestionada previamente.',
  'Cambio de sede no autorizado para esta especialidad.',
  'Información insuficiente para validar la solicitud.'
];

interface RechazarReprogramacionModalProps {
  solicitud: SolicitudReprogramacionApi | null;
  session: UserSession;
  onClose: () => void;
  onRechazada: (actualizado: SolicitudReprogramacionApi) => void;
  onStale: (solicitudId: number) => void;
}

/** HU-020: POST /api/admin/reschedules/{id}/reject contra el backend real. */
export const RechazarReprogramacionModal: React.FC<RechazarReprogramacionModalProps> = ({
  solicitud,
  session,
  onClose,
  onRechazada,
  onStale
}) => {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (solicitud) {
      setMotivo('');
      setError(null);
    }
  }, [solicitud]);

  if (!solicitud) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = motivo.trim();
    if (!trimmed) {
      setError('El motivo de rechazo es obligatorio y no puede estar vacío.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/admin/reschedules/${solicitud.solicitudId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ motivo: trimmed })
      });

      if (resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || 'No se pudo rechazar la solicitud. Verifica el motivo ingresado.');
        return;
      }
      if (resp.status === 404 || resp.status === 409) {
        onStale(solicitud.solicitudId);
        onClose();
        return;
      }
      if (!resp.ok) {
        setError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      const actualizado: SolicitudReprogramacionApi = await resp.json();
      onRechazada(actualizado);
      onClose();
    } catch {
      setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#233144]/50 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col border border-[#e6eeff]">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#ba1a1a] to-[#ffdad6]"></div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
              </div>
              <div>
                <h2 className="font-display text-[19px] font-bold text-[#0d1c2e] leading-tight">Rechazar Reprogramación</h2>
                <span className="text-[12px] text-[#436088] font-mono">
                  Solicitud #{solicitud.solicitudId} • Cita #{solicitud.citaId}
                </span>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-[#6e797a] hover:text-[#0d1c2e] rounded-full p-1 transition">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <p className="text-[13px] text-[#3e494a] mb-4 leading-relaxed">
            Al rechazar, la cita conserva su horario original y el motivo queda visible para el paciente.
          </p>

          <form onSubmit={handleSubmit} className="space-y-2">
            <label className="text-[13px] font-semibold text-[#0d1c2e] flex items-center justify-between">
              <span>
                Motivo de la Decisión <span className="text-[#ba1a1a]">*</span>
              </span>
              <span className="text-[11px] text-[#6e797a] font-normal">Requerido</span>
            </label>

            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                if (error) setError(null);
              }}
              rows={4}
              placeholder="Especifica el motivo por el cual no es posible aprobar esta reprogramación..."
              className={`w-full rounded-xl bg-[#eff4ff] text-[#0d1c2e] text-[13.5px] p-3 outline-none border transition resize-none placeholder:text-[#6e797a] ${
                error ? 'border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/30' : 'border-[#d5e3fc] focus:border-[#006066] focus:bg-white'
              }`}
              autoFocus
            />

            {error && (
              <div className="flex items-center gap-1.5 text-[#ba1a1a] text-[12px] pt-1">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{error}</span>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-[#e6eeff]">
              <span className="text-[11px] text-[#6e797a] block mb-2 font-medium">Motivos frecuentes:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_MOTIVOS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setMotivo(preset);
                      setError(null);
                    }}
                    className="px-2.5 py-1 rounded-full bg-[#e6eeff] text-[#436088] text-[11px] hover:bg-[#d5e3fc] hover:text-[#0d1c2e] transition text-left"
                  >
                    {preset.length > 30 ? preset.slice(0, 28) + '...' : preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#eff4ff] -mx-6 -mb-6 mt-6 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-[#dce9ff]">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[#436088] hover:text-[#0d1c2e] text-[13px] font-semibold transition">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#ba1a1a] text-white text-[13px] font-semibold hover:bg-[#93000a] transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[17px]">done</span>
                <span>{submitting ? 'Rechazando...' : 'Confirmar Rechazo'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
