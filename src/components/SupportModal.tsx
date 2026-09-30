import React, { useState } from 'react';
import { t } from '../i18n';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'faq'>('contact');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative border border-[#e6eeff] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#006066] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">contact_support</span>
            </div>
            <div>
              <h3 className="font-display font-semibold text-[18px] text-[#0d1c2e]">
                {t("Centro de Soporte Institucional")}
              </h3>
              <p className="text-[12px] text-[#3e494a]">
                {t("Fundación Cardiovascular • Floridablanca")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6e797a] hover:text-[#0d1c2e] p-1 rounded-md hover:bg-[#eff4ff]"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#eff4ff] p-1 rounded-lg mb-4 text-[13px] font-medium">
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              activeTab === 'contact' ? 'bg-white text-[#006066] shadow-xs font-semibold' : 'text-[#3e494a]'
            }`}
          >
            {t("Canales de Contacto")}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-1.5 rounded-md transition-all ${
              activeTab === 'faq' ? 'bg-white text-[#006066] shadow-xs font-semibold' : 'text-[#3e494a]'
            }`}
          >
            {t("Preguntas Frecuentes")}
          </button>
        </div>

        {activeTab === 'contact' ? (
          <div className="space-y-3 text-[13px]">
            <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#e6eeff] flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#006066] mt-0.5">call</span>
              <div>
                <p className="font-semibold text-[#0d1c2e]">{t("Mesa de Ayuda de Citas")}</p>
                <p className="text-[#3e494a]">{t("+57 (607) 639-6780 ext. 4200 / 4210")}</p>
                <p className="text-[11px] text-[#6e797a]">{t("Lunes a Viernes: 06:00 - 20:00 | Sábados: 07:00 - 13:00")}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#e6eeff] flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#006066] mt-0.5">mail</span>
              <div>
                <p className="font-semibold text-[#0d1c2e]">{t("Correo Electrónico Oficial")}</p>
                <p className="text-[#006066] font-medium">{t("soporte.citas@fcv.org")}</p>
                <p className="text-[11px] text-[#6e797a]">{t("Respuesta prioritaria en menos de 2 horas hábiles")}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#f8f9ff] border border-[#e6eeff] flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-[#006066] mt-0.5">location_on</span>
              <div>
                <p className="font-semibold text-[#0d1c2e]">{t("Ubicación Presencial")}</p>
                <p className="text-[#3e494a]">{t(
                  "Torre de Docencia e Investigación Médica, Piso 4, Laboratorios FCV. Floridablanca, Santander."
                )}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-[13px] max-h-[260px] overflow-y-auto pr-1">
            <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-[#e6eeff]">
              <p className="font-semibold text-[#0d1c2e] mb-1">
                {t("¿Cómo creo mi cuenta de paciente?")}
              </p>
              <p className="text-[#3e494a] text-[12px]">
                {t("Desde la pantalla de inicio de sesión, usa el enlace \"Regístrate aquí\" e ingresa tus datos personales, documento y contraseña.")}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-[#f8f9ff] border border-[#e6eeff]">
              <p className="font-semibold text-[#0d1c2e] mb-1">
                {t("¿Olvidé mi contraseña, qué hago?")}
              </p>
              <p className="text-[#3e494a] text-[12px]">
                {t("En la pantalla de inicio de sesión usa \"¿Olvidaste tu contraseña?\": solicitas un token con tu correo y luego defines una contraseña nueva.")}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-[#006066] hover:bg-[#0d7a82] text-white text-[14px] font-semibold rounded-lg transition-colors cursor-pointer"
          type="button"
        >
          {t("Cerrar")}
        </button>
      </div>
    </div>
  );
};
