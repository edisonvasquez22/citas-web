import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActiveScreen, AdminAppointmentApi, ApiErrorBody, ProfessionalApi, SedeId, SEDES, SpecialtyApi, UserSession } from '../types';
import { AppointmentRequestCard } from './AppointmentRequestCard';
import { HistorialCitaModal } from './HistorialCitaModal';
import { RejectAppointmentModal } from './RejectAppointmentModal';
import { AdminNavTabs } from './AdminNavTabs';
import { API_URL, apiFetch } from '../api/session';


interface AprobacionCitasScreenProps {
  session: UserSession;
  onNavigate: (screen: ActiveScreen) => void;
}

interface Filtros {
  sedeId: '' | SedeId;
  especialidadId: '' | number;
  profesionalId: '' | number;
  fecha: string;
}

const FILTROS_VACIOS: Filtros = { sedeId: '', especialidadId: '', profesionalId: '', fecha: '' };

export const AprobacionCitasScreen: React.FC<AprobacionCitasScreenProps> = ({ session, onNavigate }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [appointments, setAppointments] = useState<AdminAppointmentApi[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalApi[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyApi[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processingCitaId, setProcessingCitaId] = useState<number | null>(null);
  const [rejectingAppointment, setRejectingAppointment] = useState<AdminAppointmentApi | null>(null);
  const [historialCitaId, setHistorialCitaId] = useState<number | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS);

  // Catálogos reales para resolver nombres (la bandeja solo trae IDs).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [respEsp, respProf] = await Promise.all([
          apiFetch(`${API_URL}/api/specialties`, { headers: authHeaders }),
          apiFetch(`${API_URL}/api/professionals`, { headers: authHeaders })
        ]);
        if (!respEsp.ok || !respProf.ok) return;
        const esp: SpecialtyApi[] = await respEsp.json();
        const prof: ProfessionalApi[] = await respProf.json();
        if (cancelado) return;
        setSpecialties(esp);
        setProfessionals(prof);
      } catch {
        // Si falla, las tarjetas caen de vuelta a "Especialidad #<id>" / "Profesional #<id>".
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadBandeja = useCallback(
    async (isRefresh: boolean) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      const params = new URLSearchParams();
      if (filtros.sedeId) params.set('sedeId', String(filtros.sedeId));
      if (filtros.especialidadId) params.set('especialidadId', String(filtros.especialidadId));
      if (filtros.profesionalId) params.set('profesionalId', String(filtros.profesionalId));
      if (filtros.fecha) params.set('fecha', filtros.fecha);
      const query = params.toString();

      try {
        const resp = await apiFetch(`${API_URL}/api/admin/appointments/requested${query ? `?${query}` : ''}`, {
          headers: authHeaders
        });
        if (!resp.ok) throw new Error();
        const data: AdminAppointmentApi[] = await resp.json();
        setAppointments(data);
        if (isRefresh) {
          setFeedback({ type: 'info', title: 'Bandeja actualizada', message: 'Se recargaron las solicitudes pendientes.' });
        }
      } catch {
        setLoadError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [session.accessToken, filtros]
  );

  useEffect(() => {
    loadBandeja(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  const handleApprove = async (citaId: number) => {
    setProcessingCitaId(citaId);
    try {
      const resp = await apiFetch(`${API_URL}/api/admin/appointments/${citaId}/approve`, {
        method: 'POST',
        headers: authHeaders
      });

      if (resp.status === 404 || resp.status === 409) {
        setFeedback({
          type: 'info',
          title: 'Solicitud ya no disponible',
          message: `La solicitud #${citaId} ya fue resuelta (quizás por otro administrador). Se actualizó la bandeja.`
        });
        setAppointments((prev) => prev.filter((a) => a.citaId !== citaId));
        return;
      }
      if (!resp.ok) {
        const err: ApiErrorBody | null = await resp.json().catch(() => null);
        setFeedback({
          type: 'info',
          title: 'No se pudo aprobar',
          message: err?.message || 'Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.'
        });
        return;
      }

      setAppointments((prev) => prev.filter((a) => a.citaId !== citaId));
      setFeedback({
        type: 'success',
        title: 'Solicitud aprobada',
        message: `La solicitud #${citaId} quedó confirmada en la agenda del profesional.`
      });
    } catch {
      setFeedback({
        type: 'info',
        title: 'Error de Conexión',
        message: 'No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.'
      });
    } finally {
      setProcessingCitaId(null);
    }
  };

  const handleRejected = (actualizado: AdminAppointmentApi) => {
    setAppointments((prev) => prev.filter((a) => a.citaId !== actualizado.citaId));
    setFeedback({
      type: 'success',
      title: 'Solicitud rechazada',
      message: `Solicitud #${actualizado.citaId} rechazada. Motivo registrado: "${actualizado.motivoDecision}"`
    });
  };

  const handleStale = (citaId: number) => {
    setAppointments((prev) => prev.filter((a) => a.citaId !== citaId));
    setFeedback({
      type: 'info',
      title: 'Solicitud ya no disponible',
      message: `La solicitud #${citaId} ya fue resuelta por otro administrador. Se actualizó la bandeja.`
    });
  };

  const especialidadPorId = useMemo(() => new Map(specialties.map((s) => [s.id, s])), [specialties]);
  const profesionalPorId = useMemo(() => new Map(professionals.map((p) => [p.profesionalId, p])), [professionals]);

  const especialidadesEspecializadas = useMemo(() => specialties.filter((s) => !s.general), [specialties]);

  const activeFiltersCount = [filtros.sedeId, filtros.especialidadId, filtros.profesionalId, filtros.fecha].filter(
    (v) => v !== ''
  ).length;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <AdminNavTabs active="aprobacion-citas" onNavigate={onNavigate} />
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#eff4ff]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-[14px]">fact_check</span>
              Gestión Asistencial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eeff] text-[#006066] text-[12px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006066]"></span>
              <span>{appointments.length} solicitudes</span>
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">
            Bandeja de Aprobación de Citas Especializadas
          </h1>
          <p className="text-sm text-[#3e494a] mt-1 leading-relaxed">
            Revisión y validación administrativa de solicitudes en estado{' '}
            <span className="font-semibold text-[#436088] font-mono text-[13px]">REQUESTED</span> en las sedes HIC e
            ICV.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadBandeja(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#bdc9ca]/70 hover:bg-[#eff4ff] text-[#0d1c2e] transition-all text-xs font-semibold shadow-xs disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            Actualizar bandeja
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

      {/* Filtros */}
      <section className="p-4 sm:p-5 rounded-xl bg-white border border-[#e6eeff] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-[#436088] font-bold text-[16px] font-display">
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
            <span>Parámetros de Consulta</span>
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_VACIOS)}
              className="text-[#436088] hover:text-[#006066] text-[13px] font-semibold flex items-center gap-1 transition"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#3e494a]">Sede Hospitalaria</label>
            <select
              value={filtros.sedeId}
              onChange={(e) => setFiltros((f) => ({ ...f, sedeId: e.target.value === '' ? '' : (Number(e.target.value) as SedeId) }))}
              className="w-full bg-[#eff4ff] text-[#0d1c2e] text-[14px] rounded-lg px-3 py-2.5 outline-none border border-transparent focus:border-[#006066] focus:bg-white transition"
            >
              <option value="">Todas las sedes</option>
              <option value={1}>{SEDES[1].corto}</option>
              <option value={2}>{SEDES[2].corto}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#3e494a]">Especialidad</label>
            <select
              value={filtros.especialidadId}
              onChange={(e) => setFiltros((f) => ({ ...f, especialidadId: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full bg-[#eff4ff] text-[#0d1c2e] text-[14px] rounded-lg px-3 py-2.5 outline-none border border-transparent focus:border-[#006066] focus:bg-white transition"
            >
              <option value="">Todas las especialidades</option>
              {especialidadesEspecializadas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#3e494a]">Profesional Asignado</label>
            <select
              value={filtros.profesionalId}
              onChange={(e) => setFiltros((f) => ({ ...f, profesionalId: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full bg-[#eff4ff] text-[#0d1c2e] text-[14px] rounded-lg px-3 py-2.5 outline-none border border-transparent focus:border-[#006066] focus:bg-white transition"
            >
              <option value="">Todos los profesionales</option>
              {professionals.map((p) => (
                <option key={p.profesionalId} value={p.profesionalId}>
                  {p.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-[#3e494a]">Fecha Programada</label>
            <input
              type="date"
              value={filtros.fecha}
              onChange={(e) => setFiltros((f) => ({ ...f, fecha: e.target.value }))}
              className="w-full bg-[#eff4ff] text-[#0d1c2e] text-[14px] rounded-lg px-3 py-2.5 outline-none border border-transparent focus:border-[#006066] focus:bg-white transition"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-10 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
          <p className="text-sm text-[#3e494a] mt-3">Cargando la bandeja de aprobación...</p>
        </div>
      ) : loadError ? (
        <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
          <span className="material-symbols-outlined text-[28px]">wifi_off</span>
          <div>
            <h3 className="font-bold">Error de Conexión</h3>
            <p className="text-sm mt-1">{loadError}</p>
          </div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-10 sm:p-14 rounded-2xl bg-white border border-dashed border-[#bdc9ca] text-center">
          <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#006066] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[28px]">task_alt</span>
          </div>
          <h3 className="font-display font-semibold text-base text-[#0d1c2e]">No hay solicitudes pendientes de aprobación</h3>
          <p className="text-xs text-[#3e494a] max-w-md mt-1 leading-relaxed">
            {activeFiltersCount > 0
              ? 'Ninguna solicitud coincide con los filtros seleccionados.'
              : 'Todas las citas especializadas han sido gestionadas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((cita) => {
            const especialidad = especialidadPorId.get(cita.especialidadId);
            return (
              <AppointmentRequestCard
                key={cita.citaId}
                appointment={cita}
                sedeNombre={SEDES[cita.sedeId]?.nombre ?? `Sede #${cita.sedeId}`}
                especialidadNombre={especialidad?.nombre ?? `Especialidad #${cita.especialidadId}`}
                especialidadDuracionMinutos={especialidad?.duracionMinutos ?? null}
                profesionalNombre={profesionalPorId.get(cita.profesionalId)?.nombreCompleto ?? `Profesional #${cita.profesionalId}`}
                isProcessing={processingCitaId === cita.citaId}
                onApprove={handleApprove}
                onRejectClick={setRejectingAppointment}
                onHistoryClick={setHistorialCitaId}
              />
            );
          })}
        </div>
      )}

      <div className="text-center text-[11px] text-[#6e797a] pt-2">
        Fundación Cardiovascular de Colombia • Coordinación Médica Administrativa • Protección de datos conforme a la
        Ley 1581 de 2012.
      </div>

      <HistorialCitaModal citaId={historialCitaId} onClose={() => setHistorialCitaId(null)} />

      <RejectAppointmentModal
        appointment={rejectingAppointment}
        session={session}
        onClose={() => setRejectingAppointment(null)}
        onRejected={handleRejected}
        onStale={handleStale}
      />
    </div>
  );
};
