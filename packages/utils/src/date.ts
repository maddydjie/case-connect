import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (isToday(d)) return `Today, ${format(d, 'hh:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'hh:mm a')}`;
  return formatDateTime(d);
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getSlotLabel(startTime: string, endTime: string): string {
  return `${startTime} - ${endTime}`;
}

export function isDuringWorkingHours(date: Date = new Date()): boolean {
  const hours = date.getHours();
  return hours >= 8 && hours < 20;
}
