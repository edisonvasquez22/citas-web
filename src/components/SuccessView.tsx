import React, { useState } from 'react';
import { UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface SuccessViewProps {
  session: UserSession;
  onLogout: () => void;
  language: 'ES' | 'EN';
  onGoToBooking: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ session, onLogout, language, onGoToBooking }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: session.refreshToken })
      });
    } finally {
      setIsLoggingOut(false);
      onLogout();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-[440px]">
        <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden p-6 sm:p-7 text-center flex flex-col items-center">
          {/* Top checkmark icon */}
          <div className="w-16 h-16 rounded-full bg-[#99f1f9]/40 flex items-center justify-center text-[#006066] mb-4 shadow-xs border border-[#7dd4dd]/50">
            <span className="material-symbols-outlined text-[36px]">verified</span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-[#d4e3ff] text-[#001c3a] text-[11px] font-semibold uppercase tracking-wider mb-2">
            {language === 'ES' ? 'Sesión Activa' : 'Active Session'}
          </span>

          <h2 className="font-display font-semibold text-[20px] text-[#0d1c2e]">
            {language === 'ES' ? 'Bienvenido a FCV Citas' : 'Welcome to FCV Citas'}
          </h2>

          <p className="text-[13px] text-[#3e494a] mt-1 mb-5 max-w-[300px] leading-relaxed">
            {language === 'ES'
              ? 'Autenticación exitosa. Tu sesión está activa con un token de acceso vigente.'
              : 'Authentication successful. Your session is active with a valid access token.'}
          </p>

          {/* User Information Badge */}
          <div className="w-full bg-[#eff4ff] rounded-lg p-4 text-left mb-5 space-y-2.5 border border-[#dce9ff]/70 text-[13px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#d5e3fc]">
              <span className="text-[11px] text-[#3e494a] uppercase font-semibold tracking-wider">
                {language === 'ES' ? 'Usuario' : 'User'}
              </span>
              <span className="font-semibold text-[#0d1c2e] font-mono text-[12px]">{session.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#3e494a] uppercase font-semibold tracking-wider">
                {language === 'ES' ? 'Estado Token' : 'Token Status'}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[#006066] text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-[#dce9ff]">
                <span className="w-2 h-2 rounded-full bg-[#006066] animate-pulse"></span>
                {language === 'ES' ? 'Activo' : 'Active'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={onGoToBooking}
              className="w-full py-2.5 px-4 bg-[#006066] hover:bg-[#0d7a82] text-white text-[13px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              <span>{language === 'ES' ? 'Agendar una cita' : 'Book an appointment'}</span>
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full py-2 px-4 bg-transparent hover:bg-[#eff4ff] text-[#3e494a] hover:text-[#ba1a1a] text-[13px] rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              <span>{language === 'ES' ? 'Cerrar Sesión' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
