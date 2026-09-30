import React, { useCallback, useEffect, useState } from 'react';
import { ActiveScreen, EpsApi, PlanEpsApi, REGIMENES } from '../types';
import { apiFetch } from '../api/session';
import { mensajeDeError } from '../api/errors';
import { AdminNavTabs } from './AdminNavTabs';
import { t } from '../i18n';

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[#eff4ff] border border-[#bdc9ca]/60 text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82]';

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

interface AdminEpsScreenProps {
  onNavigate: (screen: ActiveScreen) => void;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** HU-007 (EPS) y HU-008 (planes por EPS): CRUD del catálogo de aseguramiento para ADMIN. */
export const AdminEpsScreen: React.FC<AdminEpsScreenProps> = ({ onNavigate }) => {
  const [eps, setEps] = useState<EpsApi[]>([]);
  const [seleccionada, setSeleccionada] = useState<EpsApi | null>(null);
  const [planes, setPlanes] = useState<PlanEpsApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso>(null);

  const [nuevaEps, setNuevaEps] = useState({ codigo: '', nombre: '' });
  const [nuevoPlan, setNuevoPlan] = useState({ regimenId: 1, codigo: '', nombre: '' });
  const [editando, setEditando] = useState<{ tipo: 'eps' | 'plan'; id: number; nombre: string } | null>(null);

  const cargarEps = useCallback(async () => {
    try {
      const resp = await apiFetch('/api/admin/eps');
      if (!resp.ok) throw new Error();
      const lista: EpsApi[] = await resp.json();
      setEps(lista);
      setSeleccionada((actual) => (actual ? lista.find((x) => x.id === actual.id) ?? null : lista[0] ?? null));
      setErrorCarga(null);
    } catch {
      setErrorCarga(t("No se pudo cargar el catálogo de EPS."));
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarPlanes = useCallback(async (epsId: number) => {
    const resp = await apiFetch(`/api/admin/eps/${epsId}/plans`);
    setPlanes(resp.ok ? await resp.json() : []);
  }, []);

  useEffect(() => {
    cargarEps();
  }, [cargarEps]);

  useEffect(() => {
    if (seleccionada) cargarPlanes(seleccionada.id);
    else setPlanes([]);
  }, [seleccionada, cargarPlanes]);

  const ejecutar = async (peticion: () => Promise<Response>, exito: string, recargar: () => Promise<void>) => {
    setAviso(null);
    try {
      const resp = await peticion();
      if (!resp.ok) {
        setAviso({ tipo: 'error', texto: await mensajeDeError(resp, t("La operación no se pudo completar.")) });
        return false;
      }
      setAviso({ tipo: 'ok', texto: exito });
      await recargar();
      return true;
    } catch {
      setAviso({ tipo: 'error', texto: t("No se pudo contactar al servidor.") });
      return false;
    }
  };

  const crearEps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaEps.codigo.trim() || !nuevaEps.nombre.trim()) {
      setAviso({ tipo: 'error', texto: t("Código y nombre de la EPS son obligatorios.") });
      return;
    }
    const ok = await ejecutar(
      () =>
        apiFetch('/api/admin/eps', {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({ codigo: nuevaEps.codigo.trim(), nombre: nuevaEps.nombre.trim() })
        }),
      t("EPS creada."),
      cargarEps
    );
    if (ok) setNuevaEps({ codigo: '', nombre: '' });
  };

  const crearPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seleccionada) return;
    if (!nuevoPlan.codigo.trim() || !nuevoPlan.nombre.trim()) {
      setAviso({ tipo: 'error', texto: t("Código y nombre del plan son obligatorios.") });
      return;
    }
    const ok = await ejecutar(
      () =>
        apiFetch(`/api/admin/eps/${seleccionada.id}/plans`, {
          method: 'POST',
          headers: JSON_HEADERS,
          body: JSON.stringify({
            regimenId: nuevoPlan.regimenId,
            codigo: nuevoPlan.codigo.trim(),
            nombre: nuevoPlan.nombre.trim()
          })
        }),
      t("Plan creado."),
      () => cargarPlanes(seleccionada.id)
    );
    if (ok) setNuevoPlan({ regimenId: 1, codigo: '', nombre: '' });
  };

  const guardarNombre = async () => {
    if (!editando || !editando.nombre.trim()) return;
    const url =
      editando.tipo === 'eps'
        ? `/api/admin/eps/${editando.id}`
        : `/api/admin/eps/${seleccionada?.id}/plans/${editando.id}`;
    const ok = await ejecutar(
      () => apiFetch(url, { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify({ nombre: editando.nombre.trim() }) }),
      t("Nombre actualizado."),
      editando.tipo === 'eps' ? cargarEps : () => cargarPlanes(seleccionada!.id)
    );
    if (ok) setEditando(null);
  };

  const cambiarEstadoEps = (x: EpsApi) =>
    ejecutar(
      () =>
        apiFetch(`/api/admin/eps/${x.id}/status`, {
          method: 'PATCH',
          headers: JSON_HEADERS,
          body: JSON.stringify({ activa: !x.activa })
        }),
      x.activa ? t("EPS desactivada.") : t("EPS activada."),
      cargarEps
    );

  const cambiarEstadoPlan = (p: PlanEpsApi) =>
    ejecutar(
      () =>
        apiFetch(`/api/admin/eps/${p.epsId}/plans/${p.id}/status`, {
          method: 'PATCH',
          headers: JSON_HEADERS,
          body: JSON.stringify({ activo: !p.activo })
        }),
      p.activo ? t("Plan desactivado.") : t("Plan activado."),
      () => cargarPlanes(p.epsId)
    );

  const estadoBadge = (activo: boolean) => (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        activo ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {activo ? t("Activo") : t("Inactivo")}
    </span>
  );

  const nombreEditable = (tipo: 'eps' | 'plan', id: number, nombre: string) =>
    editando && editando.tipo === tipo && editando.id === id ? (
      <span className="flex items-center gap-1.5 flex-1">
        <input
          value={editando.nombre}
          onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
          className={`${inputClass} py-1`}
          aria-label={t("Nuevo nombre")}
          autoFocus
        />
        <button type="button" onClick={guardarNombre} className="text-[#006066] p-1" aria-label={t("Guardar nombre")}>
          <span className="material-symbols-outlined text-[18px]">check</span>
        </button>
        <button type="button" onClick={() => setEditando(null)} className="text-[#6e797a] p-1" aria-label={t("Cancelar edición")}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </span>
    ) : (
      <span className="flex items-center gap-1 flex-1 min-w-0">
        <span className="truncate">{nombre}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditando({ tipo, id, nombre });
          }}
          className="text-[#6e797a] hover:text-[#006066] p-0.5"
          aria-label={t("Renombrar {nombre}", {
            nombre: nombre
          })}
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
        </button>
      </span>
    );

  return (
    <div className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <AdminNavTabs active="admin-eps" onNavigate={onNavigate} />

      <div className="pb-5 border-b border-[#eff4ff]">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase mb-2">
          <span className="material-symbols-outlined text-[14px]">health_and_safety</span>
          {t("Catálogo de Aseguramiento")}
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">{t("EPS y Planes")}</h1>
        <p className="text-sm text-[#3e494a] mt-1 max-w-2xl">
          {t(
            "Las EPS y planes inactivos dejan de ofrecerse a los pacientes, pero no se borran."
          )}
        </p>
      </div>

      {aviso && (
        <p
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className={`text-sm rounded-lg p-3 flex gap-1.5 ${
            aviso.tipo === 'ok' ? 'bg-[#00798e]/10 text-[#005f6f]' : 'bg-[#ffdad6] text-[#93000a]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">{aviso.tipo === 'ok' ? 'check_circle' : 'error'}</span>
          {aviso.texto}
        </p>
      )}

      {cargando ? (
        <div className="py-10 flex justify-center">
          <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
        </div>
      ) : errorCarga ? (
        <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
          <span className="material-symbols-outlined text-[28px]">wifi_off</span>
          <p className="text-sm">{errorCarga}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5 space-y-4">
            <h2 className="font-display font-semibold text-lg text-[#0d1c2e]">{t("EPS")}</h2>
            <ul className="divide-y divide-[#eff4ff]">
              {eps.map((x) => (
                <li
                  key={x.id}
                  className={`py-2.5 px-2 rounded-lg flex items-center gap-3 text-sm cursor-pointer ${
                    seleccionada?.id === x.id ? 'bg-[#eff4ff]' : 'hover:bg-[#f8f9ff]'
                  }`}
                  onClick={() => setSeleccionada(x)}
                >
                  <span className="font-mono text-[11px] text-[#6e797a] w-28 truncate">{x.codigo}</span>
                  {nombreEditable('eps', x.id, x.nombre)}
                  {estadoBadge(x.activa)}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cambiarEstadoEps(x);
                    }}
                    className="text-[12px] font-semibold text-[#006066] hover:underline"
                  >
                    {x.activa ? t("Desactivar") : t("Activar")}
                  </button>
                </li>
              ))}
              {eps.length === 0 && <li className="py-3 text-sm text-[#6e797a]">{t("No hay EPS registradas.")}</li>}
            </ul>
            <form onSubmit={crearEps} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 pt-3 border-t border-[#eff4ff]">
              <input
                placeholder={t("Código")}
                aria-label={t("Código de la EPS")}
                value={nuevaEps.codigo}
                onChange={(e) => setNuevaEps({ ...nuevaEps, codigo: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder={t("Nombre")}
                aria-label={t("Nombre de la EPS")}
                value={nuevaEps.nombre}
                onChange={(e) => setNuevaEps({ ...nuevaEps, nombre: e.target.value })}
                className={inputClass}
              />
              <button type="submit" className="px-3 py-2 bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold rounded-lg">
                {t("Crear EPS")}
              </button>
            </form>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5 space-y-4">
            <h2 className="font-display font-semibold text-lg text-[#0d1c2e]">
              {t("Planes")} {seleccionada ? t("de {nombre}", {
              nombre: seleccionada.nombre
            }) : ''}
            </h2>
            {!seleccionada ? (
              <p className="text-sm text-[#6e797a]">{t("Selecciona una EPS para ver sus planes.")}</p>
            ) : (
              <>
                <ul className="divide-y divide-[#eff4ff]">
                  {planes.map((p) => (
                    <li key={p.id} className="py-2.5 flex items-center gap-3 text-sm">
                      <span className="font-mono text-[11px] text-[#6e797a] w-24 truncate">{p.codigo}</span>
                      {nombreEditable('plan', p.id, p.nombre)}
                      <span className="text-[11px] text-[#3e494a]">{REGIMENES[p.regimenId] ?? p.regimenId}</span>
                      {estadoBadge(p.activo)}
                      <button
                        type="button"
                        onClick={() => cambiarEstadoPlan(p)}
                        className="text-[12px] font-semibold text-[#006066] hover:underline"
                      >
                        {p.activo ? t("Desactivar") : t("Activar")}
                      </button>
                    </li>
                  ))}
                  {planes.length === 0 && <li className="py-3 text-sm text-[#6e797a]">{t("Esta EPS no tiene planes.")}</li>}
                </ul>
                <form onSubmit={crearPlan} className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-[#eff4ff]">
                  <select
                    aria-label={t("Régimen del plan")}
                    value={nuevoPlan.regimenId}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, regimenId: Number(e.target.value) })}
                    className={inputClass}
                  >
                    {Object.entries(REGIMENES).map(([id, nombre]) => (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    ))}
                  </select>
                  <input
                    placeholder={t("Código")}
                    aria-label={t("Código del plan")}
                    value={nuevoPlan.codigo}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, codigo: e.target.value })}
                    className={inputClass}
                  />
                  <input
                    placeholder={t("Nombre")}
                    aria-label={t("Nombre del plan")}
                    value={nuevoPlan.nombre}
                    onChange={(e) => setNuevoPlan({ ...nuevoPlan, nombre: e.target.value })}
                    className={`${inputClass} sm:col-span-2`}
                  />
                  <button
                    type="submit"
                    className="sm:col-span-2 px-3 py-2 bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold rounded-lg"
                  >
                    {t("Crear plan")}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
