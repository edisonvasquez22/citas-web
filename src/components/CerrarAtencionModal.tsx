import React, { useState } from 'react';
import { ApiErrorBody, CierreResponse, CitaAgendaApi, UserSession } from '../types';
import { API_URL, apiFetch } from '../api/session';


interface CerrarAtencionModalProps {
  session: UserSession;
  cita: CitaAgendaApi;
  accion: 'complete' | 'no-show';
  resumen: { especialidadNombre: string; sedeNombre: string };
  onClose: () => void;
  onCerrada: (resultado: CierreResponse) => void;
}

/** HU-022: POST /api/appointments/{id}/complete | /no-show. El backend no acepta nota de cierre (solo el estado). */
export const CerrarAtencionModal: React.FC<CerrarAtencionModalProps> = ({
  session,
  cita,
  accion,
  resumen,
  onClose,
  onCerrada
}) => {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const esCompletar = accion === 'complete';

  const handleConfirm = async () => {
    setEnviando(true);
    setError(null);
    try {
      const resp = await apiFetch(`${API_URL}/api/appointments/${cita.citaId}/${accion}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      if (resp.status === 400 || resp.status === 404) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || 'No se pudo registrar el cierre de esta cita.');
        return;
      }
      if (!resp.ok) {
        setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
        return;
      }

      const resultado: CierreResponse = await resp.json();
      onCerrada(resultado);
    } catch {
      setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e6eeff]">
        <div className="flex items-center justify-between pb-4 border-b border-[#e6eeff]">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${esCompletar ? 'bg-[#99f1f9] text-[#006066]' : 'bg-[#ffdad6] text-[#ba1a1a]'}`}>
              <span className="material-symbols-outlined text-[20px]">{esCompletar ? 'check_circle' : 'person_off'}</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-[#0d1c2e]">
                {esCompletar ? 'Confirmar Cierre de Atención' : 'Registrar Inasistencia'}
              </h3>
              <p className="text-xs text-[#3e494a] font-mono">Cita #{cita.citaId}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[#eff4ff] text-[#6e797a] hover:text-[#0d1c2e] transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <div className="bg-[#eff4ff] p-3 rounded-lg text-xs text-[#3e494a] flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#0d1c2e]">Especialidad:</span>
              <span>{resumen.especialidadNombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#0d1c2e]">Sede:</span>
              <span>{resumen.sedeNombre}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#0d1c2e]">Horario:</span>
              <span className="font-mono">{cita.inicio.replace('T', ' ').slice(0, 16)}</span>
            </div>
          </div>

          <p className="text-sm text-[#0d1c2e]">
            {esCompletar
              ? '¿Confirmas que la atención de esta cita se realizó?'
              : '¿Confirmas que el paciente no se presentó a esta cita?'}
          </p>

          {error && (
            <div className="p-3 bg-red-50 text-red-950 rounded-lg flex items-start gap-2.5 text-xs border border-red-200">
              <span className="material-symbols-outlined text-[18px] text-[#ba1a1a] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 rounded-lg bg-[#eff4ff] text-[#3e494a] hover:bg-[#e6eeff] text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={enviando}
              className={`px-5 py-2 rounded-lg text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 ${
                esCompletar ? 'bg-[#0d7a82] hover:bg-[#006066]' : 'bg-[#ba1a1a] hover:bg-[#93000a]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{esCompletar ? 'check' : 'person_off'}</span>
              {enviando ? 'Enviando...' : esCompletar ? 'Registrar Completada' : 'Confirmar Inasistencia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
