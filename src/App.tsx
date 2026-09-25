import React, { useState } from 'react';
import { UserSession, ActiveScreen } from './types';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { RegisterScreen } from './components/RegisterScreen';
import { SuccessView } from './components/SuccessView';
import { SupportModal } from './components/SupportModal';
import { PasswordRecoveryModal } from './components/PasswordRecoveryModal';
import { AgendarCitaScreen } from './components/AgendarCitaScreen';
import { DisponibilidadProfesionalScreen } from './components/DisponibilidadProfesionalScreen';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('login');
  const [language, setLanguage] = useState<'ES' | 'EN'>('ES');

  // Modals
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    // PROFESSIONAL aterriza directo en su calendario (HU-012); no hay pantalla de landing propia para ese rol.
    setActiveScreen(newSession.roles.includes('PROFESSIONAL') ? 'mi-disponibilidad' : 'success-landing');
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
          />
        )}

        {activeScreen === 'agendar-cita' && session && (
          <AgendarCitaScreen session={session} onVolverInicio={() => setActiveScreen('success-landing')} />
        )}

        {activeScreen === 'mi-disponibilidad' && session && (
          <DisponibilidadProfesionalScreen session={session} />
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
