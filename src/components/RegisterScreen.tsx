import React, { useState } from 'react';
import { DocumentType } from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';
const FCV_LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WaNRoTlHr2mSNpI2htqFwuJiwQpjwmSd9t7OiAOkKEuIt6oHxiRSSlCrmn6dqriqdjS-dq9noh5k2KSb1p2qpiuqS3_X0RxdCSgoeK5VM9zwIGuO3vJEGT1d-I97tmy_nkP7RxZH8lEWkSdmQXunpNw66roHUDCshm52hLDqpvOJPeQMt-wk2mcVh36vAPjXCl-8AJdy-OsAJgw-_xaSPwKeIZVg9kJP-O6n-4QQRz0kGFPzHtiv40JdkN';

interface RegisterFormData {
  nombres: string;
  apellidos: string;
  tipoDocumento: DocumentType | '';
  numeroDocumento: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
}

interface RegisterScreenProps {
  onGoToLogin: () => void;
  onOpenSupport: () => void;
}

interface ValidationErrors {
  nombres?: string;
  apellidos?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  email?: string;
  telefono?: string;
  password?: string;
  confirmPassword?: string;
}

const EMPTY_FORM: RegisterFormData = {
  nombres: '',
  apellidos: '',
  tipoDocumento: '',
  numeroDocumento: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: ''
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onGoToLogin, onOpenSupport }) => {
  const [formData, setFormData] = useState<RegisterFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [alert, setAlert] = useState<{
    type: 'error' | 'info' | 'success';
    title: string;
    message: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.nombres.trim() || formData.nombres.trim().length < 2) {
      newErrors.nombres = 'Ingresa tus nombres completos.';
    }
    if (!formData.apellidos.trim() || formData.apellidos.trim().length < 2) {
      newErrors.apellidos = 'Ingresa tus apellidos completos.';
    }
    if (!formData.tipoDocumento) {
      newErrors.tipoDocumento = 'Selecciona el tipo de documento.';
    }
    if (!formData.numeroDocumento.trim() || formData.numeroDocumento.trim().length < 4) {
      newErrors.numeroDocumento = 'Ingresa un número de documento válido.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Ingresa una dirección de correo válida.';
    }
    if (!formData.telefono.trim() || formData.telefono.trim().length < 7) {
      newErrors.telefono = 'Ingresa un teléfono de contacto.';
    }
    if (!formData.password || formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setAlert({
        type: 'error',
        title: 'Formulario incompleto',
        message: 'Por favor corrige los campos señalados en rojo para continuar con tu registro.'
      });
      return;
    }

    setAlert(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombres: formData.nombres.trim(),
          apellidos: formData.apellidos.trim(),
          tipoDocumento: formData.tipoDocumento,
          numeroDocumento: formData.numeroDocumento.trim(),
          email: formData.email.trim(),
          telefono: formData.telefono.trim(),
          password: formData.password
        })
      });

      if (response.status === 400) {
        const data: { message?: string; detalles?: string[] } = await response.json();
        const fieldErrors: ValidationErrors = {};
        (data.detalles ?? []).forEach((detalle) => {
          const [campo, ...resto] = detalle.split(':');
          const key = campo.trim() as keyof ValidationErrors;
          if (key in EMPTY_FORM) fieldErrors[key] = resto.join(':').trim();
        });
        setErrors(fieldErrors);
        setAlert({
          type: 'error',
          title: 'Datos inválidos',
          message: data.message ?? 'Revisa los campos señalados en rojo.'
        });
        return;
      }

      if (response.status === 409) {
        const data: { message?: string } = await response.json();
        setAlert({
          type: 'error',
          title: 'Cuenta ya existente',
          message: data.message ?? 'Ya existe una cuenta registrada con esos datos.'
        });
        return;
      }

      if (!response.ok) {
        setAlert({
          type: 'error',
          title: 'Error de Conexión',
          message: 'No se pudo completar el registro. Inténtalo de nuevo más tarde.'
        });
        return;
      }

      setIsSuccess(true);
    } catch {
      setAlert({
        type: 'error',
        title: 'Error de Conexión',
        message: 'No se pudo contactar al servidor institucional. Verifica tu conexión e inténtalo de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-[820px] mx-auto bg-white rounded-xl shadow-xs border border-[#e2e8f0] overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-[#006066] via-[#00798e] to-[#436088]"></div>

        <div className="p-6 sm:p-10 flex flex-col">
          {/* Institutional Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f1f5f9] mb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-[#eff4ff] p-2 flex items-center justify-center shadow-xs border border-[#dce9ff]">
                <img
                  src={FCV_LOGO_URL}
                  alt="Logo FCV Citas"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.fcv-fallback-logo');
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="fcv-fallback-logo hidden flex items-center justify-center font-bold text-[#006066] text-xs">
                  FCV
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xl text-[#0d1c2e] tracking-tight">
                    FCV Citas
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#d4e3ff] text-[#001c3a] text-[11px] font-semibold uppercase tracking-wider">
                    Pacientes
                  </span>
                </div>
                <p className="text-xs text-[#3e494a] font-medium">
                  Portal del Paciente • Floridablanca y Bucaramanga
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <button
                onClick={onOpenSupport}
                className="text-xs text-[#006066] hover:text-[#004f55] transition-colors flex items-center gap-1 font-medium cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">help_outline</span>
                <span>Soporte</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="font-display font-semibold text-2xl sm:text-[30px] leading-tight text-[#0d1c2e] mb-1.5">
              Registro de Nuevo Paciente
            </h1>
            <p className="text-sm text-[#3e494a] leading-relaxed">
              Crea tu cuenta para agendar citas médicas generales, consulta especializada y estudios de laboratorio en nuestros centros médicos.
            </p>
          </div>

          {alert && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 transition-all ${
                alert.type === 'error'
                  ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30'
                  : 'bg-[#dce9ff] text-[#0d1c2e] border border-[#436088]/30'
              }`}
              role="alert"
            >
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-semibold mb-0.5">{alert.title}</span>
                <span className="text-xs leading-relaxed opacity-90">{alert.message}</span>
              </div>
              <button
                onClick={() => setAlert(null)}
                className="text-current hover:opacity-75 transition-opacity p-0.5"
                title="Cerrar notificación"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {isSuccess ? (
            <div className="flex flex-col items-center text-center py-10 px-4 bg-[#eff4ff] rounded-xl border border-[#dce9ff] animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-[#99f1f9] flex items-center justify-center text-[#002022] mb-4 shadow-sm">
                <span className="material-symbols-outlined text-[36px] text-[#006066]">check_circle</span>
              </div>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-[#0d1c2e] mb-2">
                ¡Cuenta creada exitosamente!
              </h2>
              <p className="text-sm text-[#3e494a] max-w-lg mb-6 leading-relaxed">
                Tu registro en FCV Citas fue completado. Ya puedes iniciar sesión para agendar tus citas médicas.
              </p>
              <button
                onClick={onGoToLogin}
                className="px-6 py-2.5 bg-[#006066] text-white font-semibold text-sm rounded-lg shadow-sm hover:bg-[#004f55] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Ir a Iniciar Sesión</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Nombres */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="nombres" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Nombres <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      person
                    </span>
                    <input
                      id="nombres"
                      name="nombres"
                      type="text"
                      value={formData.nombres}
                      onChange={handleChange}
                      placeholder="Ej. Carlos Andrés"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.nombres
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.nombres && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.nombres}</span>
                    </p>
                  )}
                </div>

                {/* Apellidos */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="apellidos" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Apellidos <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      badge
                    </span>
                    <input
                      id="apellidos"
                      name="apellidos"
                      type="text"
                      value={formData.apellidos}
                      onChange={handleChange}
                      placeholder="Ej. Rodríguez Gómez"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.apellidos
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.apellidos && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.apellidos}</span>
                    </p>
                  )}
                </div>

                {/* Tipo de Documento */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="tipoDocumento" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Tipo de Documento <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      credit_card
                    </span>
                    <select
                      id="tipoDocumento"
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleChange}
                      className={`w-full pl-9 pr-8 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border appearance-none cursor-pointer ${
                        errors.tipoDocumento
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    >
                      <option value="">Selecciona tipo de documento</option>
                      <option value="CC">Cédula de ciudadanía (CC)</option>
                      <option value="CE">Cédula de extranjería (CE)</option>
                      <option value="TI">Tarjeta de identidad (TI)</option>
                      <option value="PAS">Pasaporte (PAS)</option>
                    </select>
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute right-3 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  {errors.tipoDocumento && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.tipoDocumento}</span>
                    </p>
                  )}
                </div>

                {/* Número de Documento */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="numeroDocumento" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Número de Documento <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      pin
                    </span>
                    <input
                      id="numeroDocumento"
                      name="numeroDocumento"
                      type="text"
                      value={formData.numeroDocumento}
                      onChange={handleChange}
                      placeholder="Ej. 1098765432"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.numeroDocumento
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.numeroDocumento && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.numeroDocumento}</span>
                    </p>
                  )}
                </div>

                {/* Correo Electrónico */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="email" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Correo Electrónico <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      mail
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nombre@correo.com"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.email
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="telefono" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Teléfono <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      phone
                    </span>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="Ej. 315 123 4567"
                      className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.telefono
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                  </div>
                  {errors.telefono && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.telefono}</span>
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                      Contraseña <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <span className="text-[11px] text-[#6e797a]">Mínimo 8 caracteres</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      lock
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.password
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-[#6e797a] hover:text-[#0d1c2e] transition-colors p-0.5 cursor-pointer"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                {/* Confirmar Contraseña */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="confirmPassword" className="text-xs font-semibold text-[#3e494a] flex items-center gap-1">
                    Confirmar Contraseña <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined text-[18px] text-[#6e797a] absolute left-3 pointer-events-none">
                      lock_reset
                    </span>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg outline-none transition-all shadow-2xs border ${
                        errors.confirmPassword
                          ? 'border-[#ba1a1a] bg-[#ffdad6]/20 text-[#0d1c2e]'
                          : 'border-[#cbd5e1] bg-white text-[#0d1c2e] focus:border-[#006066] focus:ring-2 focus:ring-[#006066]/20'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[#6e797a] hover:text-[#0d1c2e] transition-colors p-0.5 cursor-pointer"
                      aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-[#ba1a1a] flex items-center gap-1 pt-0.5">
                      <span className="material-symbols-outlined text-[14px]">error</span>
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="p-3.5 bg-[#eff4ff] rounded-lg border border-[#dce9ff] flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#006066] shrink-0 mt-0.5">shield</span>
                <p className="text-xs text-[#3e494a] leading-relaxed">
                  Al registrarte aceptas el tratamiento de tus datos para gestión de citas médicas ambulatorias, conforme a la Ley 1581 de 2012 de Protección de Datos Personales de Colombia. Este es un laboratorio de formación: los datos son ficticios.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-6 bg-[#006066] text-white font-semibold text-sm sm:text-base rounded-lg shadow-sm hover:bg-[#004f55] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <span>Crear Cuenta de Paciente</span>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 pt-2 text-center text-sm text-[#3e494a]">
                  <span>¿Ya tienes una cuenta registrada?</span>
                  <button
                    type="button"
                    onClick={onGoToLogin}
                    className="font-semibold text-[#006066] hover:text-[#004f55] hover:underline transition-colors cursor-pointer"
                  >
                    Inicia sesión aquí
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="bg-[#eff4ff] border-t border-[#dce9ff] px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-[#3e494a]">
            <span className="material-symbols-outlined text-[16px] text-[#005f6f]">lock</span>
            <span>Conexión segura TLS 256-bit</span>
          </div>

          <p className="text-[11px] text-[#3e494a] text-center">
            FCV Citas • Floridablanca y Bucaramanga • Protección de datos personales Ley 1581 de 2012
          </p>

          <div className="flex items-center gap-1.5 text-xs text-[#3e494a]">
            <span className="material-symbols-outlined text-[16px] text-[#436088]">verified_user</span>
            <span>Certificado SSL FCV</span>
          </div>
        </div>
      </div>
    </div>
  );
};
