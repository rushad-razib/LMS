import { describe, expect, it } from "vitest";
import {
  addCalendarDays,
  firstOfMonthAhead,
  splitInstallmentAmounts,
  startOfUtcDay,
} from "./installments.util.js";

describe("splitInstallmentAmounts", () => {
  it("splits evenly when divisible", () => {
    expect(splitInstallmentAmounts(12000, 3)).toEqual([4000, 4000, 4000]);
    expect(splitInstallmentAmounts(12000, 6)).toEqual([
      2000, 2000, 2000, 2000, 2000, 2000,
    ]);
  });

  it("puts remainder on the first installment", () => {
    expect(splitInstallmentAmounts(12001, 3)).toEqual([4001, 4000, 4000]);
    expect(splitInstallmentAmounts(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it("handles free/zero", () => {
    expect(splitInstallmentAmounts(0, 3)).toEqual([0, 0, 0]);
  });
});

describe("installment date helpers", () => {
  it("computes first of following months and pay-by window", () => {
    const from = new Date(Date.UTC(2026, 2, 15)); // Mar 15
    const due2 = firstOfMonthAhead(from, 1);
    expect(due2.toISOString().slice(0, 10)).toBe("2026-04-01");
    expect(addCalendarDays(due2, 9).toISOString().slice(0, 10)).toBe("2026-04-10");
  });

  it("startOfUtcDay strips time", () => {
    const d = startOfUtcDay(new Date(Date.UTC(2026, 0, 1, 15, 30)));
    expect(d.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
