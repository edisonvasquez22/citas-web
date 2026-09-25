import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiErrorBody, AvailabilityBlockApi, SedeId, SEDES, UserSession } from '../types';
import { EditAvailabilityBlockModal } from './EditAvailabilityBlockModal';
import { DeleteAvailabilityBlockModal } from './DeleteAvailabilityBlockModal';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface DisponibilidadProfesionalScreenProps {
  session: UserSession;
}

type PeriodoFiltro = 'todos' | 'semana-actual' | 'semana-siguiente';

function calcularDuracionMinutos(inicio: string, fin: string): number {
  const [hI, mI] = inicio.split(':').map(Number);
  const [hF, mF] = fin.split(':').map(Number);
  return hF * 60 + mF - (hI * 60 + mI);
}

function hoyISO(): string {
  return new Date().toISOString().split('T')[0];
}

function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dias);
  return date.toISOString().split('T')[0];
}

/** Lunes-domingo de la semana actual (offsetSemanas=1 para la próxima semana). */
function rangoSemana(offsetSemanas: number): [string, string] {
  const now = new Date();
  const dia = now.getDay(); // 0=domingo..6=sábado
  const diffALunes = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffALunes + offsetSemanas * 7);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  const aTexto = (d: Date) => d.toISOString().split('T')[0];
  return [aTexto(lunes), aTexto(domingo)];
}

function formatFechaLarga(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const formatted = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export const DisponibilidadProfesionalScreen: React.FC<DisponibilidadProfesionalScreenProps> = ({ session }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [blocks, setBlocks] = useState<AvailabilityBlockApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; title: string; message: string } | null>(null);

  // Formulario de creación
  const [formSedeId, setFormSedeId] = useState<SedeId>(1);
  const [formFecha, setFormFecha] = useState(hoyISO());
  const [formHoraInicio, setFormHoraInicio] = useState('08:00');
  const [formHoraFin, setFormHoraFin] = useState('12:00');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Filtros de la lista
  const [periodoFiltro, setPeriodoFiltro] = useState<PeriodoFiltro>('todos');
  const [sedeFiltro, setSedeFiltro] = useState<'ALL' | SedeId>('ALL');

  // Modales
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlockApi | null>(null);
  const [deletingBlock, setDeletingBlock] = useState<AvailabilityBlockApi | null>(null);

  const loadBlocks = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const resp = await fetch(`${API_URL}/api/professionals/me/availability-blocks`, { headers: authHeaders });
      if (!resp.ok) throw new Error();
      const data: AvailabilityBlockApi[] = await resp.json();
      setBlocks(data);
      if (isRefresh) {
        setFeedback({ type: 'info', title: 'Agenda actualizada', message: 'Se recargaron tus bloques de disponibilidad.' });
      }
    } catch {
      setLoadError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.accessToken]);

  useEffect(() => {
    loadBlocks(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const duracion = calcularDuracionMinutos(formHoraInicio, formHoraFin);
    if (duracion <= 0) {
      setFormError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }
    if (duracion % 30 !== 0) {
      setFormError('El bloque debe durar un múltiplo exacto de 30 minutos.');
      return;
    }

    setCreating(true);
    try {
      const resp = await fetch(`${API_URL}/api/professionals/me/availability-blocks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          sedeId: formSedeId,
          fecha: formFecha,
          horaInicio: `${formHoraInicio}:00`,
          horaFin: `${formHoraFin}:00`
        })
      });

      if (resp.status === 400) {
        const err: ApiErrorBody = await resp.json();
        setFormError(err.message || 'No se pudo crear el bloque. Verifica los datos ingresados.');
        return;
      }
      if (!resp.ok) {
        setFormError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      const nuevo: AvailabilityBlockApi = await resp.json();
      setBlocks((prev) => [...prev, nuevo]);
      setFeedback({
        type: 'success',
        title: 'Bloque creado',
        message: `Bloque en ${SEDES[formSedeId].corto} para el ${formFecha} (${formHoraInicio} - ${formHoraFin}) publicado correctamente.`
      });
    } catch {
      setFormError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setCreating(false);
    }
  };

  const handleResetForm = () => {
    setFormSedeId(1);
    setFormFecha(hoyISO());
    setFormHoraInicio('08:00');
    setFormHoraFin('12:00');
    setFormError(null);
  };

  const handleUpdated = (actualizado: AvailabilityBlockApi) => {
    setBlocks((prev) => prev.map((b) => (b.id === actualizado.id ? actualizado : b)));
    setFeedback({ type: 'success', title: 'Bloque actualizado', message: 'Los cambios de horario se guardaron correctamente.' });
  };

  const handleDeleted = (id: number) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setFeedback({ type: 'info', title: 'Bloque eliminado', message: 'El bloque se eliminó y ya no está disponible para reserva.' });
  };

  // Métricas de la semana actual (independientes de los filtros de la lista, siempre derivadas de datos reales).
  const [semanaIni, semanaFin] = rangoSemana(0);
  const bloquesSemanaActual = useMemo(
    () => blocks.filter((b) => b.fecha >= semanaIni && b.fecha <= semanaFin),
    [blocks, semanaIni, semanaFin]
  );
  const totalBloquesSemana = bloquesSemanaActual.length;
  const totalHorasSemana = (
    bloquesSemanaActual.reduce((sum, b) => sum + calcularDuracionMinutos(b.horaInicio.slice(0, 5), b.horaFin.slice(0, 5)), 0) / 60
  ).toFixed(1);
  const totalCuposSemana = bloquesSemanaActual.reduce(
    (sum, b) => sum + Math.floor(calcularDuracionMinutos(b.horaInicio.slice(0, 5), b.horaFin.slice(0, 5)) / 30),
    0
  );

  // Lista filtrada + agrupada por fecha
  const bloquesFiltrados = useMemo(() => {
    let list = [...blocks];
    if (sedeFiltro !== 'ALL') list = list.filter((b) => b.sedeId === sedeFiltro);
    if (periodoFiltro === 'semana-actual') {
      const [ini, fin] = rangoSemana(0);
      list = list.filter((b) => b.fecha >= ini && b.fecha <= fin);
    } else if (periodoFiltro === 'semana-siguiente') {
      const [ini, fin] = rangoSemana(1);
      list = list.filter((b) => b.fecha >= ini && b.fecha <= fin);
    }
    return list.sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));
  }, [blocks, sedeFiltro, periodoFiltro]);

  const gruposPorFecha = useMemo(() => {
    const mapa = new Map<string, AvailabilityBlockApi[]>();
    for (const b of bloquesFiltrados) {
      if (!mapa.has(b.fecha)) mapa.set(b.fecha, []);
      mapa.get(b.fecha)!.push(b);
    }
    const hoy = hoyISO();
    const maniana = sumarDias(hoy, 1);
    return Array.from(mapa.entries()).map(([fecha, items]) => {
      const totalMin = items.reduce((sum, b) => sum + calcularDuracionMinutos(b.horaInicio.slice(0, 5), b.horaFin.slice(0, 5)), 0);
      return {
        fecha,
        formattedDate: formatFechaLarga(fecha),
        badge: fecha === hoy ? 'Hoy' : fecha === maniana ? 'Mañana' : undefined,
        totalHoras: (totalMin / 60).toFixed(1),
        blocks: items
      };
    });
  }, [bloquesFiltrados]);

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Encabezado de sección */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-[#eff4ff]">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase mb-2">
            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
            Agenda del Profesional
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">
            Mi Calendario de Disponibilidad
          </h1>
          <p className="text-sm text-[#3e494a] mt-1 max-w-2xl leading-relaxed">
            Define tus bloques de horario por sede asistencial. El sistema discretiza automáticamente cada
            bloque en franjas de 30 minutos para que los pacientes puedan reservar consultas contigo.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadBlocks(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#bdc9ca]/70 hover:bg-[#eff4ff] text-[#0d1c2e] transition-all text-xs font-semibold shadow-xs disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${refreshing ? 'animate-spin' : ''}`}>sync</span>
            Refrescar Agenda
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#bdc9ca]/70 hover:bg-[#eff4ff] text-[#3e494a] transition-all text-xs font-semibold shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Imprimir
          </button>
        </div>
      </div>

      {/* Banner de retroalimentación */}
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

      {/* Métricas de la semana actual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#6e797a] font-semibold">Bloques Programados</span>
            <span className="text-2xl font-bold text-[#0d1c2e] mt-1">{totalBloquesSemana}</span>
            <span className="text-[11px] text-[#3e494a] mt-0.5">Semana actual, ambas sedes</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#006066] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">date_range</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#6e797a] font-semibold">Horas Ofertadas</span>
            <span className="text-2xl font-bold text-[#0d1c2e] mt-1">{totalHorasSemana} h</span>
            <span className="text-[11px] text-[#3e494a] mt-0.5">Semana actual</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#006066] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">schedule</span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-[#6e797a] font-semibold">Cupos Estimados</span>
            <span className="text-2xl font-bold text-[#0d1c2e] mt-1">{totalCuposSemana}</span>
            <span className="text-[11px] text-[#3e494a] mt-0.5">Franjas de 30 min, semana actual</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#eff4ff] text-[#006066] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]">supervised_user_circle</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-10 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
          <p className="text-sm text-[#3e494a] mt-3">Cargando tu calendario de disponibilidad...</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* IZQUIERDA: formulario de creación */}
          <section className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-[#e6eeff] overflow-hidden lg:sticky lg:top-24">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#436088]"></div>
            <div className="p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3 border-b border-[#eff4ff] pb-3">
                <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#006066] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">add_circle</span>
                </div>
                <div>
                  <h2 className="font-display font-semibold text-base sm:text-lg text-[#0d1c2e]">Crear Bloque de Horario</h2>
                  <p className="text-xs text-[#3e494a]">Registra una nueva franja de consulta ambulatoria</p>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-[#ffdad6] border-l-4 border-[#ba1a1a] rounded text-xs text-[#93000a] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">error</span>
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                {/* Sede */}
                <div>
                  <label className="block text-sm font-semibold text-[#0d1c2e] mb-2">
                    Sede Hospitalaria <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Seleccionar sede">
                    {([1, 2] as SedeId[]).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFormSedeId(id)}
                        className={`text-left p-3 rounded-xl transition-all flex items-start gap-2.5 border ${
                          formSedeId === id
                            ? 'bg-[#eff4ff] border-[#0d7a82] ring-2 ring-[#0d7a82]/20 shadow-xs'
                            : 'bg-white border-[#e6eeff] hover:bg-[#f8f9ff]'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            formSedeId === id ? 'bg-[#0d7a82] text-white' : 'bg-[#e6eeff] text-[#3e494a]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{id === 1 ? 'local_hospital' : 'cardiology'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-xs text-[#0d1c2e] block">{SEDES[id].corto}</span>
                          <span className="text-[11px] text-[#6e797a] block truncate mt-0.5">{SEDES[id].direccion}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fecha */}
                <div>
                  <label htmlFor="form-fecha" className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                    Fecha de Consulta <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#6e797a] text-[18px] pointer-events-none">
                      calendar_today
                    </span>
                    <input
                      id="form-fecha"
                      type="date"
                      value={formFecha}
                      min={hoyISO()}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#eff4ff] border border-[#bdc9ca]/60 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-[#6e797a] mt-1.5">No se admiten fechas pasadas (Regla HU-012).</p>
                </div>

                {/* Horario */}
                <div>
                  <label className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                    Franja Horaria <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-medium text-[#6e797a] block mb-1">Hora Inicio</span>
                      <input
                        type="time"
                        step={1800}
                        value={formHoraInicio}
                        onChange={(e) => setFormHoraInicio(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#bdc9ca]/60 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-[#6e797a] block mb-1">Hora Fin</span>
                      <input
                        type="time"
                        step={1800}
                        value={formHoraFin}
                        onChange={(e) => setFormHoraFin(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#eff4ff] border border-[#bdc9ca]/60 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  {/* Preview de discretización */}
                  {(() => {
                    const dur = calcularDuracionMinutos(formHoraInicio, formHoraFin);
                    const valido = dur > 0 && dur % 30 === 0;
                    const texto = dur <= 0 ? 'Horario no válido' : dur % 30 !== 0 ? 'Debe ser múltiplo de 30 min' : `${(dur / 60).toFixed(1)} h • ${Math.floor(dur / 30)} cupos`;
                    return (
                      <div
                        className={`mt-2 p-3 rounded-lg border flex items-center justify-between text-xs ${
                          valido ? 'bg-[#eff4ff] border-[#dce9ff] text-[#3e494a]' : 'bg-[#ffdad6] border-[#ba1a1a]/30 text-[#93000a]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="material-symbols-outlined text-[16px]">timelapse</span>
                          Discretización automática:
                        </span>
                        <span className="font-semibold">{texto}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-3 bg-[#eff4ff]/70 rounded-lg border border-[#e6eeff] text-[#3e494a] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#006066] text-[16px] shrink-0 mt-0.5">policy</span>
                  <p className="text-[11px] leading-relaxed">
                    <strong>Regla HU-012:</strong> los bloques deben ser continuos en múltiplos exactos de 30
                    minutos y no pueden solaparse con otro bloque propio.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full sm:flex-1 py-3 px-4 rounded-lg bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-[18px]">event_available</span>
                    <span>{creating ? 'Publicando...' : 'Guardar y Publicar Bloque'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full sm:w-auto py-3 px-4 rounded-lg bg-transparent border border-[#bdc9ca] hover:bg-[#eff4ff] text-[#3e494a] text-sm font-semibold transition-all"
                  >
                    Limpiar
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* DERECHA: agenda cronológica */}
          <section className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-[#e6eeff] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#436088]"></div>
            <div className="p-5 sm:p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eff4ff]">
                <div>
                  <h2 className="font-display font-semibold text-base sm:text-lg text-[#0d1c2e]">Bloques Programados</h2>
                  <p className="text-xs text-[#6e797a] mt-0.5">Franjas visibles para reserva de pacientes FCV</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={sedeFiltro}
                    onChange={(e) => setSedeFiltro(e.target.value === 'ALL' ? 'ALL' : (Number(e.target.value) as SedeId))}
                    className="px-2.5 py-1.5 rounded-lg bg-[#eff4ff] border border-[#bdc9ca]/60 text-xs font-medium text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82]"
                  >
                    <option value="ALL">Todas las sedes</option>
                    <option value={1}>{SEDES[1].corto}</option>
                    <option value={2}>{SEDES[2].corto}</option>
                  </select>
                  <div className="inline-flex p-1 bg-[#eff4ff] rounded-lg border border-[#e6eeff]">
                    {(
                      [
                        ['todos', 'Todas'],
                        ['semana-actual', 'Esta Semana'],
                        ['semana-siguiente', 'Próxima Semana']
                      ] as [PeriodoFiltro, string][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPeriodoFiltro(value)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                          periodoFiltro === value ? 'bg-white text-[#006066] shadow-xs' : 'text-[#3e494a] hover:text-[#0d1c2e]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {gruposPorFecha.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 px-4 text-center bg-[#f8f9ff] rounded-xl border border-dashed border-[#bdc9ca]">
                  <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#6e797a] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">event_busy</span>
                  </div>
                  <h3 className="font-display font-semibold text-base text-[#0d1c2e]">
                    {blocks.length === 0 ? 'Aún no tienes bloques de disponibilidad' : 'Sin bloques para este filtro'}
                  </h3>
                  <p className="text-xs text-[#3e494a] max-w-md mt-1 leading-relaxed">
                    {blocks.length === 0
                      ? 'Crea tu primer bloque de horario en el panel izquierdo para que los pacientes puedan agendar consultas contigo.'
                      : 'Cambia el filtro de sede o periodo para ver otros bloques ya creados.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {gruposPorFecha.map((grupo) => (
                    <div key={grupo.fecha} className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between bg-[#eff4ff] px-4 py-2 rounded-lg border border-[#dce9ff]">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#006066] text-[16px]">today</span>
                          <span className="text-xs font-bold text-[#0d1c2e]">{grupo.formattedDate}</span>
                          {grupo.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#006066]/10 text-[#006066] font-bold">
                              {grupo.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#6e797a]">
                          {grupo.blocks.length} {grupo.blocks.length === 1 ? 'bloque' : 'bloques'} • {grupo.totalHoras} hrs
                        </span>
                      </div>

                      {grupo.blocks.map((b) => (
                        <article
                          key={b.id}
                          className="bg-white p-4 rounded-xl border border-[#e6eeff] hover:border-[#0d7a82]/50 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#006066] flex flex-col items-center justify-center shrink-0 border border-[#dce9ff]">
                              <span className="text-sm font-bold leading-none">{b.horaInicio.slice(0, 5)}</span>
                              <span className="text-[10px] text-[#6e797a] mt-0.5">{b.horaFin.slice(0, 5)}</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-bold text-[#0d1c2e]">{SEDES[b.sedeId].nombre}</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                                    b.activo ? 'bg-emerald-100 text-emerald-800' : 'bg-[#e6eeff] text-[#6e797a]'
                                  }`}
                                >
                                  {b.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              <span className="flex items-center gap-1 mt-1 text-[#3e494a] text-xs">
                                <span className="material-symbols-outlined text-[14px] text-[#6e797a]">schedule</span>
                                Duración: {(calcularDuracionMinutos(b.horaInicio.slice(0, 5), b.horaFin.slice(0, 5)) / 60).toFixed(1)}h
                                • {Math.floor(calcularDuracionMinutos(b.horaInicio.slice(0, 5), b.horaFin.slice(0, 5)) / 30)} cupos de 30 min
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-[#eff4ff] shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingBlock(b)}
                              title="Editar horario y sede"
                              className="h-9 px-3 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0d1c2e] text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingBlock(b)}
                              title="Eliminar bloque de disponibilidad"
                              className="h-9 px-3 rounded-lg bg-[#ffdad6]/40 hover:bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold flex items-center gap-1 transition-all"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="text-center text-[11px] text-[#6e797a] pt-2">
        Fundación Cardiovascular de Colombia • Módulo Ambulatorio de Profesionales • Protección de datos
        conforme a la Ley 1581 de 2012.
      </div>

      <EditAvailabilityBlockModal
        block={editingBlock}
        session={session}
        onClose={() => setEditingBlock(null)}
        onUpdated={handleUpdated}
      />
      <DeleteAvailabilityBlockModal
        block={deletingBlock}
        session={session}
        onClose={() => setDeletingBlock(null)}
        onDeleted={handleDeleted}
      />
    </div>
  );
};
