import React, { useEffect, useState } from 'react';
import { AfiliacionApi, EpsApi, PerfilApi, PlanEpsApi, REGIMENES } from '../types';
import { apiFetch } from '../api/session';
import { mensajeDeError } from '../api/errors';

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[#eff4ff] border border-[#bdc9ca]/60 text-sm text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82] disabled:opacity-60';
const labelClass = 'block text-[12px] font-semibold text-[#3e494a]';

type Aviso = { tipo: 'ok' | 'error'; texto: string } | null;

const AvisoView: React.FC<{ aviso: Aviso }> = ({ aviso }) =>
  aviso ? (
    <p
      role={aviso.tipo === 'error' ? 'alert' : 'status'}
      className={`text-[13px] rounded-lg p-2.5 flex gap-1.5 ${
        aviso.tipo === 'ok' ? 'bg-[#00798e]/10 text-[#005f6f]' : 'bg-[#ffdad6] text-[#93000a]'
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{aviso.tipo === 'ok' ? 'check_circle' : 'error'}</span>
      {aviso.texto}
    </p>
  ) : null;

/** HU-004 (perfil) y HU-005 (afiliación EPS/plan) del paciente. */
export const MiPerfilScreen: React.FC = () => {
  const [perfil, setPerfil] = useState<PerfilApi | null>(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [avisoPerfil, setAvisoPerfil] = useState<Aviso>(null);

  const [afiliacion, setAfiliacion] = useState<AfiliacionApi | null>(null);
  const [eps, setEps] = useState<EpsApi[]>([]);
  const [planes, setPlanes] = useState<PlanEpsApi[]>([]);
  const [epsId, setEpsId] = useState<number | ''>('');
  const [planId, setPlanId] = useState<number | ''>('');
  const [numeroAfiliacion, setNumeroAfiliacion] = useState('');
  const [guardandoAfiliacion, setGuardandoAfiliacion] = useState(false);
  const [avisoAfiliacion, setAvisoAfiliacion] = useState<Aviso>(null);

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [rPerfil, rAfiliacion, rEps] = await Promise.all([
          apiFetch('/api/users/me'),
          apiFetch('/api/users/me/afiliacion'),
          apiFetch('/api/eps')
        ]);
        if (!rPerfil.ok || !rEps.ok || (!rAfiliacion.ok && rAfiliacion.status !== 404)) {
          throw new Error();
        }
        const p: PerfilApi = await rPerfil.json();
        const listaEps: EpsApi[] = await rEps.json();
        const a: AfiliacionApi | null = rAfiliacion.ok ? await rAfiliacion.json() : null;
        if (cancelado) return;
        setPerfil(p);
        setNombres(p.nombres);
        setApellidos(p.apellidos);
        setTelefono(p.telefono);
        setEps(listaEps);
        setAfiliacion(a);
        if (a) {
          setEpsId(a.epsId);
          setPlanId(a.planId);
          setNumeroAfiliacion(a.numeroAfiliacion);
        }
      } catch {
        if (!cancelado) setErrorCarga('No se pudo cargar tu perfil. Inténtalo de nuevo más tarde.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (epsId === '') {
      setPlanes([]);
      return;
    }
    let cancelado = false;
    apiFetch(`/api/eps/${epsId}/plans`)
      .then((r) => (r.ok ? r.json() : []))
      .then((lista: PlanEpsApi[]) => {
        if (!cancelado) setPlanes(lista);
      })
      .catch(() => {
        if (!cancelado) setPlanes([]);
      });
    return () => {
      cancelado = true;
    };
  }, [epsId]);

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoPerfil(null);
    if (!nombres.trim() || !apellidos.trim() || !telefono.trim()) {
      setAvisoPerfil({ tipo: 'error', texto: 'Nombres, apellidos y teléfono son obligatorios.' });
      return;
    }
    setGuardandoPerfil(true);
    try {
      const resp = await apiFetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombres: nombres.trim(), apellidos: apellidos.trim(), telefono: telefono.trim() })
      });
      if (!resp.ok) {
        setAvisoPerfil({ tipo: 'error', texto: await mensajeDeError(resp, 'No se pudo actualizar el perfil.') });
        return;
      }
      setPerfil(await resp.json());
      setAvisoPerfil({ tipo: 'ok', texto: 'Perfil actualizado.' });
    } catch {
      setAvisoPerfil({ tipo: 'error', texto: 'No se pudo contactar al servidor.' });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const guardarAfiliacion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvisoAfiliacion(null);
    if (epsId === '' || planId === '' || !numeroAfiliacion.trim()) {
      setAvisoAfiliacion({ tipo: 'error', texto: 'Selecciona EPS, plan e ingresa el número de afiliación.' });
      return;
    }
    setGuardandoAfiliacion(true);
    try {
      const resp = await apiFetch('/api/users/me/afiliacion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epsId, planId, numeroAfiliacion: numeroAfiliacion.trim() })
      });
      if (!resp.ok) {
        setAvisoAfiliacion({
          tipo: 'error',
          texto: await mensajeDeError(resp, 'No se pudo guardar la afiliación.')
        });
        return;
      }
      setAfiliacion(await resp.json());
      setAvisoAfiliacion({ tipo: 'ok', texto: 'Afiliación guardada.' });
    } catch {
      setAvisoAfiliacion({ tipo: 'error', texto: 'No se pudo contactar al servidor.' });
    } finally {
      setGuardandoAfiliacion(false);
    }
  };

  if (cargando) {
    return (
      <div className="py-10 flex flex-col items-center text-center text-[#6e797a]">
        <span className="material-symbols-outlined text-[36px] text-[#0d7a82] animate-spin">progress_activity</span>
        <p className="text-sm mt-3">Cargando tu perfil...</p>
      </div>
    );
  }

  if (errorCarga || !perfil) {
    return (
      <div className="rounded-xl p-6 bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/20 flex items-start gap-4">
        <span className="material-symbols-outlined text-[28px]">wifi_off</span>
        <div>
          <h3 className="font-bold">Error de Conexión</h3>
          <p className="text-sm mt-1">{errorCarga}</p>
        </div>
      </div>
    );
  }

  const planSeleccionado = planes.find((p) => p.id === planId);

  return (
    <div className="flex flex-col gap-6">
      <div className="pb-5 border-b border-[#eff4ff]">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#001c3a] text-[11px] font-bold tracking-wider uppercase mb-2">
          <span className="material-symbols-outlined text-[14px]">badge</span>
          Mi Cuenta
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0d1c2e] tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-[#3e494a] mt-1 max-w-2xl">
          Mantén actualizados tus datos de contacto y tu afiliación a EPS para agendar citas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={guardarPerfil} className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5 space-y-4" noValidate>
          <h2 className="font-display font-semibold text-lg text-[#0d1c2e]">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={labelClass}>
              Nombres
              <input value={nombres} onChange={(e) => setNombres(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className={labelClass}>
              Apellidos
              <input value={apellidos} onChange={(e) => setApellidos(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className={labelClass}>
              Teléfono
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={`${inputClass} mt-1`} />
            </label>
            <label className={labelClass}>
              Correo (no editable)
              <input value={perfil.email} disabled className={`${inputClass} mt-1`} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Documento (no editable)
              <input value={`${perfil.tipoDocumento} ${perfil.numeroDocumento}`} disabled className={`${inputClass} mt-1`} />
            </label>
          </div>
          <AvisoView aviso={avisoPerfil} />
          <button
            type="submit"
            disabled={guardandoPerfil}
            className="px-4 py-2 bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {guardandoPerfil ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>

        <form onSubmit={guardarAfiliacion} className="bg-white rounded-xl shadow-sm border border-[#e6eeff] p-5 space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-lg text-[#0d1c2e]">Afiliación EPS</h2>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                afiliacion ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
              }`}
            >
              {afiliacion ? 'Registrada' : 'Sin afiliación'}
            </span>
          </div>
          {afiliacion && (
            <p className="text-[13px] text-[#3e494a]">
              Actual: <strong>{afiliacion.epsNombre}</strong> · {afiliacion.planNombre} ·{' '}
              {REGIMENES[afiliacion.regimenId] ?? `Régimen ${afiliacion.regimenId}`} · N.º {afiliacion.numeroAfiliacion}
            </p>
          )}
          <label className={labelClass}>
            EPS
            <select
              value={epsId}
              onChange={(e) => {
                setEpsId(e.target.value ? Number(e.target.value) : '');
                setPlanId('');
              }}
              className={`${inputClass} mt-1`}
            >
              <option value="">Selecciona una EPS</option>
              {eps.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Plan
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : '')}
              disabled={epsId === ''}
              className={`${inputClass} mt-1`}
            >
              <option value="">{epsId === '' ? 'Primero selecciona una EPS' : 'Selecciona un plan'}</option>
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          {planSeleccionado && (
            <p className="text-[12px] text-[#6e797a]">
              Régimen: {REGIMENES[planSeleccionado.regimenId] ?? planSeleccionado.regimenId}
            </p>
          )}
          <label className={labelClass}>
            Número de afiliación
            <input
              value={numeroAfiliacion}
              onChange={(e) => setNumeroAfiliacion(e.target.value)}
              className={`${inputClass} mt-1`}
            />
          </label>
          <AvisoView aviso={avisoAfiliacion} />
          <button
            type="submit"
            disabled={guardandoAfiliacion}
            className="px-4 py-2 bg-[#006066] hover:bg-[#0d7a82] text-white text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {guardandoAfiliacion ? 'Guardando…' : afiliacion ? 'Actualizar afiliación' : 'Registrar afiliación'}
          </button>
        </form>
      </div>
    </div>
  );
};
