import React from 'react';
import { ActiveScreen } from '../types';

interface ProfessionalNavTabsProps {
  active: 'mi-agenda' | 'mi-disponibilidad';
  onNavigate: (screen: ActiveScreen) => void;
}

/** Navegación entre las dos pantallas del rol PROFESSIONAL (HU-021/022 y HU-012); no hay un shell de nav global en la app. */
export const ProfessionalNavTabs: React.FC<ProfessionalNavTabsProps> = ({ active, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <button
        type="button"
        onClick={() => onNavigate('mi-agenda')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
          active === 'mi-agenda' ? 'bg-[#006066] text-white shadow-sm' : 'bg-white border border-[#bdc9ca]/70 text-[#3e494a] hover:bg-[#eff4ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">event_available</span>
        Mi Agenda
      </button>
      <button
        type="button"
        onClick={() => onNavigate('mi-disponibilidad')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
          active === 'mi-disponibilidad' ? 'bg-[#006066] text-white shadow-sm' : 'bg-white border border-[#bdc9ca]/70 text-[#3e494a] hover:bg-[#eff4ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
        Mi Disponibilidad
      </button>
    </div>
  );
};
