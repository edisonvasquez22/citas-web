import React, { useEffect, useState } from 'react';
import {
  ApiErrorBody,
  AppointmentResult,
  CitaTipo,
  HorarioDisponible,
  ProfessionalApi,
  SedeId,
  SEDES,
  SpecialtyApi,
  UserSession
} from '../types';
import { EmptyStateView } from './EmptyStateView';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export interface ConfirmedBooking {
  result: AppointmentResult;
  sedeNombre: string;
  especialidadNombre: string;
  profesionalNombre: string;
  tipo: CitaTipo;
}

interface BookingViewProps {
  session: UserSession;
  onConfirmed: (booking: ConfirmedBooking) => void;
}

function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function horaHHmm(isoDateTime: string): string {
  // "2026-09-26T08:00:00" -> "08:00"
  const t = isoDateTime.split('T')[1] ?? '';
  return t.slice(0, 5);
}

export const BookingView: React.FC<BookingViewProps> = ({ session, onConfirmed }) => {
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.accessToken}`
  };

  const [specialties, setSpecialties] = useState<SpecialtyApi[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalApi[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [sede, setSede] = useState<SedeId>(1);
  const [tipo, setTipo] = useState<CitaTipo>('GENERAL');
  const [specialtyId, setSpecialtyId] = useState<number | null>(null);
  const [doctorId, setDoctorId] = useState<number | 'ANY'>('ANY');
  const [date, setDate] = useState<string>(tomorrowDate());
  const [motivo, setMotivo] = useState('');

  const [horarios, setHorarios] = useState<HorarioDisponible[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [selectedHorario, setSelectedHorario] = useState<HorarioDisponible | null>(null);

  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  // Carga inicial de catálogos reales (HU-009 y directorio de profesionales).
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [respEsp, respProf] = await Promise.all([
          fetch(`${API_URL}/api/specialties`, { headers: authHeaders }),
          fetch(`${API_URL}/api/professionals`, { headers: authHeaders })
        ]);
        if (!respEsp.ok || !respProf.ok) {
          throw new Error('No se pudo cargar el catálogo de especialidades/profesionales.');
        }
        const esp: SpecialtyApi[] = await respEsp.json();
        const prof: ProfessionalApi[] = await respProf.json();
        if (cancelado) return;
        setSpecialties(esp);
        setProfessionals(prof);
        const primeraGeneral = esp.find((s) => s.activa && s.general);
        if (primeraGeneral) setSpecialtyId(primeraGeneral.id);
      } catch {
        if (!cancelado) setCatalogError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
      } finally {
        if (!cancelado) setLoadingCatalogos(false);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSpecialties = specialties.filter((s) => s.activa && s.general === (tipo === 'GENERAL'));
  const currentSpecialty = specialties.find((s) => s.id === specialtyId) || null;
  const doctorsForFilter = specialtyId
    ? professionals.filter((p) => p.especialidadIds.includes(specialtyId) && p.sedeIds.includes(sede))
    : [];

  const handleTipoChange = (nuevoTipo: CitaTipo) => {
    setTipo(nuevoTipo);
    setSelectedHorario(null);
    setConfirmError(null);
    const validas = specialties.filter((s) => s.activa && s.general === (nuevoTipo === 'GENERAL'));
    setSpecialtyId(validas[0]?.id ?? null);
    setDoctorId('ANY');
  };

  const handleSedeChange = (nuevaSede: SedeId) => {
    setSede(nuevaSede);
    setSelectedHorario(null);
    setConfirmError(null);
    setDoctorId('ANY');
  };

  const handleSpecialtyChange = (id: number) => {
    setSpecialtyId(id);
    setSelectedHorario(null);
    setConfirmError(null);
    setDoctorId('ANY');
  };

  // HU-013: consulta real de disponibilidad cada vez que cambian los filtros.
  useEffect(() => {
    if (!specialtyId || !date) return;
    let cancelado = false;
    setLoadingHorarios(true);
    setAvailabilityError(null);
    setSelectedHorario(null);

    const params = new URLSearchParams({ especialidadId: String(specialtyId), fecha: date, sedeId: String(sede) });
    if (doctorId !== 'ANY') params.set('profesionalId', String(doctorId));

    fetch(`${API_URL}/api/availability?${params.toString()}`, { headers: authHeaders })
      .then(async (resp) => {
        if (!resp.ok) throw new Error('No se pudo consultar la disponibilidad.');
        return (await resp.json()) as HorarioDisponible[];
      })
      .then((data) => {
        if (!cancelado) setHorarios(data);
      })
      .catch(() => {
        if (!cancelado) setAvailabilityError('No se pudo consultar la disponibilidad. Inténtalo de nuevo.');
      })
      .finally(() => {
        if (!cancelado) setLoadingHorarios(false);
      });

    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialtyId, sede, date, doctorId]);

  const handleConfirm = async () => {
    if (!selectedHorario || !currentSpecialty) return;
    setConfirming(true);
    setConfirmError(null);

    const endpoint = tipo === 'GENERAL' ? '/api/appointments/general' : '/api/appointments/specialized';
    const body = {
      profesionalId: selectedHorario.profesionalId,
      sedeId: sede,
      especialidadId: currentSpecialty.id,
      motivo: motivo.trim() || null,
      fecha: date,
      horaInicio: `${horaHHmm(selectedHorario.inicio)}:00`
    };

    try {
      const resp = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(body)
      });

      if (resp.status === 409) {
        const err: ApiErrorBody = await resp.json();
        setConfirmError(err.message || 'El horario seleccionado ya no está disponible. Elige otro turno.');
        setSelectedHorario(null);
        // Refresca disponibilidad para que el turno ocupado desaparezca de la lista.
        setDate((d) => d);
        return;
      }
      if (resp.status === 400 || resp.status === 404) {
        const err: ApiErrorBody = await resp.json();
        setConfirmError(err.message || 'No se pudo confirmar la cita.');
        return;
      }
      if (!resp.ok) {
        setConfirmError('Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.');
        return;
      }

      const result: AppointmentResult = await resp.json();
      const doctor = professionals.find((p) => p.profesionalId === selectedHorario.profesionalId);
      onConfirmed({
        result,
        sedeNombre: SEDES[sede].nombre,
        especialidadNombre: currentSpecialty.nombre,
        profesionalNombre: doctor?.nombreCompleto ?? 'Profesional asignado',
        tipo
      });
    } catch {
      setConfirmError('No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  if (loadingCatalogos) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-10 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
        <p className="text-sm text-[#3e494a] mt-3">Cargando especialidades y profesionales disponibles...</p>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
        <span className="material-symbols-outlined text-[28px]">wifi_off</span>
        <div>
          <h3 className="font-bold">Error de Conexión</h3>
          <p className="text-sm mt-1">{catalogError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-[#0d7a82] font-semibold flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
            MÓDULO AMBULATORIO
          </span>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">
            Agendar Nueva Cita Médica
          </h1>
          <p className="text-sm text-[#3e494a] mt-1">
            Red Integrada Santander:{' '}
            <strong className="text-[#0d1c2e]">Hospital Internacional de Colombia (HIC)</strong> en Piedecuesta &{' '}
            <strong className="text-[#0d1c2e]">Instituto Cardiovascular (ICV)</strong> en Floridablanca.
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#eff4ff] border border-[#dce9ff] text-[#3e494a] text-xs">
          <span className="material-symbols-outlined text-[#0d7a82] text-[20px] shrink-0">info</span>
          <span>Citas generales con aprobación inmediata; especialistas sujetas a verificación médica.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: filtros + horarios */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#35527a]"></div>
            <div className="p-5 sm:p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#0d7a82] text-[20px]">tune</span>
                  <span className="font-semibold text-base text-[#0d1c2e]">Criterios de Atención</span>
                </div>
                <span className="text-xs text-[#6e797a]">Paso 1 de 2: Definir consulta</span>
              </div>

              {/* Sede */}
              <div>
                <label className="block text-sm font-semibold text-[#0d1c2e] mb-2.5">Sede Hospitalaria</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([1, 2] as SedeId[]).map((sedeId) => (
                    <button
                      key={sedeId}
                      type="button"
                      onClick={() => handleSedeChange(sedeId)}
                      className={`text-left p-3.5 rounded-xl transition-all flex items-start gap-3 border ${
                        sede === sedeId
                          ? 'bg-[#eff4ff] border-[#0d7a82] ring-2 ring-[#0d7a82]/20 shadow-xs'
                          : 'bg-white border-[#e6eeff] hover:bg-[#f8f9ff]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          sede === sedeId ? 'bg-[#0d7a82] text-white' : 'bg-[#e6eeff] text-[#3e494a]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {sedeId === 1 ? 'local_hospital' : 'cardiology'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-[#0d1c2e] block">{SEDES[sedeId].corto}</span>
                        <span className="text-xs text-[#6e797a] block truncate mt-0.5">{SEDES[sedeId].direccion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo & especialidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tipo-cita-select" className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                    Tipo de Cita
                  </label>
                  <select
                    id="tipo-cita-select"
                    value={tipo}
                    onChange={(e) => handleTipoChange(e.target.value as CitaTipo)}
                    className="w-full bg-[#eff4ff] border border-[#bdc9ca]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="GENERAL">Medicina General (30 min • Directa)</option>
                    <option value="ESPECIALIZADA">Consulta Especializada (60 min • Validación)</option>
                  </select>
                  <p className="text-xs text-[#006066] mt-1.5 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[15px]">{tipo === 'GENERAL' ? 'bolt' : 'history_edu'}</span>
                    {tipo === 'GENERAL'
                      ? 'Confirmación instantánea en 1 franja de 30m.'
                      : 'Turno de 60 min. Sujeto a validación médica.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="specialty-select" className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                    Especialidad
                  </label>
                  <select
                    id="specialty-select"
                    value={specialtyId ?? ''}
                    onChange={(e) => handleSpecialtyChange(Number(e.target.value))}
                    className="w-full bg-[#eff4ff] border border-[#bdc9ca]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all cursor-pointer"
                  >
                    {filteredSpecialties.length === 0 && <option value="">Sin especialidades disponibles</option>}
                    {filteredSpecialties.map((spec) => (
                      <option key={spec.id} value={spec.id}>
                        {spec.nombre} ({spec.duracionMinutos} min)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Profesional & fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="doctor-select" className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                    Profesional
                  </label>
                  <select
                    id="doctor-select"
                    value={doctorId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDoctorId(v === 'ANY' ? 'ANY' : Number(v));
                      setSelectedHorario(null);
                    }}
                    className="w-full bg-[#eff4ff] border border-[#bdc9ca]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="ANY">Cualquier profesional disponible</option>
                    {doctorsForFilter.map((doc) => (
                      <option key={doc.profesionalId} value={doc.profesionalId}>
                        {doc.nombreCompleto}
                      </option>
                    ))}
                  </select>
                  {doctorsForFilter.length === 0 && (
                    <p className="text-[11px] text-[#6e797a] mt-1.5">
                      No hay profesionales registrados para esa especialidad en esta sede.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="date-input" className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                    Fecha Preferida
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-[#6e797a] text-[18px] pointer-events-none">
                      calendar_today
                    </span>
                    <input
                      id="date-input"
                      type="date"
                      value={date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-[#eff4ff] border border-[#bdc9ca]/60 rounded-lg text-sm text-[#0d1c2e] font-medium focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Motivo opcional */}
              <div>
                <label htmlFor="motivo-input" className="block text-sm font-semibold text-[#0d1c2e] mb-1.5">
                  Motivo de la consulta (opcional)
                </label>
                <textarea
                  id="motivo-input"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  rows={2}
                  placeholder="Ej: control de rutina, dolor torácico, seguimiento..."
                  className="w-full bg-[#eff4ff] border border-[#bdc9ca]/60 px-3.5 py-2.5 rounded-lg text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] focus:bg-white transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Horarios */}
          <div className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#eff4ff]">
              <div>
                <h2 className="font-headline text-lg sm:text-xl font-bold text-[#0d1c2e]">Horarios Disponibles</h2>
                <p className="text-xs text-[#6e797a] mt-0.5">{date} en {SEDES[sede].corto}</p>
              </div>
            </div>

            {tipo === 'ESPECIALIZADA' && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#00798e]/10 border border-[#00798e]/25 text-[#005f6f] flex items-start gap-3">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5 text-[#00798e]">find_replace</span>
                <div className="text-xs leading-relaxed">
                  <strong className="font-semibold">Consulta especializada:</strong> la solicitud queda pendiente de
                  aprobación médica; el horario elegido queda retenido mientras se decide.
                </div>
              </div>
            )}

            {loadingHorarios && (
              <div className="py-10 flex flex-col items-center text-center text-[#6e797a]">
                <span className="material-symbols-outlined text-[30px] text-[#0d7a82] animate-spin">progress_activity</span>
                <p className="text-xs mt-2">Consultando disponibilidad real...</p>
              </div>
            )}

            {!loadingHorarios && availabilityError && (
              <div className="mt-4 p-3.5 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                {availabilityError}
              </div>
            )}

            {!loadingHorarios && !availabilityError && horarios.length === 0 && (
              <EmptyStateView
                onSuggestNextDate={() => {
                  const d = new Date(date);
                  d.setDate(d.getDate() + 1);
                  setDate(d.toISOString().split('T')[0]);
                }}
                onReset={() => {
                  setDoctorId('ANY');
                }}
              />
            )}

            {!loadingHorarios && !availabilityError && horarios.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {horarios.map((h) => {
                  const isSelected =
                    selectedHorario?.profesionalId === h.profesionalId && selectedHorario?.inicio === h.inicio;
                  const doctor = professionals.find((p) => p.profesionalId === h.profesionalId);
                  return (
                    <button
                      key={`${h.profesionalId}-${h.inicio}`}
                      type="button"
                      onClick={() => setSelectedHorario(h)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#0d7a82] text-white shadow-sm ring-2 ring-[#0d7a82] scale-[1.02]'
                          : 'bg-white hover:bg-[#eff4ff] text-[#0d1c2e] border-[#e6eeff] hover:border-[#0d7a82]/50 shadow-xs'
                      }`}
                    >
                      <span className="text-sm sm:text-base font-semibold flex items-center gap-1">
                        <span className={`material-symbols-outlined text-[15px] ${isSelected ? '' : 'text-[#6e797a]'}`}>
                          {isSelected ? 'check_circle' : 'schedule'}
                        </span>
                        {horaHHmm(h.inicio)}
                      </span>
                      {doctorId === 'ANY' && (
                        <span className={`text-[11px] mt-0.5 truncate max-w-full ${isSelected ? 'text-white/90' : 'text-[#6e797a]'}`}>
                          {doctor?.nombreCompleto ?? `Profesional #${h.profesionalId}`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: resumen */}
        <div className="lg:col-span-4 flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-xl shadow-md border border-[#e6eeff] overflow-hidden">
            <div className="h-2 w-full bg-gradient-to-r from-[#0d7a82] via-[#00798e] to-[#35527a]"></div>
            <div className="p-5 sm:p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#eff4ff]">
                <span className="font-headline font-bold text-base text-[#0d1c2e]">Resumen de Cita</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedHorario ? 'bg-[#0d7a82]/15 text-[#006066]' : 'bg-[#eff4ff] text-[#6e797a]'
                  }`}
                >
                  {selectedHorario ? 'Turno Listo' : 'Sin Seleccionar'}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#dce9ff] text-[#0d7a82] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">pin_drop</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[#6e797a] uppercase block tracking-wider font-semibold">Sede</span>
                  <span className="text-sm font-semibold text-[#0d1c2e] block truncate">{SEDES[sede].nombre}</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#dce9ff] text-[#0d7a82] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">medical_services</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[#6e797a] uppercase block tracking-wider font-semibold">Especialidad</span>
                  <span className="text-sm font-semibold text-[#0d1c2e] block truncate">
                    {currentSpecialty?.nombre ?? '—'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0d7a82] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">event</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] text-[#6e797a] uppercase block tracking-wider font-semibold">
                    Fecha & Franja
                  </span>
                  <span className="text-sm sm:text-base font-bold text-[#006066] block">
                    {selectedHorario ? (
                      <>{date} • {horaHHmm(selectedHorario.inicio)} - {horaHHmm(selectedHorario.fin)}</>
                    ) : (
                      'Seleccione un turno'
                    )}
                  </span>
                </div>
              </div>

              {confirmError && (
                <div className="p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
                  <span>{confirmError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!selectedHorario || confirming}
                  className="w-full py-3 px-4 rounded-lg bg-[#0d7a82] hover:bg-[#006066] text-white font-semibold text-sm sm:text-base transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                  <span>{confirming ? 'Confirmando...' : 'Confirmar Cita Médica'}</span>
                </button>
              </div>

              <div className="text-center text-[11px] text-[#6e797a]">
                Protección de datos conforme a Ley 1581 de 2012
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
