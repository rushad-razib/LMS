import { useEffect, useRef, useState } from "react";
import {
  displayToIsoDate,
  isoDateTimeToParts,
  isoDateToDisplay,
  partsToIsoDateTime,
} from "@/lib/dates";

type DateControlProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
};

function maskDate(raw: string) {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw.trim());
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function DateField({ value, onChange, className, id }: DateControlProps) {
  const [text, setText] = useState(() => isoDateToDisplay(value));
  const emittedRef = useRef(value);

  useEffect(() => {
    if (value === emittedRef.current) return;
    emittedRef.current = value;
    setText(isoDateToDisplay(value));
  }, [value]);

  return (
    <input
      id={id}
      inputMode="numeric"
      autoComplete="off"
      placeholder="dd/mm/yyyy"
      className={className}
      value={text}
      onChange={(e) => {
        const next = maskDate(e.target.value);
        setText(next);
        const iso = next === "" ? "" : (displayToIsoDate(next) ?? "");
        if (iso === emittedRef.current) return;
        emittedRef.current = iso;
        onChange(iso);
      }}
    />
  );
}

export function DateTimeField({ value, onChange, className, id }: DateControlProps) {
  const initial = isoDateTimeToParts(value);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const emittedRef = useRef(partsToIsoDateTime(initial.date, initial.time));

  useEffect(() => {
    if (value === emittedRef.current) return;
    const next = isoDateTimeToParts(value);
    emittedRef.current = partsToIsoDateTime(next.date, next.time);
    setDate(next.date);
    setTime(next.time);
  }, [value]);

  function commit(nextDate: string, nextTime: string) {
    const time = /^(\d{2}):(\d{2})/.exec(nextTime)?.[0] ?? "";
    setDate(nextDate);
    setTime(time);
    const emitted = partsToIsoDateTime(nextDate, time);
    if (emitted === emittedRef.current) return;
    emittedRef.current = emitted;
    onChange(emitted);
  }

  return (
    <span className="flex flex-wrap gap-2">
      <DateField id={id} className={className} value={date} onChange={(next) => commit(next, time)} />
      <input
        type="time"
        step={60}
        className={className}
        value={time}
        onChange={(e) => commit(date, e.target.value)}
      />
    </span>
  );
}
