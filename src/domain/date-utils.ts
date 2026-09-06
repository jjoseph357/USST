export function parseDateUTC(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseDateUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateUTC(date);
}

export function diffDays(startIso: string, endIso: string): number {
  const start = parseDateUTC(startIso);
  const end = parseDateUTC(endIso);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

export function formatDisplayDate(iso: string): string {
  const date = parseDateUTC(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function formatFullDisplayDate(iso: string): string {
  const date = parseDateUTC(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function isDateInRange(targetIso: string, startIso: string, endIso: string): boolean {
  return targetIso >= startIso && targetIso <= endIso;
}
