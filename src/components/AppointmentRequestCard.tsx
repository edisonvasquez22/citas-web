import React from 'react';
import { AdminAppointmentApi } from '../types';
import { formatDateTimeRange } from '../utils/dateFormatter';

interface AppointmentRequestCardProps {
  appointment: AdminAppointmentApi;
  sedeNombre: string;
  especialidadNombre: string;
  especialidadDuracionMinutos: number | null;
  profesionalNombre: string;
  isProcessing: boolean;
  onApprove: (citaId: number) => void;
  onRejectClick: (appointment: AdminAppointmentApi) => void;
}

export const AppointmentRequestCard: React.FC<AppointmentRequestCardProps> = ({
  appointment,
  sedeNombre,
  especialidadNombre,
  especialidadDuracionMinutos,
  profesionalNombre,
  isProcessing,
  onApprove,
  onRejectClick
}) => {
  const dateText = formatDateTimeRange(appointment.inicio, appointment.fin);

  return (
    <article
      className={`group relative flex flex-col justify-between rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-[#e6eeff] ${
        isProcessing ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-[#006066] to-[#0d7a82]"></div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono text-[11px] text-[#436088] font-bold uppercase tracking-wider">
              SOLICITUD #{appointment.citaId}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffeed9] text-[#7a4100] text-[12px] font-semibold">
              <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
              <span>REQUESTED</span>
            </span>
          </div>

          <div className="mb-4 p-3 rounded-lg bg-[#eff4ff] flex items-center gap-2.5 border border-[#dce9ff]/60">
            <div className="w-8 h-8 rounded-full bg-[#dce9ff] flex items-center justify-center text-[#006066] shrink-0">
              <span className="material-symbols-outlined text-[17px]">person_outline</span>
            </div>
            <div>
              <span className="text-[15px] font-bold text-[#0d1c2e] font-display block">
                Paciente #{appointment.pacienteUsuarioId}
              </span>
              <span className="block text-[11px] text-[#6e797a]">Identificador único asistencial</span>
            </div>
          </div>

          <div className="space-y-3 pt-1 pb-3 text-[#0d1c2e]">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#436088] text-[18px] shrink-0 mt-0.5">location_on</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#3e494a] font-medium">Sede Asistencial</span>
                <span className="text-[14px] font-semibold text-[#0d1c2e] truncate block" title={sedeNombre}>
                  {sedeNombre}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#006066] text-[18px] shrink-0 mt-0.5">medical_services</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#3e494a] font-medium">Especialidad Solicitada</span>
                <span className="text-[14px] font-semibold text-[#0d1c2e]">
                  {especialidadNombre}
                  {especialidadDuracionMinutos !== null && (
                    <span className="font-normal text-[#436088] text-[12px]"> ({especialidadDuracionMinutos} min)</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#436088] text-[18px] shrink-0 mt-0.5">badge</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#3e494a] font-medium">Especialista Asignado</span>
                <span className="text-[14px] font-semibold text-[#0d1c2e]">{profesionalNombre}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-lg bg-[#eff4ff]/80 border border-[#d5e3fc]/60">
              <span className="material-symbols-outlined text-[#006066] text-[18px] shrink-0 mt-0.5">calendar_clock</span>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] text-[#3e494a] font-medium">Horario Solicitado</span>
                <span className="text-[13px] font-semibold text-[#0d1c2e] block">{dateText}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#e6eeff] flex items-center gap-3">
          <button
            type="button"
            onClick={() => onRejectClick(appointment)}
            disabled={isProcessing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#fff5f5] hover:bg-[#fee2e2] text-[#ba1a1a] text-[14px] font-semibold transition active:scale-95 border border-[#ffdad6] disabled:opacity-60 disabled:cursor-not-allowed"
            title="Rechazar solicitud con motivo justificado"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            <span>Rechazar</span>
          </button>

          <button
            type="button"
            onClick={() => onApprove(appointment.citaId)}
            disabled={isProcessing}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#006066] hover:bg-[#0d7a82] text-white text-[14px] font-semibold shadow-sm transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            title="Aprobar y confirmar cita en agenda"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{isProcessing ? 'Procesando...' : 'Aprobar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
};
