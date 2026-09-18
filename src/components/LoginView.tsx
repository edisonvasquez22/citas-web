import React, { useState } from 'react';
import { UserSession } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
  onOpenRecovery: () => void;
  onOpenRegister: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onOpenRecovery,
  onOpenRegister
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation & alerts
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    type: 'error' | 'network' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const [imgError, setImgError] = useState(false);

  const validateEmail = (val: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.toLowerCase());
  };

  const handleEmailBlur = () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('El correo electrónico es obligatorio.');
    } else if (!validateEmail(cleanEmail)) {
      setEmailError('Ingresa un formato de correo electrónico válido.');
    } else {
      setEmailError(null);
    }
  };

  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError('La contraseña es obligatoria para acceder.');
    } else {
      setPasswordError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertInfo(null);

    const cleanEmail = email.trim();
    let hasError = false;

    if (!cleanEmail) {
      setEmailError('El correo electrónico es obligatorio.');
      hasError = true;
    } else if (!validateEmail(cleanEmail)) {
      setEmailError('Ingresa un formato de correo electrónico válido.');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('La contraseña es obligatoria para acceder.');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password })
      });

      if (response.status === 401) {
        setAlertInfo({
          type: 'error',
          title: 'Acceso Denegado',
          message: 'Email o contraseña incorrectos. Verifica tus credenciales.'
        });
        return;
      }

      if (!response.ok) {
        setAlertInfo({
          type: 'network',
          title: 'Error de Conexión',
          message: 'Error de conexión con el servidor institucional. Inténtalo de nuevo más tarde.'
        });
        return;
      }

      const data: { accessToken: string; refreshToken: string } = await response.json();
      const newSession: UserSession = {
        email: cleanEmail,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };

      onLoginSuccess(newSession);
    } catch {
      setAlertInfo({
        type: 'network',
        title: 'Error de Conexión',
        message: 'No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
      <div className="flex flex-col w-full max-w-[440px]">
        {/* Main Card Container */}
        <div className="relative bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden transition-all duration-300">
          {/* Top Decorative Clinical Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#006066] via-[#00798e] to-[#436088]"></div>

          <div className="p-6 sm:p-7">
            {/* Header & Branding with Logo */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 rounded-lg bg-[#eff4ff] flex items-center justify-center mb-2.5 p-1 border border-[#dce9ff]/60 shadow-xs">
                {!imgError ? (
                  <img
                    src="https://lh3.googleusercontent.com/aida/AEtjO1WaNRoTlHr2mSNpI2htqFwuJiwQpjwmSd9t7OiAOkKEuIt6oHxiRSSlCrmn6dqriqdjS-dq9noh5k2KSb1p2qpiuqS3_X0RxdCSgoeK5VM9zwIGuO3vJEGT1d-I97tmy_nkP7RxZH8lEWkSdmQXunpNw66roHUDCshm52hLDqpvOJPeQMt-wk2mcVh36vAPjXCl-8AJdy-OsAJgw-_xaSPwKeIZVg9kJP-O6n-4QQRz0kGFPzHtiv40JdkN"
                    alt="FCV Citas Logo"
                    className="w-full h-full object-contain"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-[#006066] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[24px]">ecg_heart</span>
                  </div>
                )}
              </div>

              <span className="text-[11px] font-semibold text-[#006066] tracking-wider uppercase mb-1">
                LABORATORIO FCV • DATOS FICTICIOS
              </span>
              <h1 className="font-display font-semibold text-[22px] sm:text-[24px] text-[#0d1c2e] tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-[13px] text-[#3e494a] mt-1 max-w-[320px] leading-relaxed">
                Accede a tu cuenta para gestionar tus citas médicas en FCV
              </p>
            </div>

            {/* Global Alert Notification Banner */}
            {alertInfo && (
              <div
                role="alert"
                className={`mb-4 p-3 rounded-lg flex items-start gap-2.5 transition-all text-[13px] ${
                  alertInfo.type === 'error'
                    ? 'bg-[#ffdad6] text-[#93000a] border border-[#ffb4ab]'
                    : alertInfo.type === 'network'
                    ? 'bg-[#dce9ff] text-[#0d1c2e] border border-[#b4d0ff]'
                    : 'bg-[#eff4ff] text-[#006066] border border-[#dce9ff]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">
                  {alertInfo.type === 'error' ? 'warning' : alertInfo.type === 'network' ? 'wifi_off' : 'info'}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{alertInfo.title}</p>
                  <p className="text-[12px] mt-0.5 opacity-90">{alertInfo.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertInfo(null)}
                  className="opacity-70 hover:opacity-100 p-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[#0d1c2e]" htmlFor="login-email">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6e797a]">
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    onBlur={handleEmailBlur}
                    placeholder="nombre@correo.com"
                    className={`w-full pl-9 pr-3 py-2.5 bg-white text-[#0d1c2e] text-[14px] rounded-lg border shadow-xs placeholder:text-[#6e797a] focus:outline-none transition-colors ${
                      emailError
                        ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                        : 'border-[#bdc9ca] focus:border-[#006066] focus:ring-1 focus:ring-[#006066]'
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-[#ba1a1a] text-[11px] font-medium flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[13px] font-medium text-[#0d1c2e]" htmlFor="login-password">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={onOpenRecovery}
                    className="text-[12px] text-[#006066] hover:underline font-medium focus:outline-none"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6e797a]">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </div>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    onBlur={handlePasswordBlur}
                    placeholder="••••••••"
                    className={`w-full pl-9 pr-10 py-2.5 bg-white text-[#0d1c2e] text-[14px] rounded-lg border shadow-xs placeholder:text-[#6e797a] focus:outline-none transition-colors ${
                      passwordError
                        ? 'border-[#ba1a1a] focus:border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]'
                        : 'border-[#bdc9ca] focus:border-[#006066] focus:ring-1 focus:ring-[#006066]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6e797a] hover:text-[#0d1c2e] focus:outline-none"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[#ba1a1a] text-[11px] font-medium flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    <span>{passwordError}</span>
                  </p>
                )}
              </div>

              {/* Remember Me Checkbox & TLS Badge */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006066] border-[#6e797a] focus:ring-0 cursor-pointer accent-[#006066]"
                  />
                  <span className="text-[12px] text-[#3e494a]">Recordar sesión institucional</span>
                </label>
                <div className="flex items-center gap-1 text-[#3e494a] text-[11px]">
                  <span className="material-symbols-outlined text-[14px] text-[#005f6f]">shield</span>
                  <span>TLS 256-bit</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#006066] hover:bg-[#0d7a82] text-white text-[14px] font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <span>Iniciar Sesión</span>
                )}
              </button>
            </form>

            {/* Institutional Quick Access Footer inside card */}
            <div className="mt-6 pt-4 bg-[#eff4ff] -mx-6 -mb-6 sm:-mx-7 sm:-mb-7 p-4 text-center rounded-b-xl flex flex-col items-center gap-1 border-t border-[#dce9ff]/60">
              <p className="text-[12px] text-[#3e494a]">
                ¿No tienes cuenta institucional?{' '}
                <button
                  type="button"
                  onClick={onOpenRegister}
                  className="text-[#006066] hover:underline font-semibold focus:outline-none cursor-pointer"
                >
                  Regístrate aquí
                </button>
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-[#3e494a] mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d7a82]"></span>
                <span>Acceso para pacientes registrados en FCV</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Institutional Compliance Meta Strip */}
        <div className="mt-4 text-center flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-[#3e494a]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">verified_user</span>
            ISO/IEC 27001 Salud
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">dns</span>
            Servidor Seguro Floridablanca
          </span>
        </div>
      </div>
    </div>
  );
};
