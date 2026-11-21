const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DISPLAY_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const TIME = /^(\d{2}):(\d{2})$/;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isRealDate(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  );
}

function parseDate(value: string): Date | null {
  const dateOnly = ISO_DATE.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    if (!isRealDate(year, month, day)) return null;
    return new Date(year, month - 1, day);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = parseDate(value);
  if (!date) return "—";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = parseDate(value);
  if (!date) return "—";
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = parseDate(value);
  if (!date) return "—";
  return `${formatDate(value)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function isoDateToDisplay(iso: string) {
  const match = ISO_DATE.exec(iso);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!isRealDate(year, month, day)) return "";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Empty string when the field is blank. `null` when the text is not a real dd/mm/yyyy date. */
export function displayToIsoDate(display: string): string | null {
  const trimmed = display.trim();
  if (!trimmed) return "";
  const match = DISPLAY_DATE.exec(trimmed);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!isRealDate(year, month, day)) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function isoDateTimeToParts(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [datePart = "", timePart = ""] = value.split("T");
  if (!isoDateToDisplay(datePart)) return { date: "", time: "" };
  const timeMatch = TIME.exec(timePart.slice(0, 5));
  return { date: datePart, time: timeMatch ? timeMatch[0] : "" };
}

export function partsToIsoDateTime(date: string, time: string) {
  if (!isoDateToDisplay(date) || !TIME.test(time)) return "";
  return `${date}T${time}`;
}
