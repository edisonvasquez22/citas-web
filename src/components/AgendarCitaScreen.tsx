import React, { useState } from 'react';
import { UserSession } from '../types';
import { BookingView, ConfirmedBooking } from './BookingView';
import { SuccessGeneralView } from './SuccessGeneralView';
import { PendingEspecializadaView } from './PendingEspecializadaView';

interface AgendarCitaScreenProps {
  session: UserSession;
  onVolverInicio: () => void;
}

type Vista = 'formulario' | 'confirmada';

/** HU-013/HU-014/HU-015: agenda una cita real contra citas-api. */
export const AgendarCitaScreen: React.FC<AgendarCitaScreenProps> = ({ session, onVolverInicio }) => {
  const [vista, setVista] = useState<Vista>('formulario');
  const [ultimaReserva, setUltimaReserva] = useState<ConfirmedBooking | null>(null);
  // key fuerza a BookingView a remontarse (reinicia filtros/estado) al agendar otra cita.
  const [formKey, setFormKey] = useState(0);

  const handleConfirmed = (booking: ConfirmedBooking) => {
    setUltimaReserva(booking);
    setVista('confirmada');
  };

  const handleAgendarOtra = () => {
    setUltimaReserva(null);
    setVista('formulario');
    setFormKey((k) => k + 1);
  };

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
      {vista === 'formulario' && <BookingView key={formKey} session={session} onConfirmed={handleConfirmed} />}

      {vista === 'confirmada' && ultimaReserva && ultimaReserva.tipo === 'GENERAL' && (
        <SuccessGeneralView
          session={session}
          booking={ultimaReserva}
          onAgendarOtra={handleAgendarOtra}
          onVolverInicio={onVolverInicio}
        />
      )}

      {vista === 'confirmada' && ultimaReserva && ultimaReserva.tipo === 'ESPECIALIZADA' && (
        <PendingEspecializadaView
          session={session}
          booking={ultimaReserva}
          onAgendarOtra={handleAgendarOtra}
          onVolverInicio={onVolverInicio}
        />
      )}
    </div>
  );
};
