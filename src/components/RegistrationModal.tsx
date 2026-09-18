import React from 'react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#233144]/40 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl relative border border-[#e6eeff] animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-lg bg-[#d4e3ff] text-[#001c3a] flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[22px]">badge</span>
        </div>

        <h3 className="font-display font-semibold text-[18px] text-[#0d1c2e]">
          Registro de paciente
        </h3>

        <p className="text-[13px] text-[#3e494a] mt-2 mb-4 leading-relaxed">
          Puedes crear tu cuenta de paciente ingresando tus datos personales (nombres, documento, email, teléfono y contraseña). La pantalla de registro completa se habilitará próximamente; mientras tanto, tu cuenta puede crearse contra{' '}
          <code className="text-[#0d1c2e] bg-[#eff4ff] px-1 rounded">POST /api/auth/register</code>.
        </p>

        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#006066] hover:bg-[#0d7a82] text-white text-[14px] font-semibold rounded-lg transition-colors cursor-pointer"
            type="button"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
