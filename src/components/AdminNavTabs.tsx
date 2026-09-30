import React from 'react';
import { ActiveScreen } from '../types';
import { ADMIN_TABS, NavTabs } from './NavTabs';

interface AdminNavTabsProps {
  active: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const AdminNavTabs: React.FC<AdminNavTabsProps> = ({ active, onNavigate }) => (
  <NavTabs items={ADMIN_TABS} active={active} onNavigate={onNavigate} />
);
