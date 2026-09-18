import React from 'react';
import { UserSession } from '../types';

interface HeaderProps {
  session: UserSession | null;
  onLogout: () => void;
  onOpenSupport: () => void;
  language: 'ES' | 'EN';
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  onLogout,
  onOpenSupport,
  language,
  onToggleLanguage
}) => {
  return (
    <header className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#eff4ff]">
      {/* Brand & Lab Tagline */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="w-10 h-10 rounded-lg bg-[#006066] flex items-center justify-center text-white shadow-sm">
          <span className="material-symbols-outlined text-[24px]">biotech</span>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-semibold text-[18px] sm:text-[20px] text-[#006066] tracking-tight">
              FCV Citas
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#d4e3ff] text-[#001c3a] text-[11px] font-semibold tracking-wider uppercase">
              Labs
            </span>
          </div>
          <span className="text-[12px] text-[#3e494a] font-medium leading-none">
            {language === 'ES' ? 'Laboratorio de Entrenamiento' : 'Clinical Training Laboratory'}
          </span>
        </div>
      </div>

      {/* Right Controls: Language, Support, Profile/Logout */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language switch */}
        <button
          onClick={onToggleLanguage}
          className="flex items-center gap-1 text-[#3e494a] hover:text-[#0d1c2e] px-2 py-1 rounded-md transition-colors bg-white/70 hover:bg-white border border-[#e6eeff]"
          title={language === 'ES' ? 'Cambiar a Inglés' : 'Switch to Spanish'}
          type="button"
        >
          <span className="material-symbols-outlined text-[18px] text-[#436088]">language</span>
          <span className="text-[12px] font-semibold uppercase">{language}</span>
        </button>

        {/* Support */}
        <button
          onClick={onOpenSupport}
          className="text-[12px] text-[#006066] hover:text-[#0d7a82] font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#eff4ff] transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">help_outline</span>
          <span className="hidden sm:inline">{language === 'ES' ? 'Soporte' : 'Support'}</span>
        </button>

        {/* Authenticated user pill / Logout */}
        {session ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#e6eeff]">
            <div className="flex items-center gap-2 bg-[#eff4ff] px-2.5 py-1.5 rounded-lg">
              <div className="w-6 h-6 rounded-full bg-[#006066] text-white flex items-center justify-center text-[11px] font-bold">
                {session.email.charAt(0).toUpperCase()}
              </div>
              <span className="hidden lg:inline text-[12px] font-semibold text-[#0d1c2e] leading-tight max-w-[160px] truncate">
                {session.email}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-[#6e797a] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded-lg transition-colors"
              title={language === 'ES' ? 'Cerrar Sesión' : 'Sign Out'}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
};
