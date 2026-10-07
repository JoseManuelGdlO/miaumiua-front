export interface FormatHourOptions {
  compact?: boolean;
}

/**
 * Convierte hora 24h (0-23) a formato 12h legible.
 * compact: true → "9am", "5pm" | compact: false → "9 am", "5 pm"
 */
export function formatHour24To12(hour24: number, options: FormatHourOptions = {}): string {
  const { compact = false } = options;
  let h = hour24 > 12 ? hour24 - 12 : hour24;
  if (h === 0) h = 12;
  const ampm = hour24 >= 12 ? 'pm' : 'am';
  if (compact) {
    return `${h}${ampm}`;
  }
  return `${h} ${ampm}`;
}

/**
 * Parsea entrada en formato 12h (o número 24h) a entero 0-23.
 * Acepta: "9 am", "9am", "9:00 am", "5 pm", "17"
 */
export function parseHour12To24(input: string): number | null {
  const trimmed = input.trim().toLowerCase().replace(/\./g, '');
  if (!trimmed) return null;

  // Número entero 0-23 (formato 24h como fallback)
  if (/^\d{1,2}$/.test(trimmed)) {
    const h = parseInt(trimmed, 10);
    if (h >= 0 && h <= 23) return h;
    return null;
  }

  const match = trimmed.match(/^(\d{1,2})(?::\d{2})?\s*(am|pm)$/);
  if (!match) return null;

  let hour = parseInt(match[1], 10);
  const period = match[2];

  if (hour < 1 || hour > 12) return null;

  if (period === 'am') {
    if (hour === 12) hour = 0;
  } else {
    if (hour !== 12) hour += 12;
  }

  if (hour < 0 || hour > 23) return null;
  return hour;
}
