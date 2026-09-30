import React, { useEffect, useState } from 'react';
import {
  ApiErrorBody,
  HorarioDisponible,
  MiCitaApi,
  ReprogramarResponse,
  SedeId,
  SEDES,
  UserSession
} from '../types';
import { API_URL, apiFetch } from '../api/session';
import { t } from '../i18n';


interface ReprogramarCitaModalProps {
  session: UserSession;
  cita: MiCitaApi;
  resumen: { especialidadNombre: string; profesionalNombre: string };
  onClose: () => void;
  onReprogramada: (resultado: ReprogramarResponse) => void;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function horaHHmm(isoDateTime: string): string {
  return (isoDateTime.split('T')[1] ?? '').slice(0, 5);
}

/**
 * HU-019: POST /api/appointments/{id}/reschedule. El backend conserva profesional y especialidad
 * automáticamente (no van en el body) — el usuario solo elige sede, fecha y horario nuevo entre los
 * horarios reales de ESE MISMO profesional (GET /api/availability filtrado por profesionalId).
 */
export const ReprogramarCitaModal: React.FC<ReprogramarCitaModalProps> = ({
  session,
  cita,
  resumen,
  onClose,
  onReprogramada
}) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [sede, setSede] = useState<SedeId>(cita.sedeId);
  const [fecha, setFecha] = useState(tomorrowDate());

  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<HorarioDisponible | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setLoadingHorarios(true);
    setAvailabilityError(null);
    setSeleccionado(null);

    const params = new URLSearchParams({
      especialidadId: String(cita.especialidadId),
      fecha,
      sedeId: String(sede),
      profesionalId: String(cita.profesionalId)
    });

    apiFetch(`${API_URL}/api/availability?${params.toString()}`, { headers: authHeaders })
      .then(async (resp) => {
        if (!resp.ok) throw new Error();
        return (await resp.json()) as HorarioDisponible[];
      })
      .then((data) => {
        if (!cancelado) setHorarios(data);
      })
      .catch(() => {
        if (!cancelado) setAvailabilityError(t("No se pudo consultar la disponibilidad. Inténtalo de nuevo."));
      })
      .finally(() => {
        if (!cancelado) setLoadingHorarios(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sede, fecha]);

  const handleConfirm = async () => {
    if (!seleccionado) return;
    setEnviando(true);
    setError(null);

    const body = {
      sedeId: sede,
      fecha,
      horaInicio: `${horaHHmm(seleccionado.inicio)}:00`
    };

    try {
      const resp = await apiFetch(`${API_URL}/api/appointments/${cita.citaId}/reschedule`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      if (resp.status === 409) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || t("El horario seleccionado ya no está disponible. Elige otro turno."));
        setSeleccionado(null);
        setFecha((f) => f);
        return;
      }
      if (resp.status === 400 || resp.status === 404) {
        const err: ApiErrorBody = await resp.json();
        setError(err.message || t("No se pudo solicitar la reprogramación."));
        return;
      }
      if (!resp.ok) {
        setError(t(
          "No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo."
        ));
        return;
      }

      const resultado: ReprogramarResponse = await resp.json();
      onReprogramada(resultado);
    } catch {
      setError(t(
        "No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo."
      ));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#233144]/60 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
    >
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#d5e3fc]">
        <div className="p-5 bg-[#eff4ff] flex items-start justify-between gap-3 border-b border-[#e6eeff]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#006066] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">update</span>
            </div>
            <div>
              <h2 id="reschedule-modal-title" className="font-display text-lg font-bold text-[#0d1c2e]">
                {t("Solicitar Reprogramación")}
              </h2>
              <p className="text-xs text-[#3e494a]">
                {resumen.especialidadNombre} · {resumen.profesionalNombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#3e494a] hover:text-[#0d1c2e] p-1.5 rounded-lg hover:bg-[#dce9ff] transition-colors"
            title={t("Cerrar ventana")}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <div className="p-3 bg-[#e6eeff] rounded-xl flex items-start gap-2.5 text-xs text-[#3e494a]">
            <span className="material-symbols-outlined text-[18px] text-[#006066] shrink-0 mt-0.5">help_outline</span>
            <p className="leading-snug">
              {t(
                "El nuevo turno se busca con el mismo profesional y especialidad. Tu cita actual sigue vigente hasta que la coordinación administrativa apruebe o rechace la solicitud (queda en estado"
              )}{' '}
              <strong>{t("PENDING")}</strong>).
                          </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#0d1c2e]">{t("Sede")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {([1, 2] as SedeId[]).map((sedeId) => (
                <label
                  key={sedeId}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    sede === sedeId
                      ? 'border-[#006066] bg-[#eff4ff] ring-1 ring-[#006066]'
                      : 'border-[#d5e3fc] bg-white hover:bg-[#eff4ff]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reschedule-venue"
                    checked={sede === sedeId}
                    onChange={() => setSede(sedeId)}
                    className="w-4 h-4 accent-[#006066]"
                  />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-[#0d1c2e]">{SEDES[sedeId].corto}</span>
                    <span className="text-[11px] text-[#3e494a]">{SEDES[sedeId].direccion}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="reschedule-date" className="text-xs font-semibold text-[#0d1c2e]">
              {t("Nueva fecha")}
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[18px] text-[#006066] absolute left-3 pointer-events-none">
                event
              </span>
              <input
                id="reschedule-date"
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#eff4ff] border border-[#d5e3fc] text-[#0d1c2e] text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006066]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-[#0d1c2e]">{t("Turnos disponibles")}</label>

            {loadingHorarios && (
              <div className="py-6 flex flex-col items-center text-center text-[#6e797a]">
                <span className="material-symbols-outlined text-[26px] text-[#0d7a82] animate-spin">progress_activity</span>
                <p className="text-xs mt-2">{t("Consultando disponibilidad real...")}</p>
              </div>
            )}

            {!loadingHorarios && availabilityError && (
              <div className="p-3 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                {availabilityError}
              </div>
            )}

            {!loadingHorarios && !availabilityError && horarios.length === 0 && (
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e6eeff] text-xs text-[#3e494a] text-center">
                {t(
                  "Este profesional no tiene turnos disponibles en esa sede/fecha. Prueba otra fecha."
                )}
              </div>
            )}

            {!loadingHorarios && !availabilityError && horarios.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#f8f9ff] border border-[#e6eeff] p-3.5 rounded-xl">
                {horarios.map((h) => {
                  const isSelected = seleccionado?.inicio === h.inicio;
                  return (
                    <button
                      key={h.inicio}
                      type="button"
                      onClick={() => setSeleccionado(h)}
                      className={`px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-[#006066] text-white font-semibold shadow-xs'
                          : 'bg-[#e6eeff] text-[#0d1c2e] hover:bg-[#dce9ff]'
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}
                      <span>{horaHHmm(h.inicio)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 text-red-950 rounded-xl flex items-start gap-2.5 text-xs border border-red-200">
              <span className="material-symbols-outlined text-[20px] text-[#ba1a1a] shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#e6eeff] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#436088] hover:bg-[#eff4ff] transition-colors disabled:opacity-50"
            >
              {t("Descartar")}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!seleccionado || enviando}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#006066] to-[#0d7a82] text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{enviando ? 'Enviando...' : t("Confirmar y Enviar Solicitud")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
