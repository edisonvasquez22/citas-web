import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActiveScreen,
  ApiErrorBody,
  ProfessionalApi,
  SedeId,
  SEDES,
  SolicitudReprogramacionApi,
  UserSession
} from '../types';
import { AdminNavTabs } from './AdminNavTabs';
import { RechazarReprogramacionModal } from './RechazarReprogramacionModal';
import { API_URL, apiFetch } from '../api/session';


interface BandejaReprogramacionesScreenProps {
  session: UserSession;
  onNavigate: (screen: ActiveScreen) => void;
}

function formatFechaHora(iso: string): string {
  return iso.replace('T', ' ').slice(0, 16);
}

/** HU-020: bandeja real de solicitudes de reprogramación PENDING, aprobar/rechazar contra citas-api. */
export const BandejaReprogramacionesScreen: React.FC<BandejaReprogramacionesScreenProps> = ({ session, onNavigate }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [solicitudes, setSolicitudes] = useState<SolicitudReprogramacionApi[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sedeFiltro, setSedeFiltro] = useState<'ALL' | SedeId>('ALL');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<SolicitudReprogramacionApi | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);

  const cargar = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);
    try {
      const [respSol, respProf] = await Promise.all([
        apiFetch(`${API_URL}/api/admin/reschedules`, { headers: authHeaders }),
        apiFetch(`${API_URL}/api/professionals`, { headers: authHeaders })
      ]);
      if (!respSol.ok || !respProf.ok) throw new Error();
      const dataSol: SolicitudReprogramacionApi[] = await respSol.json();
      const dataProf: ProfessionalApi[] = await respProf.json();
      setSolicitudes(dataSol);
      setProfessionals(dataProf);
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
  }, []);

  useEffect(() => {
    cargar(false);
  }, [cargar]);

  const nombreProfesional = (id: number) => professionals.find((p) => p.profesionalId === id)?.nombreCompleto ?? `Profesional #${id}`;

  const solicitudesFiltradas = useMemo(
    () => solicitudes.filter((s) => sedeFiltro === 'ALL' || s.sedeSolicitadaId === sedeFiltro),
    [solicitudes, sedeFiltro]
  );

  const countHic = solicitudes.filter((s) => s.sedeSolicitadaId === 1).length;
  const countIcv = solicitudes.filter((s) => s.sedeSolicitadaId === 2).length;

  const handleApprove = async (solicitudId: number) => {
    setProcessingId(solicitudId);
    try {
      const resp = await apiFetch(`${API_URL}/api/admin/reschedules/${solicitudId}/approve`, {
        method: 'POST',
        headers: authHeaders
      });

      if (resp.status === 404 || resp.status === 409) {
        setSolicitudes((prev) => prev.filter((s) => s.solicitudId !== solicitudId));
        setFeedback({
          type: 'info',
          title: 'Solicitud ya no disponible',
          message: `La solicitud #${solicitudId} ya fue resuelta (quizás por otro administrador). Se actualizó la bandeja.`
        });
        return;
      }
      if (!resp.ok) {
        const err: ApiErrorBody | null = await resp.json().catch(() => null);
        setFeedback({ type: 'info', title: 'No se pudo aprobar', message: err?.message || 'Error de conexión con el servidor institucional.' });
        return;
      }

      setSolicitudes((prev) => prev.filter((s) => s.solicitudId !== solicitudId));
      setFeedback({ type: 'success', title: 'Reprogramación aprobada', message: `La solicitud #${solicitudId} quedó confirmada en el nuevo horario.` });
    } catch {
      setFeedback({ type: 'info', title: 'Error de Conexión', message: 'No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazada = (actualizado: SolicitudReprogramacionApi) => {
    setSolicitudes((prev) => prev.filter((s) => s.solicitudId !== actualizado.solicitudId));
    setFeedback({ type: 'success', title: 'Reprogramación rechazada', message: `Solicitud #${actualizado.solicitudId} rechazada. La cita conserva su horario original.` });
  };

  const handleStale = (solicitudId: number) => {
    setSolicitudes((prev) => prev.filter((s) => s.solicitudId !== solicitudId));
    setFeedback({ type: 'info', title: 'Solicitud ya no disponible', message: `La solicitud #${solicitudId} ya fue resuelta por otro administrador. Se actualizó la bandeja.` });
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <AdminNavTabs active="admin-reprogramaciones" onNavigate={onNavigate} />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#eff4ff]">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 flex-wrap mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase">
              <span className="material-symbols-outlined text-[14px]">event_repeat</span>
              Gestión Asistencial
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eeff] text-[#006066] text-[12px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#006066]"></span>
              <span>{solicitudes.length} solicitudes</span>
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">Bandeja de Reprogramaciones</h1>
          <p className="text-sm text-[#3e494a] mt-1 leading-relaxed">
            Revisión de cambios de fecha, hora y sede solicitados por pacientes para citas ya aprobadas, en{' '}
            <span className="font-semibold text-[#436088] font-mono text-[13px]">PENDING</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => cargar(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#bdc9ca]/70 hover:bg-[#eff4ff] text-[#0d1c2e] transition-all text-xs font-semibold shadow-xs disabled:opacity-60 shrink-0"
        >
          <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
          Actualizar bandeja
        </button>
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
          <p className="text-sm text-[#3e494a] mt-3">Cargando la bandeja de reprogramaciones...</p>
        </div>
      ) : loadError ? (
        <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
          <span className="material-symbols-outlined text-[28px]">wifi_off</span>
          <div>
            <h3 className="font-bold">Error de Conexión</h3>
            <p className="text-sm mt-1">{loadError}</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 flex-wrap bg-white p-3 rounded-xl border border-[#e6eeff] shadow-xs">
            <span className="text-[12px] font-semibold text-[#3e494a] mr-1">Filtrar por sede solicitada:</span>
            <button
              type="button"
              onClick={() => setSedeFiltro('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${sedeFiltro === 'ALL' ? 'bg-[#006066] text-white shadow-xs' : 'bg-[#e6eeff] text-[#3e494a] hover:bg-[#dce9ff]'}`}
            >
              Todas ({solicitudes.length})
            </button>
            <button
              type="button"
              onClick={() => setSedeFiltro(1)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${sedeFiltro === 1 ? 'bg-[#006066] text-white shadow-xs' : 'bg-[#e6eeff] text-[#3e494a] hover:bg-[#dce9ff]'}`}
            >
              {SEDES[1].corto} ({countHic})
            </button>
            <button
              type="button"
              onClick={() => setSedeFiltro(2)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${sedeFiltro === 2 ? 'bg-[#006066] text-white shadow-xs' : 'bg-[#e6eeff] text-[#3e494a] hover:bg-[#dce9ff]'}`}
            >
              {SEDES[2].corto} ({countIcv})
            </button>
          </div>

          {solicitudesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 sm:p-14 rounded-2xl bg-white border border-dashed border-[#bdc9ca] text-center">
              <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#006066] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px]">check_circle</span>
              </div>
              <h3 className="font-display font-semibold text-base text-[#0d1c2e]">
                {solicitudes.length === 0 ? 'No hay solicitudes de reprogramación pendientes' : 'Ninguna solicitud coincide con el filtro'}
              </h3>
              <p className="text-xs text-[#3e494a] max-w-md mt-1 leading-relaxed">
                {solicitudes.length === 0
                  ? 'Todas las solicitudes de cambio de horario han sido gestionadas.'
                  : 'Prueba con otra sede o limpia el filtro.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {solicitudesFiltradas.map((s) => (
                <article key={s.solicitudId} className="flex flex-col rounded-xl bg-white shadow-xs hover:shadow-md transition-shadow overflow-hidden border border-[#e6eeff]">
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#006066] to-[#0d7a82]"></div>

                  <div className="p-4 flex flex-col flex-grow justify-between gap-4">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display text-[16px] font-bold text-[#0d1c2e]">SOLICITUD #{s.solicitudId}</span>
                          <span className="text-[11px] text-[#3e494a] font-mono bg-[#e6eeff] px-1.5 py-0.5 rounded border border-[#e6eeff]">
                            Cita #{s.citaId}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[13px]">hourglass_empty</span>
                          PENDING
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-[#f8f9ff] flex items-center gap-2.5 border border-[#e6eeff]">
                        <div className="w-10 h-10 rounded-full bg-[#006066]/10 text-[#006066] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">stethoscope</span>
                        </div>
                        <span className="text-[14px] text-[#0d1c2e] font-semibold truncate">{nombreProfesional(s.profesionalId)}</span>
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        <div className="p-2.5 rounded-lg bg-[#e6eeff] text-[#3e494a] flex flex-col gap-1 opacity-85">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6e797a]">Horario Anterior (Agendado)</span>
                          <div className="flex items-center gap-1.5 text-[12px] line-through text-[#6e797a]">
                            <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                            <span>{formatFechaHora(s.inicioAnterior)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center py-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f8f9ff] text-[#006066] text-[11px] font-medium">
                            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                            Cambio solicitado por el paciente
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-[#eff4ff] flex flex-col gap-1.5 border border-[#006066]/20">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#006066]">Horario Propuesto (Nuevo)</span>
                          <div className="flex items-center gap-1.5 text-[15px] font-bold text-[#0d1c2e]">
                            <span className="material-symbols-outlined text-[19px] text-[#006066]">event_available</span>
                            <span>{formatFechaHora(s.inicioSolicitado)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[12px] text-[#3e494a] font-medium">
                            <span className="material-symbols-outlined text-[15px] text-[#006066]">domain</span>
                            <span>
                              Sede solicitada: <strong className="text-[#0d1c2e]">{SEDES[s.sedeSolicitadaId].corto}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e6eeff]">
                      <button
                        type="button"
                        onClick={() => setRechazando(s)}
                        disabled={processingId === s.solicitudId}
                        className="px-3 py-2.5 rounded-lg bg-[#ffdad6]/60 hover:bg-[#ffdad6] text-[#ba1a1a] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        Rechazar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(s.solicitudId)}
                        disabled={processingId === s.solicitudId}
                        className="px-3 py-2.5 rounded-lg bg-[#0d7a82] hover:bg-[#006066] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        {processingId === s.solicitudId ? 'Procesando...' : 'Aprobar'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <RechazarReprogramacionModal
        solicitud={rechazando}
        session={session}
        onClose={() => setRechazando(null)}
        onRechazada={handleRechazada}
        onStale={handleStale}
      />
    </div>
  );
};
