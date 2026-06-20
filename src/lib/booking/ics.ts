// Build a minimal RFC-5545 VEVENT as a `data:` URL for an <a download> — the
// success screen's "Add to calendar". Pure, client-importable. Instants are UTC
// ISO strings (the booking's startUtc/endUtc) stamped as UTC (Z).

export interface IcsEvent {
  title: string;
  location: string;
  startUtc: string; // ISO 8601
  endUtc: string; // ISO 8601
}

// "2026-06-18T09:00:00.000Z" → "20260618T090000Z"
function toIcsStamp(iso: string): string {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildIcsHref(event: IcsEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//orari//booking//EN",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeText(event.title)}`,
    `LOCATION:${escapeText(event.location)}`,
    `DTSTART:${toIcsStamp(event.startUtc)}`,
    `DTEND:${toIcsStamp(event.endUtc)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
