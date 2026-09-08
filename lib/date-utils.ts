const BRAZIL_TIMEZONE = "America/Sao_Paulo";

/**
 * "Today" in Brazil local time, as YYYY-MM-DD.
 *
 * Vercel's Node runtime (and most servers) run in UTC, which is 3h ahead
 * of Brazil. `new Date().toISOString()` rolls over to the next calendar
 * day at 21:00 BRT — three hours before Brazilian local midnight — so
 * checklist completions (and any other "today"-scoped record) made in
 * the last few hours of the day were getting stamped with tomorrow's
 * date. This must be the single source of "today" for anything that
 * needs to agree with what a user in Brazil considers today.
 */
export function todayISO(): string {
  return formatBrazilDate(new Date());
}

const CHECKLIST_DAY_ROLLOVER_HOUR = 2;

/**
 * Same as todayISO(), but the checklist day only rolls over at 02:00 BRT
 * instead of midnight. Staff commonly close out a shift just after
 * midnight and still need to finish that shift's checklist during the
 * next couple hours, so "today's checklist" should still mean the
 * previous calendar day until 2am.
 */
export function checklistDayISO(): string {
  return checklistDayForInstant(new Date());
}

/** Same "checklist day" (02:00 BRT rollover) as checklistDayISO(), but for
 * an arbitrary instant instead of "now" — e.g. to check whether a record
 * timestamped earlier counts as belonging to today's checklist day. */
export function checklistDayForInstant(instant: Date): string {
  const shifted = new Date(instant.getTime() - CHECKLIST_DAY_ROLLOVER_HOUR * 60 * 60 * 1000);
  return formatBrazilDate(shifted);
}

function formatBrazilDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BRAZIL_TIMEZONE }).format(date);
}

/** Brazil-local date, as YYYY-MM-DD, `days` days before today. */
export function daysAgoISO(days: number): string {
  return formatBrazilDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
}

/**
 * Day of week for today in Brazil local time: 0=domingo..6=sábado (same
 * convention as Date.getDay()). Computed off todayISO()'s calendar date at
 * a fixed UTC noon anchor, so it's immune to any timezone shift — there's
 * no real "instant" involved in asking what weekday a calendar date is.
 */
export function todayWeekdayBrazil(): number {
  const [year, month, day] = todayISO().split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay();
}

/**
 * YYYY-MM-DD, `days` days before the given YYYY-MM-DD date — pure calendar
 * arithmetic on the date's own components (via Date.UTC/getUTCDate), not
 * "now". Deliberately does NOT go through formatBrazilDate: that reformats
 * an instant into Brazil's local date, which would shift this by the
 * UTC-3 offset since there's no real instant here, just a calendar date.
 */
export function daysBeforeISO(dateISO: string, days: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** "Bom dia" / "Boa tarde" / "Boa noite", based on Brazil local time. */
export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BRAZIL_TIMEZONE,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

/** Short Brazil-local date label, e.g. "qua, 4 set". */
export function todayShortLabel(): string {
  const label = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());
  return label.replace(/\./g, "");
}
