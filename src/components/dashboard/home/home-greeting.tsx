import * as React from "react";

export interface HomeGreetingProps {
  firstName: string | null;
  bookingsToday: number;
}

function pluralize(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

// Header: friendly greeting + today's booking count. The greeting drops when
// the user has no first name (no awkward "Hello, ,").
export function HomeGreeting({
  firstName,
  bookingsToday,
}: HomeGreetingProps): React.JSX.Element {
  const headline = firstName ? `Hello, ${firstName}` : "Hello";
  return (
    <header className="mb-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-text-muted">
        Today
      </p>
      <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.02em] text-text">
        {headline}
      </h1>
      <p className="mt-1 text-[14px] text-text-muted">
        {bookingsToday === 0
          ? "No bookings today."
          : `${pluralize(bookingsToday, "booking", "bookings")} today.`}
      </p>
    </header>
  );
}
