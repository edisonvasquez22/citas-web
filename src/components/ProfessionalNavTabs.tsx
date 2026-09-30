import React from 'react';
import { ActiveScreen } from '../types';
import { NavTabs, PROFESSIONAL_TABS } from './NavTabs';

interface ProfessionalNavTabsProps {
  active: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const ProfessionalNavTabs: React.FC<ProfessionalNavTabsProps> = ({ active, onNavigate }) => (
  <NavTabs items={PROFESSIONAL_TABS} active={active} onNavigate={onNavigate} />
);
