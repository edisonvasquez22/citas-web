import React from 'react';

interface EmptyStateViewProps {
  onSuggestNextDate: () => void;
  onReset: () => void;
}

export const EmptyStateView: React.FC<EmptyStateViewProps> = ({ onSuggestNextDate, onReset }) => {
  return (
    <div className="bg-white rounded-xl border border-[#e6eeff] p-8 sm:p-12 flex flex-col items-center text-center my-2">
      <div className="w-16 h-16 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#6e797a] mb-4">
        <span className="material-symbols-outlined text-[36px]">event_busy</span>
      </div>
      <h3 className="font-headline font-bold text-lg sm:text-xl text-[#0d1c2e]">
        No hay turnos disponibles para esta fecha
      </h3>
      <p className="text-sm text-[#3e494a] max-w-md mt-1.5 mb-6 leading-relaxed">
        La agenda del profesional en la sede y especialidad indicadas está completa para el día seleccionado.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onSuggestNextDate}
          className="px-5 py-2.5 rounded-lg bg-[#0d7a82] hover:bg-[#006066] text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-xs"
        >
          <span className="material-symbols-outlined text-[18px]">fast_forward</span>
          Probar el día siguiente
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0d1c2e] text-sm font-semibold transition-colors"
        >
          Ver cualquier profesional
        </button>
      </div>
    </div>
  );
};
