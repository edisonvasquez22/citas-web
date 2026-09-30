import React from 'react';
import { ActiveScreen } from '../types';

export interface NavTabItem {
  screen: ActiveScreen;
  label: string;
  icon: string;
}

interface NavTabsProps {
  items: NavTabItem[];
  active: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({ items, active, onNavigate }) => (
  <nav className="flex items-center gap-2 mb-4 flex-wrap" aria-label="Navegación principal">
    {items.map((item) => (
      <button
        key={item.screen}
        type="button"
        onClick={() => onNavigate(item.screen)}
        aria-current={active === item.screen ? 'page' : undefined}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
          active === item.screen
            ? 'bg-[#006066] text-white shadow-sm'
            : 'bg-white border border-[#bdc9ca]/70 text-[#3e494a] hover:bg-[#eff4ff]'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
        {item.label}
      </button>
    ))}
  </nav>
);

export const PATIENT_TABS: NavTabItem[] = [
  { screen: 'success-landing', label: 'Inicio', icon: 'home' },
  { screen: 'agendar-cita', label: 'Agendar Cita', icon: 'calendar_add_on' },
  { screen: 'mis-citas', label: 'Mis Citas', icon: 'event_note' },
  { screen: 'mi-perfil', label: 'Mi Perfil', icon: 'badge' }
];

export const PROFESSIONAL_TABS: NavTabItem[] = [
  { screen: 'inicio-profesional', label: 'Inicio', icon: 'home' },
  { screen: 'mi-agenda', label: 'Mi Agenda', icon: 'event_available' },
  { screen: 'mi-disponibilidad', label: 'Mi Disponibilidad', icon: 'calendar_month' }
];

export const ADMIN_TABS: NavTabItem[] = [
  { screen: 'inicio-admin', label: 'Inicio', icon: 'home' },
  { screen: 'aprobacion-citas', label: 'Bandeja de Aprobación', icon: 'fact_check' },
  { screen: 'admin-reprogramaciones', label: 'Reprogramaciones', icon: 'event_repeat' },
  { screen: 'admin-catalogo', label: 'Especialidades y Profesionales', icon: 'inventory_2' },
  { screen: 'admin-eps', label: 'EPS y Planes', icon: 'health_and_safety' }
];

export const PatientNavTabs: React.FC<{ active: ActiveScreen; onNavigate: (s: ActiveScreen) => void }> = (p) => (
  <NavTabs items={PATIENT_TABS} {...p} />
);
