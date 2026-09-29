import React, { useEffect, useMemo, useState } from 'react';
import { ActiveScreen, ProfessionalAdminApi, SEDES, SpecialtyApi, UserSession } from '../types';
import { SpecialtyFormModal } from './SpecialtyFormModal';
import { ProfessionalFormModal } from './ProfessionalFormModal';
import { AdminNavTabs } from './AdminNavTabs';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface AdminCatalogoScreenProps {
  session: UserSession;
  onNavigate: (screen: ActiveScreen) => void;
}

type SubTab = 'especialidades' | 'profesionales';

export const AdminCatalogoScreen: React.FC<AdminCatalogoScreenProps> = ({ session, onNavigate }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [subTab, setSubTab] = useState<SubTab>('especialidades');
  const [specialties, setSpecialties] = useState<SpecialtyApi[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalAdminApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);

  const [specialtyModalOpen, setSpecialtyModalOpen] = useState(false);
  const [specialtyToEdit, setSpecialtyToEdit] = useState<SpecialtyApi | null>(null);
  const [professionalModalOpen, setProfessionalModalOpen] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [respEsp, respProf] = await Promise.all([
        fetch(`${API_URL}/api/admin/specialties`, { headers: authHeaders }),
        fetch(`${API_URL}/api/admin/professionals`, { headers: authHeaders })
      ]);
      if (!respEsp.ok || !respProf.ok) throw new Error();
      setSpecialties(await respEsp.json());
      setProfessionals(await respProf.json());
    } catch {
      setLoadError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const especialidadPorId = useMemo(() => new Map(specialties.map((s) => [s.id, s])), [specialties]);

  const handleToggleSpecialty = async (spec: SpecialtyApi) => {
    try {
      const resp = await fetch(`${API_URL}/api/admin/specialties/${spec.id}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ activa: !spec.activa })
      });
      if (!resp.ok) {
        setFeedback({ type: 'info', title: 'No se pudo cambiar el estado', message: 'Error de conexión con el servidor institucional.' });
        return;
      }
      const actualizado: SpecialtyApi = await resp.json();
      setSpecialties((prev) => prev.map((s) => (s.id === actualizado.id ? actualizado : s)));
    } catch {
      setFeedback({ type: 'info', title: 'Error de Conexión', message: 'No se pudo contactar al servidor institucional.' });
    }
  };

  const handleSpecialtySaved = (saved: SpecialtyApi, mode: 'create' | 'edit') => {
    setSpecialties((prev) => (mode === 'create' ? [...prev, saved] : prev.map((s) => (s.id === saved.id ? saved : s))));
    setFeedback({
      type: 'success',
      title: mode === 'create' ? 'Especialidad creada' : 'Especialidad actualizada',
      message: `"${saved.nombre}" (${saved.codigo}) se guardó correctamente.`
    });
  };

  const handleToggleProfessional = async (prof: ProfessionalAdminApi) => {
    try {
      const resp = await fetch(`${API_URL}/api/admin/professionals/${prof.profesionalId}/status`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ activo: !prof.activo })
      });
      if (!resp.ok) {
        setFeedback({ type: 'info', title: 'No se pudo cambiar el estado', message: 'Error de conexión con el servidor institucional.' });
        return;
      }
      setProfessionals((prev) => prev.map((p) => (p.profesionalId === prof.profesionalId ? { ...p, activo: !p.activo } : p)));
    } catch {
      setFeedback({ type: 'info', title: 'Error de Conexión', message: 'No se pudo contactar al servidor institucional.' });
    }
  };

  const handleProfessionalCreated = (creado: ProfessionalAdminApi) => {
    setProfessionals((prev) => [...prev, creado]);
    setFeedback({
      type: 'success',
      title: 'Profesional registrado',
      message: `Dr(a). ${creado.nombres} ${creado.apellidos} (${creado.codigoProfesional}) se registró correctamente.`
    });
  };

  const activeSpecialties = specialties.filter((s) => s.activa);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <AdminNavTabs active="admin-catalogo" onNavigate={onNavigate} />
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#eff4ff]">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase mb-2">
            <span className="material-symbols-outlined text-[14px]">inventory_2</span>
            Gestión de Catálogo
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">Especialidades y Profesionales</h1>
          <p className="text-sm text-[#3e494a] mt-1 max-w-2xl leading-relaxed">
            Administra el catálogo de especialidades asistenciales y el directorio de profesionales en las sedes HIC e ICV.
          </p>
        </div>
        <div className="flex items-center p-1 bg-[#eff4ff] rounded-xl border border-[#dce9ff] self-start">
          <button
            type="button"
            onClick={() => setSubTab('especialidades')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'especialidades' ? 'bg-white text-[#006066] shadow-xs' : 'text-[#3e494a]'
            }`}
          >
            Especialidades ({specialties.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('profesionales')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              subTab === 'profesionales' ? 'bg-white text-[#006066] shadow-xs' : 'text-[#3e494a]'
            }`}
          >
            Profesionales ({professionals.length})
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-lg flex items-start gap-2.5 text-[13px] ${
            feedback.type === 'success' ? 'bg-[#dce9ff] text-[#0d1c2e] border border-[#b4d0ff]' : 'bg-[#eff4ff] text-[#0d1c2e] border border-[#dce9ff]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-[#006066]">
            {feedback.type === 'success' ? 'check_circle' : 'info'}
          </span>
          <div className="flex-1">
            <p className="font-semibold">{feedback.title}</p>
            <p className="text-[12px] mt-0.5 opacity-90">{feedback.message}</p>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100 p-0.5">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-10 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
          <p className="text-sm text-[#3e494a] mt-3">Cargando catálogo...</p>
        </div>
      ) : loadError ? (
        <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
          <span className="material-symbols-outlined text-[28px]">wifi_off</span>
          <div>
            <h3 className="font-bold">Error de Conexión</h3>
            <p className="text-sm mt-1">{loadError}</p>
          </div>
        </div>
      ) : subTab === 'especialidades' ? (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSpecialtyToEdit(null);
                setSpecialtyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#006066] to-[#0d7a82] text-white text-sm font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva Especialidad
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#eff4ff] text-[#3e494a] text-[11px] font-bold uppercase tracking-wider border-b border-[#e6eeff]">
                    <th className="py-3.5 px-6">Código</th>
                    <th className="py-3.5 px-4">Nombre</th>
                    <th className="py-3.5 px-4">Duración</th>
                    <th className="py-3.5 px-4">Tipo</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#eff4ff]">
                  {specialties.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6e797a]">
                        No hay especialidades registradas todavía.
                      </td>
                    </tr>
                  ) : (
                    specialties.map((spec) => (
                      <tr key={spec.id} className={`hover:bg-[#eff4ff]/60 transition-colors ${!spec.activa ? 'opacity-70' : ''}`}>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-1 rounded bg-[#e6eeff] font-mono font-bold text-xs text-[#0d1c2e]">{spec.codigo}</span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#0d1c2e]">{spec.nombre}</td>
                        <td className="py-3.5 px-4 text-[#3e494a]">{spec.duracionMinutos} min</td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-[#e6eeff] text-xs font-medium text-[#3c5981]">
                              {spec.general ? 'General' : 'Especializada'}
                            </span>
                            {spec.requiereAprobacionAdmin && (
                              <span className="px-2 py-0.5 rounded bg-[#ffeed9] text-[#7a4100] text-xs font-medium">Requiere aprobación</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {spec.activa ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">Activa</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-[#e6eeff] text-[#6e797a] text-xs font-semibold">Inactiva</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setSpecialtyToEdit(spec);
                                setSpecialtyModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg hover:bg-[#e6eeff] text-[#006066] text-xs font-semibold"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleSpecialty(spec)}
                              className="px-2.5 py-1 rounded-lg hover:bg-[#e6eeff] text-[#3e494a] text-xs font-semibold"
                            >
                              {spec.activa ? 'Desactivar' : 'Activar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setProfessionalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#006066] to-[#0d7a82] text-white text-sm font-semibold shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Registrar Profesional
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#eff4ff] text-[#3e494a] text-[11px] font-bold uppercase tracking-wider border-b border-[#e6eeff]">
                    <th className="py-3.5 px-6">Profesional</th>
                    <th className="py-3.5 px-4">Contacto</th>
                    <th className="py-3.5 px-4">Especialidades</th>
                    <th className="py-3.5 px-4">Sedes</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-6 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-[#eff4ff]">
                  {professionals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#6e797a]">
                        No hay profesionales registrados todavía.
                      </td>
                    </tr>
                  ) : (
                    professionals.map((prof) => (
                      <tr key={prof.profesionalId} className={`hover:bg-[#eff4ff]/60 transition-colors ${!prof.activo ? 'opacity-70' : ''}`}>
                        <td className="py-3.5 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-[#0d1c2e]">
                              Dr(a). {prof.nombres} {prof.apellidos}
                            </span>
                            <span className="text-xs text-[#6e797a] font-mono">{prof.codigoProfesional} · {prof.matricula}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#3e494a]">
                          <div className="flex flex-col gap-0.5">
                            <span>{prof.email}</span>
                            <span className="text-[#6e797a]">{prof.telefono}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="flex flex-wrap gap-1.5">
                            {prof.especialidades.map((e) => (
                              <span
                                key={e.especialidadId}
                                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  e.primaria ? 'bg-[#0d7a82] text-white' : 'bg-[#e6eeff] text-[#3e494a]'
                                }`}
                              >
                                {especialidadPorId.get(e.especialidadId)?.nombre ?? `Especialidad #${e.especialidadId}`}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#3e494a]">
                          {prof.sedeIds.map((id) => SEDES[id]?.corto).join(', ')}
                        </td>
                        <td className="py-3.5 px-4">
                          {prof.activo ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">Activo</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-[#e6eeff] text-[#6e797a] text-xs font-semibold">Inactivo</span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleProfessional(prof)}
                            className="px-2.5 py-1 rounded-lg hover:bg-[#e6eeff] text-[#3e494a] text-xs font-semibold"
                          >
                            {prof.activo ? 'Desactivar' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <SpecialtyFormModal
        isOpen={specialtyModalOpen}
        specialtyToEdit={specialtyToEdit}
        session={session}
        onClose={() => setSpecialtyModalOpen(false)}
        onSaved={handleSpecialtySaved}
      />
      <ProfessionalFormModal
        isOpen={professionalModalOpen}
        activeSpecialties={activeSpecialties}
        session={session}
        onClose={() => setProfessionalModalOpen(false)}
        onCreated={handleProfessionalCreated}
      />
    </div>
  );
};
