import { getLanguage } from '../i18n';

const NOMBRES = {
  ES: {
    dias: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  },
  EN: {
    dias: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    meses: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
};

export function formatDateTimeRange(isoStart: string, isoEnd: string): string {
  try {
    const dStart = new Date(isoStart);
    const dEnd = new Date(isoEnd);
    const { dias, meses } = NOMBRES[getLanguage()];

    const timeFormat = (d: Date) => {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const dayNum = dStart.getDate().toString().padStart(2, '0');
    return `${dias[dStart.getDay()]}, ${dayNum} ${meses[dStart.getMonth()]} ${dStart.getFullYear()} • ${timeFormat(dStart)} - ${timeFormat(dEnd)}`;
  } catch {
    return `${isoStart} - ${isoEnd}`;
  }
}
