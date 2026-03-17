export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Format a Date as YYYY-MM-DD using local timezone (not UTC)
function toLocalISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parse a YYYY-MM-DD string as local midnight (not UTC midnight)
function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getNextMonday(date: Date): Date {
  const monday = getMonday(date);
  monday.setDate(monday.getDate() + 7);
  return monday;
}

export function getMondayString(date: Date): string {
  return toLocalISODate(getMonday(date));
}

export function getNextMondayString(date: Date): string {
  return toLocalISODate(getNextMonday(date));
}

export function formatDate(dateString: string): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDayDate(weekStartDate: string, dayIndex: number): string {
  const monday = parseLocalDate(weekStartDate);
  monday.setDate(monday.getDate() + dayIndex);
  return formatDate(toLocalISODate(monday));
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
