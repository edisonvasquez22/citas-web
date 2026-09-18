import React from 'react';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ isOpen, onClose }) => {
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
        <div className="flex items-start justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-[#eff4ff] text-[#006066] flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">lock_reset</span>
          </div>
          <button
            className="text-[#6e797a] hover:text-[#0d1c2e] p-1 rounded-md hover:bg-[#eff4ff]"
            onClick={onClose}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <h3 className="font-display font-semibold text-[18px] text-[#0d1c2e]">
          Restablecer Contraseña
        </h3>
        <p className="text-[13px] text-[#3e494a] mt-1 mb-4 leading-relaxed">
          La recuperación de contraseña todavía no está disponible en este laboratorio; se habilitará en una próxima etapa del proyecto.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 px-3 bg-[#006066] hover:bg-[#0d7a82] text-white text-[13px] font-semibold rounded-lg transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};
