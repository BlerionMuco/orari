// Pure view helpers for the booking wizard — no DB, no IO, client-importable.
// They shape engine output for rendering and never recompute instants from
// local labels (invariant 2): `startUtc` is carried through verbatim.

import type { AvailabilitySlot } from "./types";

export interface DaySlots {
  isoDate: string; // business-local "YYYY-MM-DD"
  slots: AvailabilitySlot[]; // ordered by start instant
}

// Group flat availability slots into ordered business-local days, each day's
// chips ordered by start instant. Days with no slots never appear (the engine
// only emits available slots — deliberate divergence from greyed-out mockups).
export function groupSlotsByDay(slots: AvailabilitySlot[]): DaySlots[] {
  const byDay = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const bucket = byDay.get(slot.isoDate);
    if (bucket) bucket.push(slot);
    else byDay.set(slot.isoDate, [slot]);
  }

  return [...byDay.keys()]
    .sort() // ISO dates sort lexicographically = chronologically
    .map((isoDate) => ({
      isoDate,
      slots: [...(byDay.get(isoDate) ?? [])].sort((a, b) =>
        a.startUtc < b.startUtc ? -1 : a.startUtc > b.startUtc ? 1 : 0,
      ),
    }));
}

export type PartOfDay = "Morning" | "Afternoon" | "Evening";

export interface SlotGroup {
  title: PartOfDay;
  slots: AvailabilitySlot[];
}

// Business-local hour → part of day. Morning < 12:00, Afternoon < 17:00, else
// Evening (mirrors the design's Morning/Afternoon/Evening grouping).
export function partOfDay(localHour: number): PartOfDay {
  if (localHour < 12) return "Morning";
  if (localHour < 17) return "Afternoon";
  return "Evening";
}

const PART_ORDER: readonly PartOfDay[] = ["Morning", "Afternoon", "Evening"];

// Group ONE day's slots into Morning/Afternoon/Evening (in that order, empty
// parts omitted), each ordered by start instant. The hour is read from the
// business-local label, not recomputed from the instant (invariant 2).
export function groupSlotsByPartOfDay(slots: AvailabilitySlot[]): SlotGroup[] {
  const byPart = new Map<PartOfDay, AvailabilitySlot[]>();
  for (const slot of slots) {
    const hour = Number(slot.localTimeLabel.slice(0, 2));
    const part = partOfDay(hour);
    const bucket = byPart.get(part);
    if (bucket) bucket.push(slot);
    else byPart.set(part, [slot]);
  }
  return PART_ORDER.filter((p) => byPart.has(p)).map((title) => ({
    title,
    slots: [...(byPart.get(title) ?? [])].sort((a, b) =>
      a.startUtc < b.startUtc ? -1 : a.startUtc > b.startUtc ? 1 : 0,
    ),
  }));
}

// Currency-aware price rendering for amounts stored as MINOR units (see the
// `price_cents` reinterpretation). Deterministic (no Intl, so tests don't drift
// across ICU versions). Unknown currencies fall back to 2 decimals + the code.
interface CurrencyFormat {
  exponent: number; // minor-unit digits: ALL=0 (whole Lek), EUR/USD=2
  symbol: string;
  symbolBefore: boolean;
}

const CURRENCIES: Record<string, CurrencyFormat> = {
  ALL: { exponent: 0, symbol: "Lek", symbolBefore: false },
  EUR: { exponent: 2, symbol: "€", symbolBefore: true },
  USD: { exponent: 2, symbol: "$", symbolBefore: true },
  GBP: { exponent: 2, symbol: "£", symbolBefore: true },
};

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatPrice(amountMinor: number, currency: string): string {
  if (amountMinor === 0) return "Free";

  const code = currency.toUpperCase();
  const fmt: CurrencyFormat = CURRENCIES[code] ?? {
    exponent: 2,
    symbol: code,
    symbolBefore: true,
  };

  const negative = amountMinor < 0;
  const abs = Math.abs(Math.round(amountMinor));
  const divisor = 10 ** fmt.exponent;
  const whole = Math.floor(abs / divisor);
  const frac = abs % divisor;

  let amount = groupThousands(whole.toString());
  if (fmt.exponent > 0) amount += `.${frac.toString().padStart(fmt.exponent, "0")}`;
  if (negative) amount = `-${amount}`;

  return fmt.symbolBefore ? `${fmt.symbol}${amount}` : `${amount} ${fmt.symbol}`;
}
