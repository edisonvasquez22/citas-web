import React, { useState } from 'react';
import { UserSession, ActiveScreen } from './types';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { RegisterScreen } from './components/RegisterScreen';
import { SuccessView } from './components/SuccessView';
import { SupportModal } from './components/SupportModal';
import { PasswordRecoveryModal } from './components/PasswordRecoveryModal';
import { AgendarCitaScreen } from './components/AgendarCitaScreen';
import { MisCitasScreen } from './components/MisCitasScreen';
import { DisponibilidadProfesionalScreen } from './components/DisponibilidadProfesionalScreen';
import { AgendaProfesionalScreen } from './components/AgendaProfesionalScreen';
import { AprobacionCitasScreen } from './components/AprobacionCitasScreen';
import { AdminCatalogoScreen } from './components/AdminCatalogoScreen';
import { BandejaReprogramacionesScreen } from './components/BandejaReprogramacionesScreen';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('login');
  const [language, setLanguage] = useState<'ES' | 'EN'>('ES');

  // Modals
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    // PROFESSIONAL/ADMIN aterrizan directo en su pantalla de gestión (HU-012/HU-016); no hay landing propio para esos roles.
    if (newSession.roles.includes('PROFESSIONAL')) {
      setActiveScreen('mi-disponibilidad');
    } else if (newSession.roles.includes('ADMIN')) {
      setActiveScreen('aprobacion-citas');
    } else {
      setActiveScreen('success-landing');
    }
  };

  const handleLogout = () => {
    setSession(null);
    setActiveScreen('login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9ff] text-[#0d1c2e] font-sans antialiased">
      {/* Universal Institutional Header */}
      <Header
        session={session}
        onLogout={handleLogout}
        onOpenSupport={() => setIsSupportOpen(true)}
        language={language}
        onToggleLanguage={() => setLanguage(language === 'ES' ? 'EN' : 'ES')}
      />

      {/* Main Content Render */}
      <main className="w-full flex-1 flex flex-col items-center justify-center">
        {activeScreen === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onOpenRecovery={() => setIsRecoveryOpen(true)}
            onOpenRegister={() => setActiveScreen('register')}
          />
        )}

        {activeScreen === 'register' && (
          <RegisterScreen
            onGoToLogin={() => setActiveScreen('login')}
            onOpenSupport={() => setIsSupportOpen(true)}
          />
        )}

        {activeScreen === 'success-landing' && session && (
          <SuccessView
            session={session}
            onLogout={handleLogout}
            language={language}
            onGoToBooking={() => setActiveScreen('agendar-cita')}
            onGoToMisCitas={() => setActiveScreen('mis-citas')}
          />
        )}

        {activeScreen === 'agendar-cita' && session && (
          <AgendarCitaScreen session={session} onVolverInicio={() => setActiveScreen('success-landing')} />
        )}

        {activeScreen === 'mis-citas' && session && (
          <MisCitasScreen
            session={session}
            onNuevaCita={() => setActiveScreen('agendar-cita')}
            onVolverInicio={() => setActiveScreen('success-landing')}
          />
        )}

        {activeScreen === 'mi-disponibilidad' && session && (
          <DisponibilidadProfesionalScreen session={session} onNavigate={setActiveScreen} />
        )}

        {activeScreen === 'mi-agenda' && session && (
          <AgendaProfesionalScreen session={session} onNavigate={setActiveScreen} />
        )}

        {activeScreen === 'aprobacion-citas' && session && (
          <AprobacionCitasScreen session={session} onNavigate={setActiveScreen} />
        )}

        {activeScreen === 'admin-catalogo' && session && (
          <AdminCatalogoScreen session={session} onNavigate={setActiveScreen} />
        )}

        {activeScreen === 'admin-reprogramaciones' && session && (
          <BandejaReprogramacionesScreen session={session} onNavigate={setActiveScreen} />
        )}
      </main>

      {/* Institutional Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-[#3e494a] border-t border-[#eff4ff]">
        <div className="max-w-[1280px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 FCV Citas • Fundación Cardiovascular. Plataforma Segura.</span>
          <div className="flex items-center gap-3 text-[10px] text-[#6e797a]">
            <span>ISO/IEC 27001 Salud</span>
            <span>•</span>
            <span>Floridablanca, Santander, Colombia</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        language={language}
      />

      <PasswordRecoveryModal
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
      />
    </div>
  );
}
