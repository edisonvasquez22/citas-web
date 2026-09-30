import React, { useEffect, useState } from 'react';
import { ActiveScreen, MiCitaApi, PerfilApi, SEDES, SpecialtyApi } from '../types';
import { apiFetch } from '../api/session';
import { formatDateTimeRange } from '../utils/dateFormatter';

interface InicioPacienteScreenProps {
  language: 'ES' | 'EN';
  onNavigate: (screen: ActiveScreen) => void;
}

const T = {
  ES: {
    hola: 'Hola',
    subtitulo: 'Este es el resumen de tus citas en FCV.',
    proxima: 'Próxima cita',
    sinProxima: 'No tienes citas próximas.',
    confirmadas: 'Confirmadas',
    enRevision: 'En revisión',
    historicas: 'Finalizadas',
    sinAfiliacion: 'Aún no registras tu afiliación EPS. Regístrala en Mi Perfil para agilizar tus citas.',
    irPerfil: 'Ir a Mi Perfil',
    agendar: 'Agendar una cita',
    verCitas: 'Ver mis citas',
    enRevisionBadge: 'En revisión',
    confirmadaBadge: 'Confirmada',
    error: 'No se pudo cargar tu resumen.'
  },
  EN: {
    hola: 'Hello',
    subtitulo: 'Here is a summary of your FCV appointments.',
    proxima: 'Next appointment',
    sinProxima: 'You have no upcoming appointments.',
    confirmadas: 'Confirmed',
    enRevision: 'Under review',
    historicas: 'Finished',
    sinAfiliacion: 'You have not registered your health insurance yet. Add it in My Profile.',
    irPerfil: 'Go to My Profile',
    agendar: 'Book an appointment',
    verCitas: 'View my appointments',
    enRevisionBadge: 'Under review',
    confirmadaBadge: 'Confirmed',
    error: 'Your summary could not be loaded.'
  }
};

/** Dashboard USER (PRD sección 6). */
export const InicioPacienteScreen: React.FC<InicioPacienteScreenProps> = ({ language, onNavigate }) => {
  const t = T[language];
  const [perfil, setPerfil] = useState<PerfilApi | null>(null);
  const [citas, setCitas] = useState<MiCitaApi[]>([]);
  const [especialidades, setEspecialidades] = useState<SpecialtyApi[]>([]);
  const [tieneAfiliacion, setTieneAfiliacion] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [rPerfil, rCitas, rEsp, rAfil] = await Promise.all([
          apiFetch('/api/users/me'),
          apiFetch('/api/appointments/mine'),
          apiFetch('/api/specialties'),
          apiFetch('/api/users/me/afiliacion')
        ]);
        if (!rPerfil.ok || !rCitas.ok || !rEsp.ok) throw new Error();
        const [p, c, e] = await Promise.all([rPerfil.json(), rCitas.json(), rEsp.json()]);
        if (cancelado) return;
        setPerfil(p);
        setCitas(c);
        setEspecialidades(e);
        setTieneAfiliacion(rAfil.ok);
      } catch {
        if (!cancelado) setError(true);
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  // Las citas llegan en hora local (America/Bogota) sin zona; se compara contra la hora local, no UTC.
  const ahora = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const proxima = citas
    .filter((c) => (c.estado === 'APPROVED' || c.estado === 'REQUESTED') && c.inicio.slice(0, 16) >= ahora)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))[0];
  const cuenta = (estados: string[]) => citas.filter((c) => estados.includes(c.estado)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="pb-5 border-b border-[#eff4ff]">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">
          {t.hola}
          {perfil ? `, ${perfil.nombres}` : ''}
        </h1>
        <p className="text-sm text-[#3e494a] mt-1">{t.subtitulo}</p>
      </div>

      {cargando ? (
        <div className="py-10 flex justify-center">
          <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
        </div>
      ) : error ? (
        <p role="alert" className="rounded-xl p-4 bg-[#ffdad6] text-[#93000a] text-sm">
          {t.error}
        </p>
      ) : (
        <>
          {!tieneAfiliacion && (
            <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 text-amber-950 text-sm flex flex-wrap items-center gap-3">
              <span className="material-symbols-outlined text-amber-700">info</span>
              <span className="flex-1">{t.sinAfiliacion}</span>
              <button type="button" onClick={() => onNavigate('mi-perfil')} className="font-semibold underline">
                {t.irPerfil}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6e797a] mb-3">{t.proxima}</h2>
              {proxima ? (
                <div className="flex flex-col gap-1">
                  <p className="font-display text-xl font-semibold text-[#0d1c2e]">
                    {especialidades.find((e) => e.id === proxima.especialidadId)?.nombre ?? `#${proxima.especialidadId}`}
                  </p>
                  <p className="text-sm text-[#3e494a]">{formatDateTimeRange(proxima.inicio, proxima.fin)}</p>
                  <p className="text-sm text-[#3e494a]">{SEDES[proxima.sedeId]?.nombre}</p>
                  <span
                    className={`self-start mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      proxima.estado === 'APPROVED' ? 'bg-blue-100 text-blue-900' : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {proxima.estado === 'APPROVED' ? t.confirmadaBadge : t.enRevisionBadge}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-[#6e797a]">{t.sinProxima}</p>
              )}
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5 grid grid-cols-3 lg:grid-cols-1 gap-3">
              {[
                { label: t.confirmadas, valor: cuenta(['APPROVED']), icon: 'event_available' },
                { label: t.enRevision, valor: cuenta(['REQUESTED']), icon: 'pending_actions' },
                { label: t.historicas, valor: cuenta(['COMPLETED', 'NO_SHOW', 'CANCELLED', 'REJECTED']), icon: 'history' }
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#006066]">{m.icon}</span>
                  <div>
                    <p className="text-xl font-bold text-[#0d1c2e] leading-none">{m.valor}</p>
                    <p className="text-[11px] text-[#6e797a]">{m.label}</p>
                  </div>
                </div>
              ))}
            </section>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => onNavigate('agendar-cita')}
              className="flex-1 py-2.5 px-4 bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              {t.agendar}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('mis-citas')}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-[#eff4ff] text-[#006066] border border-[#dce9ff] text-sm font-semibold rounded-lg flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">event_note</span>
              {t.verCitas}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
