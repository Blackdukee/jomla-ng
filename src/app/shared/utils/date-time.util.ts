export function normalizeUtc(d: string): string {
  return d.includes('Z') || /[+-]\d{2}:\d{2}$/.test(d)
    ? d
    : d.replace(' ', 'T').replace(/(\.\d+)?$/, '') + 'Z';
}

export function parseUtcDate(d: string | null | undefined): Date | null {
  if (!d) return null;
  try {
    const date = new Date(normalizeUtc(d));
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function formatCairoDate(
  d: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseUtcDate(d);
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    }).format(date);
  } catch {
    return '';
  }
}

export function formatCairoDateTime(
  d: string | null | undefined,
  includeYear = false
): string {
  const date = parseUtcDate(d);
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      month: 'short',
      day: 'numeric',
      ...(includeYear ? { year: 'numeric' } : {}),
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return '';
  }
}
