import React, { useEffect, useState } from 'react';
import { UserSession, ActiveScreen } from './types';
import { API_URL, getSession, setSession, subscribe } from './api/session';
import { homeScreenFor, isScreenAllowed } from './navigation';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { RegisterScreen } from './components/RegisterScreen';
import { SupportModal } from './components/SupportModal';
import { PasswordRecoveryModal } from './components/PasswordRecoveryModal';
import { AgendarCitaScreen } from './components/AgendarCitaScreen';
import { MisCitasScreen } from './components/MisCitasScreen';
import { MiPerfilScreen } from './components/MiPerfilScreen';
import { InicioPacienteScreen } from './components/InicioPacienteScreen';
import { InicioAdminScreen, InicioProfesionalScreen } from './components/InicioRolScreens';
import { PatientNavTabs } from './components/NavTabs';
import { DisponibilidadProfesionalScreen } from './components/DisponibilidadProfesionalScreen';
import { AgendaProfesionalScreen } from './components/AgendaProfesionalScreen';
import { AprobacionCitasScreen } from './components/AprobacionCitasScreen';
import { AdminCatalogoScreen } from './components/AdminCatalogoScreen';
import { AdminEpsScreen } from './components/AdminEpsScreen';
import { BandejaReprogramacionesScreen } from './components/BandejaReprogramacionesScreen';
import { getLanguage, Language, setLanguage as persistLanguage, t } from './i18n';

const SCREEN_KEY = 'fcv.screen';

function initialScreen(session: UserSession | null): ActiveScreen {
  if (!session) return 'login';
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(SCREEN_KEY);
  } catch {
    stored = null;
  }
  return stored && isScreenAllowed(stored as ActiveScreen, session.roles)
    ? (stored as ActiveScreen)
    : homeScreenFor(session.roles);
}

export default function App() {
  const [session, setSessionState] = useState<UserSession | null>(() => getSession());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>(() => initialScreen(getSession()));
  const [sesionExpirada, setSesionExpirada] = useState(false);
  // El estado solo fuerza el re-render; la fuente de verdad del idioma es el módulo i18n.
  const [language, setLanguageState] = useState<Language>(() => getLanguage());
  const toggleLanguage = () => {
    const siguiente: Language = language === 'ES' ? 'EN' : 'ES';
    persistLanguage(siguiente);
    setLanguageState(siguiente);
  };

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  useEffect(() => persistLanguage(getLanguage()), []);

  useEffect(
    () =>
      subscribe((nueva, reason) => {
        setSessionState(nueva);
        if (!nueva) {
          setActiveScreen('login');
          setSesionExpirada(reason === 'expired');
        }
      }),
    []
  );

  useEffect(() => {
    try {
      if (session) sessionStorage.setItem(SCREEN_KEY, activeScreen);
      else sessionStorage.removeItem(SCREEN_KEY);
    } catch {
      // Sin almacenamiento: solo se pierde la pantalla actual al recargar.
    }
  }, [activeScreen, session]);

  const navigate = (screen: ActiveScreen) => {
    if (session && !isScreenAllowed(screen, session.roles)) return;
    setActiveScreen(screen);
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSesionExpirada(false);
    setSession(newSession);
    setActiveScreen(homeScreenFor(newSession.roles));
  };

  const handleLogout = () => {
    const actual = getSession();
    if (actual) {
      // Revoca el refresh token; si falla, la sesión local se cierra igual.
      fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: actual.refreshToken })
      }).catch(() => undefined);
    }
    setSession(null);
  };

  // Agendar y Mis Citas ya traen su propio contenedor con padding; Inicio y Mi Perfil no.
  const pacienteScreen = (contenido: React.ReactNode, conPadding = false) => (
    <div className="max-w-7xl mx-auto w-full flex-1 pt-6 sm:pt-8 flex flex-col">
      <div className="px-4 sm:px-6">
        <PatientNavTabs active={activeScreen} onNavigate={navigate} />
      </div>
      {conPadding ? <div className="px-4 sm:px-6 pb-8">{contenido}</div> : contenido}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f8f9ff] text-[#0d1c2e] font-sans antialiased">
      <Header
        session={session}
        onLogout={handleLogout}
        onOpenSupport={() => setIsSupportOpen(true)}
        onToggleLanguage={toggleLanguage}
      />

      <main className="w-full flex-1 flex flex-col items-center justify-center">
        {activeScreen === 'login' && (
          <>
            {sesionExpirada && (
              <p
                role="alert"
                className="mt-6 mx-4 max-w-[440px] w-full text-[13px] bg-amber-50 border border-amber-200 text-amber-950 rounded-lg p-3 flex gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">timer_off</span>
                {t("Tu sesión expiró. Inicia sesión nuevamente para continuar.")}
              </p>
            )}
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onOpenRecovery={() => setIsRecoveryOpen(true)}
              onOpenRegister={() => setActiveScreen('register')}
            />
          </>
        )}

        {activeScreen === 'register' && (
          <RegisterScreen onGoToLogin={() => setActiveScreen('login')} onOpenSupport={() => setIsSupportOpen(true)} />
        )}

        {session && (
          <>
            {activeScreen === 'success-landing' &&
              pacienteScreen(<InicioPacienteScreen onNavigate={navigate} />, true)}

            {activeScreen === 'agendar-cita' &&
              pacienteScreen(
                <AgendarCitaScreen session={session} onVolverInicio={() => navigate('success-landing')} />
              )}

            {activeScreen === 'mis-citas' &&
              pacienteScreen(
                <MisCitasScreen
                  session={session}
                  onNuevaCita={() => navigate('agendar-cita')}
                  onVolverInicio={() => navigate('success-landing')}
                />
              )}

            {activeScreen === 'mi-perfil' && pacienteScreen(<MiPerfilScreen />, true)}

            {activeScreen === 'inicio-profesional' && <InicioProfesionalScreen onNavigate={navigate} />}

            {activeScreen === 'mi-disponibilidad' && (
              <DisponibilidadProfesionalScreen session={session} onNavigate={navigate} />
            )}

            {activeScreen === 'mi-agenda' && <AgendaProfesionalScreen session={session} onNavigate={navigate} />}

            {activeScreen === 'inicio-admin' && <InicioAdminScreen onNavigate={navigate} />}

            {activeScreen === 'aprobacion-citas' && <AprobacionCitasScreen session={session} onNavigate={navigate} />}

            {activeScreen === 'admin-catalogo' && <AdminCatalogoScreen session={session} onNavigate={navigate} />}

            {activeScreen === 'admin-eps' && <AdminEpsScreen onNavigate={navigate} />}

            {activeScreen === 'admin-reprogramaciones' && (
              <BandejaReprogramacionesScreen session={session} onNavigate={navigate} />
            )}
          </>
        )}
      </main>

      <footer className="w-full py-4 text-center text-[11px] text-[#3e494a] border-t border-[#eff4ff]">
        <div className="max-w-[1280px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t("© 2026 FCV Citas • Fundación Cardiovascular. Plataforma Segura.")}</span>
          <div className="flex items-center gap-3 text-[10px] text-[#6e797a]">
            <span>{t("ISO/IEC 27001 Salud")}</span>
            <span>•</span>
            <span>{t("Floridablanca, Santander, Colombia")}</span>
          </div>
        </div>
      </footer>

      <SupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      <PasswordRecoveryModal isOpen={isRecoveryOpen} onClose={() => setIsRecoveryOpen(false)} />
    </div>
  );
}
