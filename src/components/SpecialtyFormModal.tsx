import React, { useEffect, useState } from 'react';
import { ApiErrorBody, SpecialtyApi, UserSession } from '../types';
import { API_URL, apiFetch } from '../api/session';


interface SpecialtyFormModalProps {
  isOpen: boolean;
  specialtyToEdit: SpecialtyApi | null;
  session: UserSession;
  onClose: () => void;
  onSaved: (saved: SpecialtyApi, mode: 'create' | 'edit') => void;
}

export const SpecialtyFormModal: React.FC<SpecialtyFormModalProps> = ({
  isOpen,
  specialtyToEdit,
  session,
  onClose,
  onSaved
}) => {
  const mode: 'create' | 'edit' = specialtyToEdit ? 'edit' : 'create';

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [duracionMinutos, setDuracionMinutos] = useState<30 | 60>(30);
  const [general, setGeneral] = useState(true);
  const [requiereAprobacionAdmin, setRequiereAprobacionAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (specialtyToEdit) {
      setCodigo(specialtyToEdit.codigo);
      setNombre(specialtyToEdit.nombre);
      setDuracionMinutos(specialtyToEdit.duracionMinutos as 30 | 60);
      setGeneral(specialtyToEdit.general);
      setRequiereAprobacionAdmin(specialtyToEdit.requiereAprobacionAdmin);
    } else {
      setCodigo('');
      setNombre('');
      setDuracionMinutos(30);
      setGeneral(true);
      setRequiereAprobacionAdmin(false);
    }
    setError(null);
  }, [isOpen, specialtyToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      setError('Código y nombre son obligatorios.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const url = mode === 'create' ? `${API_URL}/api/admin/specialties` : `${API_URL}/api/admin/specialties/${specialtyToEdit!.id}`;
      const body =
        mode === 'create'
          ? { codigo: codigo.trim().toUpperCase(), nombre: nombre.trim(), duracionMinutos, general, requiereAprobacionAdmin }
          : { nombre: nombre.trim(), duracionMinutos, general, requiereAprobacionAdmin };

      const resp = await apiFetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify(body)
      });

      if (resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || 'No se pudo guardar la especialidad.');
        return;
      }
      if (!resp.ok) {
        setError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      const guardada: SpecialtyApi = await resp.json();
      onSaved(guardada, mode);
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
        className="bg-white rounded-xl max-w-lg w-full shadow-xl border border-[#e6eeff] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#436088]"></div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-[#e6eeff] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006066]">medical_services</span>
              <h3 className="font-display font-semibold text-[17px] text-[#0d1c2e]">
                {mode === 'create' ? 'Nueva Especialidad' : `Editar Especialidad: ${specialtyToEdit?.codigo}`}
              </h3>
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
              <label htmlFor="spec-codigo" className="text-[13px] font-semibold text-[#0d1c2e]">
                Código <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="spec-codigo"
                type="text"
                value={codigo}
                disabled={mode === 'edit'}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Ej: CARDIO"
                className={`w-full px-3.5 py-2.5 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all border ${
                  mode === 'edit' ? 'bg-[#eff4ff] text-[#6e797a] border-transparent cursor-not-allowed' : 'bg-white border-[#bdc9ca]'
                }`}
              />
              {mode === 'edit' && <span className="text-[11px] text-[#6e797a]">El código no se puede editar una vez creado.</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spec-nombre" className="text-[13px] font-semibold text-[#0d1c2e]">
                Nombre <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="spec-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Cardiología Clínica"
                className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="spec-duracion" className="text-[13px] font-semibold text-[#0d1c2e]">
                Duración <span className="text-[#ba1a1a]">*</span>
              </label>
              <select
                id="spec-duracion"
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(Number(e.target.value) as 30 | 60)}
                className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] transition-all"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>60 minutos</option>
              </select>
            </div>

            <div className="p-3 bg-[#eff4ff] rounded-lg border border-[#dce9ff] flex flex-col gap-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={general}
                  onChange={(e) => setGeneral(e.target.checked)}
                  className="mt-0.5 rounded text-[#0d7a82] focus:ring-[#006066]"
                />
                <span className="text-[12px] text-[#0d1c2e]">Es consulta general (aparece en el flujo de cita general)</span>
              </label>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiereAprobacionAdmin}
                  onChange={(e) => setRequiereAprobacionAdmin(e.target.checked)}
                  className="mt-0.5 rounded text-[#0d7a82] focus:ring-[#006066]"
                />
                <span className="text-[12px] text-[#0d1c2e]">Requiere aprobación administrativa</span>
              </label>
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
                <span>{saving ? 'Guardando...' : mode === 'create' ? 'Crear Especialidad' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
