import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CierreResponse,
  EstadoCita,
  MiCitaApi,
  ProfessionalApi,
  ReprogramarResponse,
  SEDES,
  SpecialtyApi,
  UserSession
} from '../types';
import { CancelarCitaModal } from './CancelarCitaModal';
import { ReprogramarCitaModal } from './ReprogramarCitaModal';
import { HistorialCitaModal } from './HistorialCitaModal';
import { API_URL, apiFetch } from '../api/session';
import { t } from '../i18n';


interface MisCitasScreenProps {
  session: UserSession;
  onNuevaCita: () => void;
  onVolverInicio: () => void;
}

type FiltroEstado = 'ALL' | EstadoCita;

const ESTADO_LABEL: Record<EstadoCita, string> = {
  APPROVED: 'Confirmada',
  REQUESTED: 'En revisión',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió'
};

const ESTADO_COLOR: Record<EstadoCita, { barra: string; badge: string; punto: string; icono: string }> = {
  APPROVED: { barra: 'bg-[#0d7a82]', badge: 'bg-blue-100 text-blue-900', punto: 'bg-blue-600', icono: 'text-[#006066]' },
  REQUESTED: { barra: 'bg-amber-400', badge: 'bg-amber-100 text-amber-900', punto: 'bg-amber-500 animate-pulse', icono: 'text-amber-700' },
  REJECTED: { barra: 'bg-[#ba1a1a]', badge: 'bg-red-100 text-red-900', punto: 'bg-red-600', icono: 'text-[#ba1a1a]' },
  CANCELLED: { barra: 'bg-[#bdc9ca]', badge: 'bg-gray-100 text-gray-700', punto: 'bg-gray-400', icono: 'text-[#6e797a]' },
  COMPLETED: { barra: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-900', punto: 'bg-emerald-600', icono: 'text-emerald-700' },
  NO_SHOW: { barra: 'bg-[#436088]', badge: 'bg-slate-200 text-slate-800', punto: 'bg-slate-500', icono: 'text-[#436088]' }
};

function formatFechaHora(iso: string): { fecha: string; hora: string } {
  const [fecha, horaCompleta] = iso.split('T');
  return { fecha, hora: (horaCompleta ?? '').slice(0, 5) };
}

/** HU-017/HU-018/HU-019: mis citas reales, cancelación y solicitud de reprogramación contra citas-api. */
export const MisCitasScreen: React.FC<MisCitasScreenProps> = ({ session, onNuevaCita, onVolverInicio }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [citas, setCitas] = useState<MiCitaApi[]>([]);
  const [historialCitaId, setHistorialCitaId] = useState<number | null>(null);
  const [specialties, setSpecialties] = useState<SpecialtyApi[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('ALL');
  const [fechaFiltro, setFechaFiltro] = useState('');

  const [citaParaCancelar, setCitaParaCancelar] = useState<MiCitaApi | null>(null);
  const [citaParaReprogramar, setCitaParaReprogramar] = useState<MiCitaApi | null>(null);

  const [banner, setBanner] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [respCitas, respEsp, respProf] = await Promise.all([
        apiFetch(`${API_URL}/api/appointments/mine`, { headers: authHeaders }),
        apiFetch(`${API_URL}/api/specialties`, { headers: authHeaders }),
        apiFetch(`${API_URL}/api/professionals`, { headers: authHeaders })
      ]);
      if (!respCitas.ok || !respEsp.ok || !respProf.ok) {
        throw new Error(t("No se pudo cargar la información."));
      }
      const dataCitas: MiCitaApi[] = await respCitas.json();
      const dataEsp: SpecialtyApi[] = await respEsp.json();
      const dataProf: ProfessionalApi[] = await respProf.json();
      setCitas(dataCitas);
      setSpecialties(dataEsp);
      setProfessionals(dataProf);
    } catch {
      setLoadError(t(
        "No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo."
      ));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nombreEspecialidad = (id: number) => specialties.find((s) => s.id === id)?.nombre ?? t("Especialidad #{id}", {
    id: id
  });
  const nombreProfesional = (id: number) => professionals.find((p) => p.profesionalId === id)?.nombreCompleto ?? t("Profesional #{id}", {
    id: id
  });

  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      if (estadoFiltro !== 'ALL' && c.estado !== estadoFiltro) return false;
      if (fechaFiltro && !c.inicio.startsWith(fechaFiltro)) return false;
      return true;
    });
  }, [citas, estadoFiltro, fechaFiltro]);

  const conteo = (estado: EstadoCita) => citas.filter((c) => c.estado === estado).length;

  const resumenDe = (cita: MiCitaApi) => ({
    sedeNombre: SEDES[cita.sedeId].nombre,
    especialidadNombre: nombreEspecialidad(cita.especialidadId),
    profesionalNombre: nombreProfesional(cita.profesionalId)
  });

  const handleCancelada = (resultado: CierreResponse) => {
    setCitaParaCancelar(null);
    setBanner({ tipo: 'success', texto: t("Cita #{citaId} cancelada. El cupo quedó liberado.", {
      citaId: resultado.citaId
    }) });
    cargar();
  };

  const handleReprogramada = (resultado: ReprogramarResponse) => {
    setCitaParaReprogramar(null);
    setBanner({
      tipo: 'success',
      texto: t(
        "Solicitud de reprogramación #{solicitudId} enviada. Tu cita actual sigue vigente hasta que la administración decida.",
        {
          solicitudId: resultado.solicitudId
        }
      )
    });
    // Refresca desde el backend en vez de guardar el resultado solo en memoria: GET /api/appointments/mine ya
    // trae el desenlace real de la reprogramación (cita.reprogramacion), así que sobrevive a un recargo de página.
    cargar();
  };

  const resetFiltros = () => {
    setEstadoFiltro('ALL');
    setFechaFiltro('');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
        <p className="text-sm text-[#3e494a] mt-3">{t("Cargando tus citas...")}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
          <span className="material-symbols-outlined text-[28px]">wifi_off</span>
          <div>
            <h3 className="font-bold">{t("Error de Conexión")}</h3>
            <p className="text-sm mt-1">{loadError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-5">
      {banner && (
        <div
          className={`w-full p-4 rounded-xl shadow-md flex items-start justify-between gap-3 border ${
            banner.tipo === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
              : 'bg-red-50 text-red-950 border-red-200'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <span className={`material-symbols-outlined text-[22px] shrink-0 mt-0.5 ${banner.tipo === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
              {banner.tipo === 'success' ? 'check_circle' : 'warning'}
            </span>
            <p className="text-sm">{banner.texto}</p>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="opacity-70 hover:opacity-100 p-1 rounded-lg hover:bg-black/5"
            title={t("Cerrar notificación")}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onVolverInicio}
        className="self-start text-xs font-medium text-[#3e494a] hover:text-[#006066] flex items-center gap-1 transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
        <span>{t("Volver al inicio")}</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">{t("Mis Citas Médicas")}</h1>
          <p className="text-sm text-[#3e494a] max-w-3xl leading-relaxed">
            {t(
              "Historial y seguimiento de tus consultas en el Hospital Internacional de Colombia (HIC) y el Instituto Cardiovascular (ICV)."
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onNuevaCita}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#006066] to-[#0d7a82] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>{t("Agendar Nueva Cita")}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#006066]">
            <span className="material-symbols-outlined text-[22px]">event_upcoming</span>
          </div>
          <div>
            <span className="font-display text-lg font-bold text-[#0d1c2e] block leading-tight">{conteo('APPROVED')}</span>
            <span className="text-xs text-[#3e494a]">{t("Confirmadas")}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700">
            <span className="material-symbols-outlined text-[22px]">pending_actions</span>
          </div>
          <div>
            <span className="font-display text-lg font-bold text-[#0d1c2e] block leading-tight">{conteo('REQUESTED')}</span>
            <span className="text-xs text-[#3e494a]">{t("En Revisión")}</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
            <span className="material-symbols-outlined text-[22px]">task_alt</span>
          </div>
          <div>
            <span className="font-display text-lg font-bold text-[#0d1c2e] block leading-tight">{conteo('COMPLETED')}</span>
            <span className="text-xs text-[#3e494a]">{t("Completadas")}</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setEstadoFiltro('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${estadoFiltro === 'ALL' ? 'bg-[#006066] text-white shadow-xs' : 'bg-[#e6eeff] text-[#3e494a] hover:bg-[#dce9ff]'}`}
            >
              {t("Todas (")}{citas.length})
                          </button>
            {(Object.keys(ESTADO_LABEL) as EstadoCita[]).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => setEstadoFiltro(estado)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${estadoFiltro === estado ? 'bg-[#006066] text-white shadow-xs' : 'bg-[#e6eeff] text-[#3e494a] hover:bg-[#dce9ff]'}`}
              >
                {t(ESTADO_LABEL[estado])} ({conteo(estado)})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-auto">
              <span className="material-symbols-outlined text-[18px] text-[#3e494a] absolute left-3 pointer-events-none">calendar_month</span>
              <input
                type="date"
                title={t("Filtrar por fecha")}
                value={fechaFiltro}
                onChange={(e) => setFechaFiltro(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-lg bg-white border border-[#d5e3fc] text-xs text-[#0d1c2e] focus:bg-[#eff4ff] focus:outline-none focus:ring-1 focus:ring-[#006066] transition-all w-full sm:w-auto shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={resetFiltros}
              title={t("Limpiar filtros")}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#3e494a] hover:text-[#006066] hover:bg-[#e6eeff] transition-all flex items-center gap-1 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              <span className="hidden md:inline">{t("Limpiar")}</span>
            </button>
          </div>
        </div>
      </div>

      {citasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl p-8 sm:p-12 text-center shadow-xs border border-[#e6eeff] flex flex-col items-center justify-center my-4">
          <div className="w-20 h-20 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0d7a82] mb-4 border border-[#d5e3fc]">
            <span className="material-symbols-outlined text-[42px]">calendar_today</span>
          </div>
          <h3 className="font-display text-lg font-bold text-[#0d1c2e] mb-1">
            {citas.length === 0 ? t("Aún no tienes citas agendadas") : t("Sin resultados para este filtro")}
          </h3>
          <p className="text-xs text-[#3e494a] max-w-md mb-6 leading-relaxed">
            {citas.length === 0
              ? t("No se encontraron registros de citas activas en HIC ni en ICV.")
              : t("Prueba con otro estado o limpia el filtro de fecha.")}
          </p>
          {citas.length === 0 && (
            <button
              type="button"
              onClick={onNuevaCita}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#006066] text-white shadow-md hover:bg-[#0d7a82] transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>{t("Agendar Cita Médica Ahora")}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {citasFiltradas.map((cita) => {
            const colores = ESTADO_COLOR[cita.estado];
            const { fecha, hora } = formatFechaHora(cita.inicio);
            const reprogramacion = cita.reprogramacion;
            const esFutura = new Date(cita.inicio) > new Date();
            const puedeCancelar = (cita.estado === 'APPROVED' || cita.estado === 'REQUESTED') && esFutura;
            const puedeReprogramar = cita.estado === 'APPROVED' && esFutura && reprogramacion?.estado !== 'PENDING';

            return (
              <article
                key={cita.citaId}
                className={`bg-white rounded-xl shadow-xs border border-[#e6eeff] overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md ${
                  cita.estado === 'CANCELLED' ? 'opacity-85' : ''
                }`}
              >
                <div className={`w-full md:w-3 shrink-0 ${colores.barra}`}></div>

                <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs border border-[#e6eeff] bg-[#eff4ff] ${colores.icono}`}>
                        <span className="material-symbols-outlined text-[28px]">medical_services</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 ${colores.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${colores.punto}`}></span>
                            {t(ESTADO_LABEL[cita.estado])} ({cita.estado})
                          </span>
                          <span className="text-[11px] text-[#3e494a]">{t("Cita #")}{cita.citaId}</span>
                        </div>
                        <h3 className={`font-display text-lg font-bold text-[#0d1c2e] ${cita.estado === 'CANCELLED' ? 'line-through opacity-70' : ''}`}>
                          {nombreEspecialidad(cita.especialidadId)}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#3e494a] mt-0.5">
                          <span className="material-symbols-outlined text-[18px] text-[#006066]">stethoscope</span>
                          <span className="font-medium text-[#0d1c2e]">{nombreProfesional(cita.profesionalId)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#eff4ff] px-4 py-2 rounded-xl flex items-center gap-3 shrink-0 border border-[#d5e3fc]">
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold text-[#0d1c2e] flex items-center gap-1 ${cita.estado === 'CANCELLED' ? 'line-through text-[#6e797a]' : ''}`}>
                          <span className="material-symbols-outlined text-[16px] text-[#006066]">schedule</span>
                          {fecha} · {hora}
                        </span>
                      </div>
                    </div>
                  </div>

                  {reprogramacion?.estado === 'PENDING' && (
                    <div className="p-3 bg-amber-50/80 rounded-lg flex items-start gap-2.5 text-xs text-amber-950 border border-amber-200">
                      <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0 mt-0.5">hourglass_top</span>
                      <div className="flex-1">
                        <span className="font-semibold block text-amber-900">{t("Reprogramación en espera de aprobación")}</span>
                        <p className="text-amber-800">
                          {t("Solicitud #")}{reprogramacion.solicitudId}: {formatFechaHora(reprogramacion.inicioSolicitado).fecha}·{' '}
                          {formatFechaHora(reprogramacion.inicioSolicitado).hora}{t(". Tu cita actual sigue vigente.")}
                        </p>
                      </div>
                    </div>
                  )}

                  {reprogramacion?.estado === 'APPROVED' && (
                    <div className="p-3 bg-emerald-50/80 rounded-lg flex items-start gap-2.5 text-xs text-emerald-950 border border-emerald-200">
                      <span className="material-symbols-outlined text-[20px] text-emerald-700 shrink-0 mt-0.5">event_available</span>
                      <div className="flex-1">
                        <span className="font-semibold block text-emerald-900">{t("Reprogramación aprobada")}</span>
                        <p className="text-emerald-800">
                          {t("Solicitud #")}{reprogramacion.solicitudId}{t(": tu cita quedó confirmada en el nuevo horario.")}
                        </p>
                      </div>
                    </div>
                  )}

                  {reprogramacion?.estado === 'REJECTED' && (
                    <div className="p-3 bg-red-50/80 rounded-lg flex items-start gap-2.5 text-xs text-red-950 border border-red-200">
                      <span className="material-symbols-outlined text-[20px] text-[#ba1a1a] shrink-0 mt-0.5">report_problem</span>
                      <div className="flex-1">
                        <span className="font-semibold block text-[#93000a]">{t("Reprogramación rechazada")}</span>
                        <p className="text-red-800">
                          {t("Solicitud #")}{reprogramacion.solicitudId}{t(": tu cita conserva su horario original.")}
                          {reprogramacion.motivoDecision && <> {t("Motivo:")} {reprogramacion.motivoDecision}</>}
                        </p>
                      </div>
                    </div>
                  )}

                  {cita.estado === 'REJECTED' && cita.motivoDecision && (
                    <div className="p-3 bg-red-50/80 rounded-lg flex items-start gap-2.5 text-xs text-red-950 border border-red-200">
                      <span className="material-symbols-outlined text-[20px] text-[#ba1a1a] shrink-0 mt-0.5">report_problem</span>
                      <div>
                        <span className="font-semibold block text-[#93000a]">{t("Motivo del rechazo:")}</span>
                        <p className="text-red-800">{cita.motivoDecision}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                    <div className="flex items-start gap-2 text-xs text-[#3e494a] bg-[#f8f9ff] p-2.5 rounded-lg border border-[#e6eeff]">
                      <span className="material-symbols-outlined text-[18px] text-[#006066] shrink-0 mt-0.5">local_hospital</span>
                      <div>
                        <span className="font-medium text-[#0d1c2e] block">{SEDES[cita.sedeId].nombre}</span>
                        <span className="text-[11px]">{SEDES[cita.sedeId].direccion}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#f8f9ff]">
                    {puedeReprogramar && (
                      <button
                        type="button"
                        onClick={() => setCitaParaReprogramar(cita)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#006066] bg-[#006066]/10 hover:bg-[#006066]/20 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                        <span>{t("Reprogramar")}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setHistorialCitaId(cita.citaId)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#3e494a] hover:bg-[#eff4ff] transition-all flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">history</span>
                      <span>{t("Historial")}</span>
                    </button>
                    {puedeCancelar && (
                      <button
                        type="button"
                        onClick={() => setCitaParaCancelar(cita)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-all flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        <span>{t("Cancelar")}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <HistorialCitaModal citaId={historialCitaId} onClose={() => setHistorialCitaId(null)} />

      {citaParaCancelar && (
        <CancelarCitaModal
          session={session}
          cita={citaParaCancelar}
          resumen={resumenDe(citaParaCancelar)}
          onClose={() => setCitaParaCancelar(null)}
          onCancelada={handleCancelada}
        />
      )}

      {citaParaReprogramar && (
        <ReprogramarCitaModal
          session={session}
          cita={citaParaReprogramar}
          resumen={resumenDe(citaParaReprogramar)}
          onClose={() => setCitaParaReprogramar(null)}
          onReprogramada={handleReprogramada}
        />
      )}
    </div>
  );
};
