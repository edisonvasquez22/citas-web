export function formatDateTimeRange(isoStart: string, isoEnd: string): string {
  try {
    const dStart = new Date(isoStart);
    const dEnd = new Date(isoEnd);

    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const dayName = days[dStart.getDay()];
    const dayNum = dStart.getDate().toString().padStart(2, '0');
    const monthName = months[dStart.getMonth()];
    const year = dStart.getFullYear();

    const timeFormat = (d: Date) => {
      let hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    return `${dayName}, ${dayNum} ${monthName} ${year} • ${timeFormat(dStart)} - ${timeFormat(dEnd)}`;
  } catch {
    return `${isoStart} - ${isoEnd}`;
  }
}
