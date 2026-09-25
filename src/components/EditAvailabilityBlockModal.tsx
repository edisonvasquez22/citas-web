import React, { useEffect, useState } from 'react';
import { ApiErrorBody, AvailabilityBlockApi, SedeId, SEDES, UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface EditAvailabilityBlockModalProps {
  block: AvailabilityBlockApi | null;
  session: UserSession;
  onClose: () => void;
  onUpdated: (updated: AvailabilityBlockApi) => void;
}

function calcularDuracionMinutos(inicio: string, fin: string): number {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  return hF * 60 + mF - (hI * 60 + mI);
}

export const EditAvailabilityBlockModal: React.FC<EditAvailabilityBlockModalProps> = ({
  block,
  session,
  onClose,
  onUpdated
}) => {
  const [sedeId, setSedeId] = useState<SedeId>(1);
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('12:00');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (block) {
      setSedeId(block.sedeId);
      setFecha(block.fecha);
      setHoraInicio(block.horaInicio.slice(0, 5));
      setHoraFin(block.horaFin.slice(0, 5));
      setError(null);
    }
  }, [block]);

  if (!block) return null;

  const duracion = calcularDuracionMinutos(horaInicio, horaFin);
  const preview =
    duracion <= 0
      ? { text: 'Horario no válido (fin anterior a inicio)', valid: false }
      : duracion % 30 !== 0
      ? { text: 'La franja debe ser múltiplo de 30 minutos', valid: false }
      : { text: `${(duracion / 60).toFixed(1)} h • ${Math.floor(duracion / 30)} cupos de 30 min`, valid: true };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!preview.valid) {
      setError(preview.text);
      return;
    }

    setSaving(true);
    try {
      const resp = await fetch(`${API_URL}/api/professionals/me/availability-blocks/${block.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ sedeId, fecha, horaInicio: `${horaInicio}:00`, horaFin: `${horaFin}:00` })
      });

      if (resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || 'No se pudo actualizar el bloque.');
        return;
      }
      if (!resp.ok) {
        setError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      const actualizado: AvailabilityBlockApi = await resp.json();
      onUpdated(actualizado);
      onClose();
    } catch {
      setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
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
        className="bg-white rounded-xl max-w-lg w-full shadow-xl relative border border-[#e6eeff] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#436088]"></div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#e6eeff] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006066]">edit_calendar</span>
              <h3 className="font-display font-semibold text-[17px] text-[#0d1c2e]">Modificar Bloque de Disponibilidad</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-[#6e797a] hover:text-[#0d1c2e] p-1 rounded-md hover:bg-[#eff4ff]"
              aria-label="Cerrar modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {error && (
            <div className="p-3 bg-[#ffdad6] border-l-4 border-[#ba1a1a] rounded text-[12px] text-[#93000a] flex items-start gap-2">
              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-sede" className="text-[13px] font-semibold text-[#0d1c2e]">
                Sede Hospitalaria <span className="text-[#ba1a1a]">*</span>
              </label>
              <select
                id="edit-sede"
                value={sedeId}
                onChange={(e) => setSedeId(Number(e.target.value) as SedeId)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all"
              >
                {([1, 2] as SedeId[]).map((id) => (
                  <option key={id} value={id}>
                    {SEDES[id].nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-fecha" className="text-[13px] font-semibold text-[#0d1c2e]">
                Fecha <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="edit-fecha"
                type="date"
                value={fecha}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-inicio" className="text-[13px] font-semibold text-[#0d1c2e]">
                  Hora Inicio <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="edit-inicio"
                  type="time"
                  step={1800}
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-fin" className="text-[13px] font-semibold text-[#0d1c2e]">
                  Hora Fin <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="edit-fin"
                  type="time"
                  step={1800}
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all"
                />
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border flex items-center justify-between text-[12px] ${
                preview.valid ? 'bg-[#eff4ff] border-[#dce9ff] text-[#3e494a]' : 'bg-[#ffdad6] border-[#ba1a1a]/30 text-[#93000a]'
              }`}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Discretización automática:
              </span>
              <span className="font-semibold">{preview.text}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e6eeff]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-[#bdc9ca] text-[13px] font-semibold text-[#3e494a] hover:bg-[#eff4ff] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[#006066] hover:bg-[#0d7a82] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
