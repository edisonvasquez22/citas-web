import React, { useEffect, useState } from 'react';
import { EstadoCita, HistorialEstadoApi } from '../types';
import { apiFetch } from '../api/session';
import { mensajeDeError } from '../api/errors';

const ESTADO_LABEL: Record<EstadoCita, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió'
};

const FUENTE_LABEL: Record<HistorialEstadoApi['fuente'], string> = {
  SYSTEM: 'Sistema',
  USER: 'Usuario',
  ADMIN: 'Administrador'
};

interface HistorialCitaModalProps {
  citaId: number | null;
  onClose: () => void;
}

/** HU-023 / RF-19: trazabilidad de solo lectura de los cambios de estado de una cita. */
export const HistorialCitaModal: React.FC<HistorialCitaModalProps> = ({ citaId, onClose }) => {
  const [registros, setRegistros] = useState<HistorialEstadoApi[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (citaId === null) return;
    let cancelado = false;
    setRegistros(null);
    setError(null);
    (async () => {
      try {
        const resp = await apiFetch(`/api/appointments/${citaId}/history`);
        if (!resp.ok) {
          const texto = await mensajeDeError(resp, 'No se pudo cargar el historial.');
          if (!cancelado) setError(texto);
          return;
        }
        const data: HistorialEstadoApi[] = await resp.json();
        if (!cancelado) setRegistros(data);
      } catch {
        if (!cancelado) setError('No se pudo contactar al servidor.');
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [citaId]);

  if (citaId === null) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="historial-title"
    >
      <div
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-[#e6eeff] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 id="historial-title" className="font-display font-semibold text-[18px] text-[#0d1c2e]">
              Historial de la cita #{citaId}
            </h3>
            <p className="text-[12px] text-[#6e797a]">Registro de auditoría inmutable.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[#6e797a] hover:text-[#0d1c2e] p-1 rounded-md hover:bg-[#eff4ff]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error ? (
          <p role="alert" className="text-[13px] bg-[#ffdad6] text-[#93000a] rounded-lg p-3">
            {error}
          </p>
        ) : registros === null ? (
          <div className="py-6 flex justify-center">
            <span className="material-symbols-outlined text-[28px] text-[#0d7a82] animate-spin">progress_activity</span>
          </div>
        ) : registros.length === 0 ? (
          <p className="text-[13px] text-[#6e797a]">Esta cita aún no tiene cambios de estado registrados.</p>
        ) : (
          <ol className="relative border-l-2 border-[#dce9ff] ml-2 space-y-4">
            {registros.map((r, i) => (
              <li key={i} className="ml-4">
                <span className="absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full bg-[#0d7a82] border-2 border-white" />
                <p className="text-[13px] font-semibold text-[#0d1c2e]">{ESTADO_LABEL[r.estado] ?? r.estado}</p>
                <p className="text-[12px] text-[#3e494a]">
                  {r.momento.replace('T', ' ').slice(0, 16)} · {FUENTE_LABEL[r.fuente] ?? r.fuente}
                  {r.actorUsuarioId !== null ? ` #${r.actorUsuarioId}` : ''}
                </p>
                {r.motivo && <p className="text-[12px] text-[#6e797a] mt-0.5">Motivo: {r.motivo}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
