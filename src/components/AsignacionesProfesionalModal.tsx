import React, { useEffect, useState } from 'react';
import { ProfessionalAdminApi, SEDES, SedeId, SpecialtyApi } from '../types';
import { apiFetch } from '../api/session';
import { mensajeDeError } from '../api/errors';

interface AsignacionesProfesionalModalProps {
  profesional: ProfessionalAdminApi | null;
  activeSpecialties: SpecialtyApi[];
  onClose: () => void;
  onSaved: (nombre: string) => void;
}

/** RF-07: el ADMIN reasigna especialidades (exactamente una primaria) y sedes de un profesional existente. */
export const AsignacionesProfesionalModal: React.FC<AsignacionesProfesionalModalProps> = ({
  profesional,
  activeSpecialties,
  onClose,
  onSaved
}) => {
  const [especialidades, setEspecialidades] = useState<Set<number>>(new Set());
  const [primaria, setPrimaria] = useState<number | null>(null);
  const [sedes, setSedes] = useState<Set<SedeId>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!profesional) return;
    setEspecialidades(new Set(profesional.especialidades.map((e) => e.especialidadId)));
    setPrimaria(profesional.especialidades.find((e) => e.primaria)?.especialidadId ?? null);
    setSedes(new Set(profesional.sedeIds));
    setError(null);
  }, [profesional]);

  if (!profesional) return null;

  const toggleEspecialidad = (id: number) => {
    const siguiente = new Set(especialidades);
    if (siguiente.has(id)) {
      siguiente.delete(id);
      if (primaria === id) setPrimaria(null);
    } else {
      siguiente.add(id);
      if (primaria === null) setPrimaria(id);
    }
    setEspecialidades(siguiente);
  };

  const toggleSede = (id: SedeId) => {
    const siguiente = new Set(sedes);
    if (siguiente.has(id)) siguiente.delete(id);
    else siguiente.add(id);
    setSedes(siguiente);
  };

  // Una especialidad ya asignada pero hoy inactiva se sigue mostrando para poder retirarla.
  const opciones = [
    ...activeSpecialties,
    ...profesional.especialidades
      .filter((e) => !activeSpecialties.some((s) => s.id === e.especialidadId))
      .map((e) => ({ id: e.especialidadId, nombre: `Especialidad #${e.especialidadId} (inactiva)` }))
  ];

  const guardar = async () => {
    setError(null);
    if (especialidades.size === 0 || primaria === null || !especialidades.has(primaria)) {
      setError('Selecciona al menos una especialidad y marca una como primaria.');
      return;
    }
    if (sedes.size === 0) {
      setError('Selecciona al menos una sede.');
      return;
    }
    setGuardando(true);
    try {
      const resp = await apiFetch(`/api/admin/professionals/${profesional.profesionalId}/assignments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especialidades: [...especialidades].map((id) => ({ especialidadId: id, primaria: id === primaria })),
          sedeIds: [...sedes]
        })
      });
      if (!resp.ok) {
        setError(await mensajeDeError(resp, 'No se pudieron guardar las asignaciones.'));
        return;
      }
      onSaved(`${profesional.nombres} ${profesional.apellidos}`);
    } catch {
      setError('No se pudo contactar al servidor.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asignaciones-title"
    >
      <div
        className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#e6eeff] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="asignaciones-title" className="font-display font-semibold text-[18px] text-[#0d1c2e]">
          Especialidades y sedes
        </h3>
        <p className="text-[13px] text-[#3e494a] mb-4">
          {profesional.nombres} {profesional.apellidos} · {profesional.codigoProfesional}
        </p>

        <fieldset className="mb-4">
          <legend className="text-[12px] font-semibold text-[#3e494a] mb-2">Especialidades (marca la primaria)</legend>
          <div className="space-y-1.5">
            {opciones.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={especialidades.has(s.id)} onChange={() => toggleEspecialidad(s.id)} />
                  {s.nombre}
                </label>
                <label className="flex items-center gap-1 text-[12px] text-[#6e797a]">
                  <input
                    type="radio"
                    name="primaria"
                    checked={primaria === s.id}
                    disabled={!especialidades.has(s.id)}
                    onChange={() => setPrimaria(s.id)}
                  />
                  Primaria
                </label>
              </div>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-4">
          <legend className="text-[12px] font-semibold text-[#3e494a] mb-2">Sedes</legend>
          {([1, 2] as SedeId[]).map((id) => (
            <label key={id} className="flex items-center gap-2 text-sm mb-1.5">
              <input type="checkbox" checked={sedes.has(id)} onChange={() => toggleSede(id)} />
              {SEDES[id].nombre}
            </label>
          ))}
        </fieldset>

        <p className="text-[12px] text-[#6e797a] mb-3">
          No se puede retirar una sede con bloques de disponibilidad futuros ni una especialidad con citas futuras.
        </p>

        {error && (
          <p role="alert" className="text-[13px] bg-[#ffdad6] text-[#93000a] rounded-lg p-2.5 mb-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-[#3e494a] hover:bg-[#eff4ff]">
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="px-4 py-2 bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
