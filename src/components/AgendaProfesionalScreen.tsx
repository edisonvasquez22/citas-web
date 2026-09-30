import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActiveScreen, CierreResponse, CitaAgendaApi, SedeId, SEDES, SpecialtyApi, UserSession } from '../types';
import { ProfessionalNavTabs } from './ProfessionalNavTabs';
import { HistorialCitaModal } from './HistorialCitaModal';
import { CerrarAtencionModal } from './CerrarAtencionModal';
import { API_URL, apiFetch } from '../api/session';


interface AgendaProfesionalScreenProps {
  session: UserSession;
  onNavigate: (screen: ActiveScreen) => void;
}

function hoyISO(): string {
  return new Date().toISOString().split('T')[0];
}

function formatFechaHora(iso: string): { fecha: string; hora: string } {
  const [fecha, horaCompleta] = iso.split('T');
  return { fecha, hora: (horaCompleta ?? '').slice(0, 5) };
}

/** HU-021/HU-022: agenda real (solo citas APPROVED propias) + cierre de atención contra citas-api. */
export const AgendaProfesionalScreen: React.FC<AgendaProfesionalScreenProps> = ({ session, onNavigate }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [citas, setCitas] = useState<CitaAgendaApi[]>([]);
  const [historialCitaId, setHistorialCitaId] = useState<number | null>(null);
  const [specialties, setSpecialties] = useState<SpecialtyApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [sedeFiltro, setSedeFiltro] = useState<'ALL' | SedeId>('ALL');
  const [desde, setDesde] = useState(hoyISO());
  const [hasta, setHasta] = useState('');

  const [accionModal, setAccionModal] = useState<{ cita: CitaAgendaApi; accion: 'complete' | 'no-show' } | null>(null);
  const [banner, setBanner] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (sedeFiltro !== 'ALL') params.set('sedeId', String(sedeFiltro));
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);

      const [respAgenda, respEsp] = await Promise.all([
        apiFetch(`${API_URL}/api/professionals/me/agenda?${params.toString()}`, { headers: authHeaders }),
        apiFetch(`${API_URL}/api/specialties`, { headers: authHeaders })
      ]);
      if (!respAgenda.ok || !respEsp.ok) throw new Error('No se pudo cargar la información.');

      const dataAgenda: CitaAgendaApi[] = await respAgenda.json();
      const dataEsp: SpecialtyApi[] = await respEsp.json();
      setCitas(dataAgenda);
      setSpecialties(dataEsp);
    } catch {
      setLoadError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedeFiltro, desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nombreEspecialidad = (id: number) => specialties.find((s) => s.id === id)?.nombre ?? `Especialidad #${id}`;

  const citasOrdenadas = useMemo(() => [...citas].sort((a, b) => a.inicio.localeCompare(b.inicio)), [citas]);

  const ahora = new Date();
  const pendientesDeCierre = citas.filter((c) => new Date(c.fin) < ahora).length;
  const proximas = citas.length - pendientesDeCierre;

  const handleCerrada = (resultado: CierreResponse) => {
    setAccionModal(null);
    const etiqueta = resultado.estado === 'COMPLETED' ? 'completada' : 'marcada como no asistida';
    setBanner({ tipo: 'success', texto: `Cita #${resultado.citaId} ${etiqueta}. Ya no aparece en tu agenda de citas aprobadas.` });
    cargar();
  };

  const resetFiltros = () => {
    setSedeFiltro('ALL');
    setDesde(hoyISO());
    setHasta('');
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <ProfessionalNavTabs active="mi-agenda" onNavigate={onNavigate} />

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#eff4ff]">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase mb-2">
            <span className="material-symbols-outlined text-[14px]">event_available</span>
            Agenda del Profesional
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">Mi Agenda de Consultas</h1>
          <p className="text-sm text-[#3e494a] mt-1 max-w-2xl leading-relaxed">
            Citas ambulatorias confirmadas (APPROVED) en HIC e ICV. Al cerrar una atención (completada o no
            asistida) deja de aparecer aquí — no hay historial en esta pantalla.
          </p>
        </div>
      </div>

      {banner && (
        <div
          className={`w-full p-4 rounded-xl shadow-md flex items-start justify-between gap-3 border ${
            banner.tipo === 'success' ? 'bg-emerald-50 text-emerald-950 border-emerald-200' : 'bg-red-50 text-red-950 border-red-200'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-[22px] shrink-0 mt-0.5 ${banner.tipo === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
              {banner.tipo === 'success' ? 'check_circle' : 'warning'}
            </span>
            <p className="text-sm">{banner.texto}</p>
          </div>
          <button type="button" onClick={() => setBanner(null)} className="opacity-70 hover:opacity-100 p-1 rounded-lg hover:bg-black/5">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-10 flex flex-col items-center text-center text-[#6e797a]">
          <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
          <p className="text-sm mt-3">Cargando tu agenda...</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#006066]">
                <span className="material-symbols-outlined text-[22px]">event_note</span>
              </div>
              <div>
                <span className="font-display text-lg font-bold text-[#0d1c2e] block leading-tight">{citas.length}</span>
                <span className="text-xs text-[#3e494a]">Citas en el rango</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
                <span className="material-symbols-outlined text-[22px]">pending_actions</span>
              </div>
              <div>
                <span className="font-display text-lg font-bold text-[#0d1c2e] block leading-tight">{pendientesDeCierre}</span>
                <span className="text-xs text-[#3e494a]">Pendientes de Cierre</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#436088]">
                <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
              </div>
              <div>
                <span className="font-display text-lg font-bold text-[#0d1c2e] block leading-tight">{proximas}</span>
                <span className="text-xs text-[#3e494a]">Próximas</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['ALL', 1, 2] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSedeFiltro(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sedeFiltro === s ? 'bg-[#006066] text-white shadow-xs' : 'bg-[#e6eeff] text-[#3e494a] hover:bg-[#dce9ff]'
                  }`}
                >
                  {s === 'ALL' ? 'Todas las sedes' : SEDES[s].corto}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                title="Desde"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#d5e3fc] text-xs text-[#0d1c2e] focus:bg-[#eff4ff] focus:outline-none focus:ring-1 focus:ring-[#006066] transition-all shadow-xs"
              />
              <span className="text-xs text-[#6e797a]">a</span>
              <input
                type="date"
                title="Hasta"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#d5e3fc] text-xs text-[#0d1c2e] focus:bg-[#eff4ff] focus:outline-none focus:ring-1 focus:ring-[#006066] transition-all shadow-xs"
              />
              <button
                type="button"
                onClick={resetFiltros}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#3e494a] hover:text-[#006066] hover:bg-[#e6eeff] transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                <span className="hidden md:inline">Limpiar</span>
              </button>
            </div>
          </div>

          {citasOrdenadas.length === 0 ? (
            <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-xs border border-[#e6eeff] flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#eff4ff] text-[#6e797a] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">event_busy</span>
              </div>
              <h3 className="font-display font-semibold text-lg text-[#0d1c2e]">No hay citas programadas</h3>
              <p className="text-sm text-[#3e494a] mt-2 max-w-md">
                No tienes citas aprobadas para los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {citasOrdenadas.map((cita) => {
                const { fecha, hora } = formatFechaHora(cita.inicio);
                const horaFin = formatFechaHora(cita.fin).hora;
                const yaFinalizo = new Date(cita.fin) < ahora;

                return (
                  <article
                    key={cita.citaId}
                    className={`bg-white rounded-xl p-5 shadow-xs border border-[#e6eeff] flex flex-col gap-4 border-l-4 ${
                      yaFinalizo ? 'border-l-[#006066]' : 'border-l-[#b4d0ff]'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${yaFinalizo ? 'bg-[#006066]/10 text-[#006066]' : 'bg-[#b4d0ff]/30 text-[#436088]'}`}>
                          <span className="material-symbols-outlined text-[26px]">{yaFinalizo ? 'badge' : 'hourglass_top'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base text-[#0d1c2e] font-bold">Paciente #{cita.pacienteUsuarioId}</span>
                            <span className="text-[11px] font-mono text-[#6e797a]">Cita #{cita.citaId}</span>
                          </div>
                          <span className="font-semibold text-[#006066] text-sm">{nombreEspecialidad(cita.especialidadId)}</span>
                          <div className="flex items-center gap-2 text-[#3e494a] text-xs mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[16px] text-[#436088]">domain</span>
                              {SEDES[cita.sedeId].corto}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold font-mono bg-[#dce9ff] text-[#0d1c2e] self-start lg:self-auto">
                        <span className="material-symbols-outlined text-[18px] text-[#006066]">schedule</span>
                        {fecha} · {hora} - {horaFin}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHistorialCitaId(cita.citaId)}
                      className="self-start inline-flex items-center gap-1 text-xs font-semibold text-[#006066] hover:underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">history</span>
                      Ver historial
                    </button>

                    {yaFinalizo ? (
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-[#e6eeff]">
                        <span className="text-xs text-[#3e494a] mr-auto">Hora de fin ya transcurrida: confirma el resultado de la atención.</span>
                        <button
                          type="button"
                          onClick={() => setAccionModal({ cita, accion: 'no-show' })}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#eff4ff] hover:bg-[#ffdad6] text-[#3e494a] hover:text-[#ba1a1a] text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-[#e6eeff]"
                        >
                          <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">person_off</span>
                          No Asistió
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccionModal({ cita, accion: 'complete' })}
                          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#0d7a82] hover:bg-[#006066] text-white text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[20px]">check_circle</span>
                          Marcar Completada
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-lg bg-[#eff4ff] flex items-center gap-1.5 text-xs text-[#3e494a]">
                        <span className="material-symbols-outlined text-[#436088] text-[18px]">lock_clock</span>
                        Las acciones de cierre se habilitan al finalizar la hora de la cita ({horaFin}).
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <HistorialCitaModal citaId={historialCitaId} onClose={() => setHistorialCitaId(null)} />

      {accionModal && (
        <CerrarAtencionModal
          session={session}
          cita={accionModal.cita}
          accion={accionModal.accion}
          resumen={{ especialidadNombre: nombreEspecialidad(accionModal.cita.especialidadId), sedeNombre: SEDES[accionModal.cita.sedeId].nombre }}
          onClose={() => setAccionModal(null)}
          onCerrada={handleCerrada}
        />
      )}
    </div>
  );
};
