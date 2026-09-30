import React, { useState } from 'react';
import { API_URL } from '../api/session';
import { mensajeDeError } from '../api/errors';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Paso = 'solicitar' | 'confirmar' | 'listo';

const inputClass =
  'w-full px-3 py-2 rounded-lg bg-[#eff4ff] border border-[#bdc9ca]/60 text-[13px] text-[#0d1c2e] focus:outline-none focus:ring-2 focus:ring-[#0d7a82]';

/** HU-003 (RF-03). Sin SMTP en el laboratorio: el token solo aparece en el log del backend, nunca en la respuesta. */
export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
  const [paso, setPaso] = useState<Paso>('solicitar');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  const cerrar = () => {
    setPaso('solicitar');
    setEmail('');
    setToken('');
    setNuevaPassword('');
    setConfirmacion('');
    setError(null);
    setInfo(null);
    onClose();
  };

  const solicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    setCargando(true);
    try {
      const resp = await fetch(`${API_URL}/api/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      if (!resp.ok) {
        setError(await mensajeDeError(resp, 'No se pudo solicitar la recuperación.'));
        return;
      }
      const data: { message: string } = await resp.json();
      setInfo(data.message);
      setPaso('confirmar');
    } catch {
      setError('No se pudo contactar al servidor. Inténtalo de nuevo más tarde.');
    } finally {
      setCargando(false);
    }
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError('Ingresa el token de recuperación.');
      return;
    }
    if (nuevaPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      const resp = await fetch(`${API_URL}/api/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim(), nuevaPassword })
      });
      if (!resp.ok) {
        setError(await mensajeDeError(resp, 'El token no es válido o ya expiró.'));
        return;
      }
      setPaso('listo');
    } catch {
      setError('No se pudo contactar al servidor. Inténtalo de nuevo más tarde.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs"
      onClick={cerrar}
      role="dialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
    >
      <div
        className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl relative border border-[#e6eeff]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#006066] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">lock_reset</span>
          </div>
          <button
            className="text-[#6e797a] hover:text-[#0d1c2e] p-1 rounded-md hover:bg-[#eff4ff]"
            onClick={cerrar}
            type="button"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <h3 id="recovery-title" className="font-display font-semibold text-[18px] text-[#0d1c2e]">
          Restablecer Contraseña
        </h3>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#ffdad6] text-[#93000a] text-[12px] flex gap-1.5" role="alert">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {paso === 'solicitar' && (
          <form onSubmit={solicitar} className="mt-2 space-y-3" noValidate>
            <p className="text-[13px] text-[#3e494a] leading-relaxed">
              Ingresa el correo de tu cuenta y generaremos un token de recuperación.
            </p>
            <label className="block text-[12px] font-semibold text-[#3e494a]">
              Correo electrónico
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClass} mt-1`}
                autoComplete="email"
                autoFocus
              />
            </label>
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2 px-3 bg-[#006066] hover:bg-[#0d7a82] text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {cargando ? 'Enviando…' : 'Solicitar token'}
            </button>
            <button
              type="button"
              onClick={() => setPaso('confirmar')}
              className="w-full text-[12px] text-[#006066] hover:underline"
            >
              Ya tengo un token
            </button>
          </form>
        )}

        {paso === 'confirmar' && (
          <form onSubmit={confirmar} className="mt-2 space-y-3" noValidate>
            {info && <p className="text-[12px] text-[#005f6f] bg-[#00798e]/10 rounded-lg p-2.5">{info}</p>}
            <p className="text-[12px] text-[#6e797a] leading-relaxed">
              En este laboratorio no se envía correo: el token queda en el log del servidor de citas-api. Es válido por 30 minutos y solo sirve una vez.
            </p>
            <label className="block text-[12px] font-semibold text-[#3e494a]">
              Token de recuperación
              <input value={token} onChange={(e) => setToken(e.target.value)} className={`${inputClass} mt-1 font-mono`} />
            </label>
            <label className="block text-[12px] font-semibold text-[#3e494a]">
              Nueva contraseña
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className={`${inputClass} mt-1`}
                autoComplete="new-password"
              />
            </label>
            <label className="block text-[12px] font-semibold text-[#3e494a]">
              Confirmar contraseña
              <input
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                className={`${inputClass} mt-1`}
                autoComplete="new-password"
              />
            </label>
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2 px-3 bg-[#006066] hover:bg-[#0d7a82] text-white text-[13px] font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {cargando ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {paso === 'listo' && (
          <div className="mt-3 space-y-3">
            <p className="text-[13px] text-[#005f6f] bg-[#00798e]/10 rounded-lg p-3 flex gap-1.5">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Tu contraseña fue actualizada. Ya puedes iniciar sesión con la nueva contraseña.
            </p>
            <button
              type="button"
              onClick={cerrar}
              className="w-full py-2 px-3 bg-[#006066] hover:bg-[#0d7a82] text-white text-[13px] font-semibold rounded-lg"
            >
              Volver al inicio de sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
