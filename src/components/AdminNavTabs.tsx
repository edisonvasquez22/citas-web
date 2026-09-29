import React from 'react';
import { ActiveScreen } from '../types';

interface AdminNavTabsProps {
  active: 'aprobacion-citas' | 'admin-catalogo' | 'admin-reprogramaciones';
  onNavigate: (screen: ActiveScreen) => void;
}

/** Navegación entre las tres pantallas del rol ADMIN (HU-016, HU-009/010/011 y HU-020); no hay un shell de nav global en la app. */
export const AdminNavTabs: React.FC<AdminNavTabsProps> = ({ active, onNavigate }) => {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <button
        type="button"
        onClick={() => onNavigate('aprobacion-citas')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
          active === 'aprobacion-citas' ? 'bg-[#006066] text-white shadow-sm' : 'bg-white border border-[#bdc9ca]/70 text-[#3e494a] hover:bg-[#eff4ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">fact_check</span>
        Bandeja de Aprobación
      </button>
      <button
        type="button"
        onClick={() => onNavigate('admin-catalogo')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
          active === 'admin-catalogo' ? 'bg-[#006066] text-white shadow-sm' : 'bg-white border border-[#bdc9ca]/70 text-[#3e494a] hover:bg-[#eff4ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">inventory_2</span>
        Gestión de Catálogo
      </button>
      <button
        type="button"
        onClick={() => onNavigate('admin-reprogramaciones')}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
          active === 'admin-reprogramaciones' ? 'bg-[#006066] text-white shadow-sm' : 'bg-white border border-[#bdc9ca]/70 text-[#3e494a] hover:bg-[#eff4ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">event_repeat</span>
        Reprogramaciones
      </button>
    </div>
  );
};
