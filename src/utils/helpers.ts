export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(d.setDate(diff));
}

export function getNextMonday(date: Date): Date {
  const monday = getMonday(date);
  monday.setDate(monday.getDate() + 7);
  return monday;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getDayDate(weekStartDate: string, dayIndex: number): string {
  const monday = new Date(weekStartDate);
  const dayDate = new Date(monday);
  dayDate.setDate(monday.getDate() + dayIndex);
  return formatDate(dayDate.toISOString());
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
