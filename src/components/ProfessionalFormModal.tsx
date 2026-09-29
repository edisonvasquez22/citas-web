import React, { useEffect, useState } from 'react';
import { ApiErrorBody, DocumentType, ProfessionalAdminApi, SedeId, SEDES, SpecialtyApi, UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface ProfessionalFormModalProps {
  isOpen: boolean;
  activeSpecialties: SpecialtyApi[];
  session: UserSession;
  onClose: () => void;
  onCreated: (created: ProfessionalAdminApi) => void;
}

export const ProfessionalFormModal: React.FC<ProfessionalFormModalProps> = ({
  isOpen,
  activeSpecialties,
  session,
  onClose,
  onCreated
}) => {
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<DocumentType>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [codigoProfesional, setCodigoProfesional] = useState('');
  const [matricula, setMatricula] = useState('');
  const [especialidadesSeleccionadas, setEspecialidadesSeleccionadas] = useState<Set<number>>(new Set());
  const [primaria, setPrimaria] = useState<number | null>(null);
  const [sedesSeleccionadas, setSedesSeleccionadas] = useState<Set<SedeId>>(new Set([1, 2]));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setNombres('');
    setApellidos('');
    setTipoDocumento('CC');
    setNumeroDocumento('');
    setEmail('');
    setTelefono('');
    setPassword('');
    setCodigoProfesional('');
    setMatricula('');
    setEspecialidadesSeleccionadas(new Set());
    setPrimaria(null);
    setSedesSeleccionadas(new Set([1, 2]));
    setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleEspecialidad = (id: number) => {
    const next = new Set(especialidadesSeleccionadas);
    if (next.has(id)) {
      next.delete(id);
      if (primaria === id) {
        const remaining = Array.from(next);
        setPrimaria(remaining.length > 0 ? remaining[0] : null);
      }
    } else {
      next.add(id);
      if (primaria === null) setPrimaria(id);
    }
    setEspecialidadesSeleccionadas(next);
  };

  const toggleSede = (id: SedeId) => {
    const next = new Set(sedesSeleccionadas);
    if (next.has(id)) {
      if (next.size <= 1) return;
      next.delete(id);
    } else {
      next.add(id);
    }
    setSedesSeleccionadas(next);
  };

  const primariaValida = especialidadesSeleccionadas.size > 0 && primaria !== null && especialidadesSeleccionadas.has(primaria);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primariaValida) {
      setError('Selecciona al menos una especialidad y marca exactamente una como primaria.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña inicial debe tener al menos 8 caracteres.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/admin/professionals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          tipoDocumento,
          numeroDocumento: numeroDocumento.trim(),
          email: email.trim().toLowerCase(),
          telefono: telefono.trim(),
          password,
          codigoProfesional: codigoProfesional.trim().toUpperCase(),
          matricula: matricula.trim(),
          especialidades: Array.from(especialidadesSeleccionadas).map((especialidadId) => ({
            especialidadId,
            primaria: especialidadId === primaria
          })),
          sedeIds: Array.from(sedesSeleccionadas)
        })
      });

      if (resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || (err.detalles ?? []).join(' ') || 'No se pudo registrar el profesional.');
        return;
      }
      if (!resp.ok) {
        setError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      const creado = await resp.json();
      onCreated({
        profesionalId: creado.profesionalId,
        usuarioId: creado.usuarioId,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        tipoDocumento,
        numeroDocumento: numeroDocumento.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        codigoProfesional: creado.codigoProfesional,
        matricula: matricula.trim(),
        activo: creado.activo,
        especialidades: Array.from(especialidadesSeleccionadas).map((especialidadId) => ({
          especialidadId,
          primaria: especialidadId === primaria
        })),
        sedeIds: Array.from(sedesSeleccionadas)
      });
      onClose();
    } catch {
      setError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl max-w-2xl w-full shadow-xl border border-[#e6eeff] overflow-hidden my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#436088] shrink-0"></div>
        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#e6eeff] pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006066]">person_add</span>
              <h3 className="font-display font-semibold text-[17px] text-[#0d1c2e]">Registrar Profesional</h3>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-nombres" className="text-[13px] font-semibold text-[#0d1c2e]">Nombres *</label>
                <input
                  id="prof-nombres"
                  type="text"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-apellidos" className="text-[13px] font-semibold text-[#0d1c2e]">Apellidos *</label>
                <input
                  id="prof-apellidos"
                  type="text"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-tipo-documento" className="text-[13px] font-semibold text-[#0d1c2e]">Tipo Doc. *</label>
                <select
                  id="prof-tipo-documento"
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as DocumentType)}
                  className="w-full px-3 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                >
                  <option value="CC">Cédula de Ciudadanía</option>
                  <option value="CE">Cédula de Extranjería</option>
                  <option value="TI">Tarjeta de Identidad</option>
                  <option value="PAS">Pasaporte</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label htmlFor="prof-numero-documento" className="text-[13px] font-semibold text-[#0d1c2e]">Número de Documento *</label>
                <input
                  id="prof-numero-documento"
                  type="text"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-email" className="text-[13px] font-semibold text-[#0d1c2e]">Email *</label>
                <input
                  id="prof-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-telefono" className="text-[13px] font-semibold text-[#0d1c2e]">Teléfono *</label>
                <input
                  id="prof-telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="prof-password" className="text-[13px] font-semibold text-[#0d1c2e]">Contraseña Inicial * (mín. 8 caracteres)</label>
              <input
                id="prof-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-codigo-profesional" className="text-[13px] font-semibold text-[#0d1c2e]">Código Profesional *</label>
                <input
                  id="prof-codigo-profesional"
                  type="text"
                  value={codigoProfesional}
                  onChange={(e) => setCodigoProfesional(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-matricula" className="text-[13px] font-semibold text-[#0d1c2e]">Matrícula *</label>
                <input
                  id="prof-matricula"
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#bdc9ca] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                />
              </div>
            </div>

            <div className="p-3.5 bg-[#eff4ff] rounded-xl border border-[#d5e3fc] flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0d1c2e] uppercase tracking-wider">Especialidades (marca una como primaria)</span>
              </div>
              {activeSpecialties.length === 0 ? (
                <p className="text-[12px] text-[#6e797a]">No hay especialidades activas. Crea una en la pestaña Especialidades primero.</p>
              ) : (
                activeSpecialties.map((spec) => {
                  const seleccionada = especialidadesSeleccionadas.has(spec.id);
                  return (
                    <div key={spec.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#e6eeff]">
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={seleccionada}
                          onChange={() => toggleEspecialidad(spec.id)}
                          className="rounded text-[#0d7a82] focus:ring-[#006066]"
                        />
                        <span className="text-[13px] text-[#0d1c2e]">{spec.nombre}</span>
                      </label>
                      <label className={`flex items-center gap-1.5 px-2 py-0.5 rounded ${seleccionada ? '' : 'opacity-40 pointer-events-none'}`}>
                        <input
                          type="radio"
                          name="especialidad-primaria"
                          disabled={!seleccionada}
                          checked={primaria === spec.id}
                          onChange={() => setPrimaria(spec.id)}
                        />
                        <span className="text-[11px] font-semibold text-[#436088]">Primaria</span>
                      </label>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-[#0d1c2e]">Sedes Asignadas *</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {([1, 2] as SedeId[]).map((id) => (
                  <label
                    key={id}
                    className={`p-3 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                      sedesSeleccionadas.has(id) ? 'bg-[#eff4ff] border-[#0d7a82]' : 'bg-white border-[#e6eeff]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={sedesSeleccionadas.has(id)}
                      onChange={() => toggleSede(id)}
                      className="mt-0.5 rounded text-[#0d7a82] focus:ring-[#006066]"
                    />
                    <div>
                      <span className="text-[12px] font-semibold text-[#0d1c2e] block">{SEDES[id].nombre}</span>
                      <span className="text-[11px] text-[#6e797a]">{SEDES[id].direccion}</span>
                    </div>
                  </label>
                ))}
              </div>
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
                <span>{saving ? 'Registrando...' : 'Registrar Profesional'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
