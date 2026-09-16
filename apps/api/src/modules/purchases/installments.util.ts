/** Split course price into equal installments; remainder BDT goes on the first. */
export function splitInstallmentAmounts(totalBdt: number, months: number): number[] {
  if (!Number.isInteger(totalBdt) || totalBdt < 0) {
    throw new Error("totalBdt must be a non-negative integer");
  }
  if (!Number.isInteger(months) || months < 1) {
    throw new Error("months must be a positive integer");
  }
  const base = Math.floor(totalBdt / months);
  const rem = totalBdt % months;
  return Array.from({ length: months }, (_, i) => (i === 0 ? base + rem : base));
}

export function addCalendarDays(date: Date, days: number): Date {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** First day of the calendar month `monthsAhead` after `from` (UTC date parts). */
export function firstOfMonthAhead(from: Date, monthsAhead: number): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + monthsAhead, 1));
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function parseDateInput(value: string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }
  return d;
}
