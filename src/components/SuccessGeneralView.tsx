import React from 'react';
import { UserSession } from '../types';
import { ConfirmedBooking } from './BookingView';
import { t } from '../i18n';

interface SuccessGeneralViewProps {
  session: UserSession;
  booking: ConfirmedBooking;
  onAgendarOtra: () => void;
  onVolverInicio: () => void;
}

export const SuccessGeneralView: React.FC<SuccessGeneralViewProps> = ({
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
        <div className="h-2.5 w-full bg-[#0d7a82]"></div>

        <div className="p-6 sm:p-10 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#99f1f9] text-[#006066] flex items-center justify-center mb-4 shadow-xs">
            <span className="material-symbols-outlined text-[36px] material-symbols-fill">check_circle</span>
          </div>

          <span className="px-3.5 py-1 rounded-full bg-[#0d7a82]/10 text-[#006066] text-xs font-bold tracking-wide uppercase">
            {t("¡Cita Médica Confirmada!")}
          </span>

          <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#0d1c2e] mt-2 mb-1.5">
            {t("Reserva Aprobada Exitosamente")}
          </h2>
          <p className="text-sm text-[#3e494a] max-w-xl">
            {t("Tu cita de")} <strong>{booking.especialidadNombre}</strong> {t(
              "ha sido reservada y aprobada automáticamente en el sistema central de agendas ambulatorias FCV."
            )}
          </p>

          <div className="w-full bg-[#eff4ff] border border-[#dce9ff] rounded-xl p-5 sm:p-6 my-6 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">{t("Código de Cita")}</span>
              <span className="text-lg font-headline text-[#006066] font-extrabold font-mono">#{result.citaId}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">{t("Paciente")}</span>
              <span className="text-sm font-semibold text-[#0d1c2e] block truncate">{session.email}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">{t("Sede")}</span>
              <span className="text-sm font-medium text-[#0d1c2e] block">{booking.sedeNombre}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">{t("Fecha y Hora")}</span>
              <span className="text-sm font-medium text-[#0d1c2e] block">
                {fecha} • {horaInicio} - {horaFin}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">{t("Profesional")}</span>
              <span className="text-sm font-medium text-[#0d1c2e] block">{booking.profesionalNombre}</span>
            </div>

            <div>
              <span className="text-[11px] text-[#6e797a] block uppercase font-bold tracking-wider">{t("Estado")}</span>
              <span className="text-sm font-semibold text-[#006066] block">{t("Aprobada")}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
            <button
              type="button"
              onClick={onAgendarOtra}
              className="w-full sm:flex-1 py-3 px-4 rounded-lg bg-[#0d7a82] hover:bg-[#006066] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              {t("Agendar Otra Cita")}
            </button>

            <button
              type="button"
              onClick={onVolverInicio}
              className="w-full sm:flex-1 py-3 px-4 rounded-lg bg-[#dce9ff] hover:bg-[#c9ddff] text-[#0d1c2e] text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              {t("Volver al Inicio")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
