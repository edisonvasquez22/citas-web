import React, { useEffect, useState } from 'react';
import { ActiveScreen, AvailabilityBlockApi, CitaAgendaApi, SEDES } from '../types';
import { apiFetch } from '../api/session';
import { formatDateTimeRange } from '../utils/dateFormatter';
import { AdminNavTabs } from './AdminNavTabs';
import { ProfessionalNavTabs } from './ProfessionalNavTabs';
import { t } from '../i18n';

interface Metrica {
  label: string;
  valor: number | string;
  icon: string;
  destino?: ActiveScreen;
}

function hoyLocal(): string {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function useCarga<T>(cargar: () => Promise<T>): { datos: T | null; error: boolean } {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelado = false;
    cargar()
      .then((d) => !cancelado && setDatos(d))
      .catch(() => !cancelado && setError(true));
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { datos, error };
}

async function json<T>(path: string): Promise<T> {
  const resp = await apiFetch(path);
  if (!resp.ok) throw new Error(path);
  return resp.json();
}

const Panel: React.FC<{
  titulo: string;
  subtitulo: string;
  metricas: Metrica[] | null;
  error: boolean;
  onNavigate: (s: ActiveScreen) => void;
  children?: React.ReactNode;
}> = ({ titulo, subtitulo, metricas, error, onNavigate, children }) => (
  <>
    <div className="pb-5 border-b border-[#eff4ff]">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">{titulo}</h1>
      <p className="text-sm text-[#3e494a] mt-1">{subtitulo}</p>
    </div>
    {error ? (
      <p role="alert" className="rounded-xl p-4 bg-[#ffdad6] text-[#93000a] text-sm">
        {t("No se pudo cargar el resumen. Inténtalo de nuevo más tarde.")}
      </p>
    ) : !metricas ? (
      <div className="py-10 flex justify-center">
        <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
      </div>
    ) : (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {metricas.map((m) => (
            <button
              key={m.label}
              type="button"
              disabled={!m.destino}
              onClick={() => m.destino && onNavigate(m.destino)}
              className="text-left bg-white p-4 rounded-xl shadow-xs border border-[#e6eeff] flex items-center gap-3 enabled:hover:border-[#0d7a82] enabled:cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#006066]">
                <span className="material-symbols-outlined text-[22px]">{m.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#0d1c2e] leading-none">{m.valor}</p>
                <p className="text-[12px] text-[#6e797a] mt-1">{m.label}</p>
              </div>
            </button>
          ))}
        </div>
        {children}
      </>
    )}
  </>
);

/** Dashboard PROFESSIONAL (PRD sección 6). */
export const InicioProfesionalScreen: React.FC<{ onNavigate: (s: ActiveScreen) => void }> = ({ onNavigate }) => {
  const { datos, error } = useCarga(async () => {
    const [agenda, bloques] = await Promise.all([
      json<CitaAgendaApi[]>(`/api/professionals/me/agenda?desde=${hoyLocal()}`),
      json<AvailabilityBlockApi[]>('/api/professionals/me/availability-blocks')
    ]);
    return { agenda, bloques };
  });

  const hoy = hoyLocal();
  const metricas: Metrica[] | null = datos && [
    { label: t("Citas hoy"), valor: datos.agenda.filter((c) => c.inicio.startsWith(hoy)).length, icon: 'today', destino: 'mi-agenda' },
    { label: t("Citas próximas"), valor: datos.agenda.length, icon: 'event_available', destino: 'mi-agenda' },
    {
      label: t("Bloques futuros"),
      valor: datos.bloques.filter((b) => b.activo && b.fecha >= hoy).length,
      icon: 'calendar_month',
      destino: 'mi-disponibilidad'
    },
    {
      label: t("Sedes con bloques"),
      valor: new Set(datos.bloques.filter((b) => b.fecha >= hoy).map((b) => b.sedeId)).size,
      icon: 'domain'
    }
  ];
  const proxima = datos?.agenda.slice().sort((a, b) => a.inicio.localeCompare(b.inicio))[0];

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <ProfessionalNavTabs active="inicio-profesional" onNavigate={onNavigate} />
      <Panel
        titulo={t("Inicio del Profesional")}
        subtitulo={t("Resumen de tu agenda confirmada y de tu disponibilidad publicada.")}
        metricas={metricas}
        error={error}
        onNavigate={onNavigate}
      >
        <section className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#6e797a] mb-2">{t("Próxima atención")}</h2>
          {proxima ? (
            <p className="text-sm text-[#0d1c2e]">
              {t("Paciente #")}{proxima.pacienteUsuarioId}· {formatDateTimeRange(proxima.inicio, proxima.fin)}·{' '}
              {SEDES[proxima.sedeId]?.nombre}
            </p>
          ) : (
            <p className="text-sm text-[#6e797a]">{t("No tienes citas confirmadas próximas.")}</p>
          )}
        </section>
      </Panel>
    </div>
  );
};

/** Dashboard ADMIN (PRD sección 6). */
export const InicioAdminScreen: React.FC<{ onNavigate: (s: ActiveScreen) => void }> = ({ onNavigate }) => {
  const { datos, error } = useCarga(async () => {
    const [solicitudes, reprogramaciones, profesionales, eps] = await Promise.all([
      json<unknown[]>('/api/admin/appointments/requested'),
      json<unknown[]>('/api/admin/reschedules'),
      json<{ activo: boolean }[]>('/api/admin/professionals'),
      json<{ activa: boolean }[]>('/api/admin/eps')
    ]);
    return { solicitudes, reprogramaciones, profesionales, eps };
  });

  const metricas: Metrica[] | null = datos && [
    { label: t("Citas por aprobar"), valor: datos.solicitudes.length, icon: 'fact_check', destino: 'aprobacion-citas' },
    {
      label: t("Reprogramaciones pendientes"),
      valor: datos.reprogramaciones.length,
      icon: 'event_repeat',
      destino: 'admin-reprogramaciones'
    },
    {
      label: t("Profesionales activos"),
      valor: datos.profesionales.filter((p) => p.activo).length,
      icon: 'stethoscope',
      destino: 'admin-catalogo'
    },
    { label: t("EPS activas"), valor: datos.eps.filter((e) => e.activa).length, icon: 'health_and_safety', destino: 'admin-eps' }
  ];

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <AdminNavTabs active="inicio-admin" onNavigate={onNavigate} />
      <Panel
        titulo={t("Inicio del Administrador")}
        subtitulo={t("Pendientes de gestión y estado de los catálogos. Haz clic en una tarjeta para ir a la bandeja.")}
        metricas={metricas}
        error={error}
        onNavigate={onNavigate}
      />
    </div>
  );
};
