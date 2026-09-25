import React from 'react';
import { UserSession } from '../types';
import { ConfirmedBooking } from './BookingView';

interface PendingEspecializadaViewProps {
  session: UserSession;
  booking: ConfirmedBooking;
  onAgendarOtra: () => void;
  onVolverInicio: () => void;
}

export const PendingEspecializadaView: React.FC<PendingEspecializadaViewProps> = ({
  session,
  booking,
  onAgendarOtra,
  onVolverInicio
}) => {
  const { result } = booking;
  const fecha = result.inicio.split('T')[0];
  const horaInicio = result.inicio.split('T')[1]?.slice(0, 5);
  const horaFin = result.fin.split('T')[1]?.slice(0, 5);

  return (
    <div className="w-full max-w-3xl mx-auto my-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-[#e6eeff] overflow-hidden">
        <div className="h-2.5 w-full bg-[#35527a]"></div>

        <div className="p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#b4d0ff] text-[#35527a] flex items-center justify-center mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[36px] material-symbols-fill">pending_actions</span>
          </div>

          <span className="px-3.5 py-1 rounded-full bg-[#35527a]/15 text-[#35527a] text-xs font-bold tracking-wide uppercase">
            Solicitud Enviada • En espera de aprobación médica
          </span>

          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#0d1c2e] mt-2 mb-1.5">
            Solicitud Radicada
          </h2>
          <p className="text-sm text-[#3e494a] max-w-xl">
            Tu solicitud de <strong>{booking.especialidadNombre}</strong> quedó registrada y el horario elegido
            está retenido mientras un administrador la revisa.
          </p>

          <div className="w-full bg-[#eff4ff] border border-[#dce9ff] rounded-xl p-5 sm:p-6 my-6 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">Número de Solicitud</span>
              <span className="text-lg font-headline text-[#35527a] font-extrabold font-mono">#{result.citaId}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">Paciente</span>
              <span className="text-sm font-semibold text-[#0d1c2e] block truncate">{session.email}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">Especialidad</span>
              <span className="text-sm font-medium text-[#0d1c2e] block">{booking.especialidadNombre}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">Turno Retenido</span>
              <span className="text-sm font-medium text-[#0d1c2e] block">
                {fecha} • {horaInicio} - {horaFin}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">Especialista</span>
              <span className="text-sm font-medium text-[#0d1c2e] block">{booking.profesionalNombre}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">Estado Actual</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#35527a] mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#35527a] animate-pulse"></span>
                Pendiente de aprobación
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={onAgendarOtra}
              className="w-full sm:flex-1 py-3 px-4 rounded-lg bg-[#35527a] hover:bg-[#233144] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Agendar Otra Cita
            </button>

            <button
              type="button"
              onClick={onVolverInicio}
              className="w-full sm:flex-1 py-3 px-4 rounded-lg bg-[#dce9ff] hover:bg-[#c9ddff] text-[#0d1c2e] text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
