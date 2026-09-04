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
  const shifted = new Date(Date.now() - CHECKLIST_DAY_ROLLOVER_HOUR * 60 * 60 * 1000);
  return formatBrazilDate(shifted);
}

function formatBrazilDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BRAZIL_TIMEZONE }).format(date);
}

/** Brazil-local date, as YYYY-MM-DD, `days` days before today. */
export function daysAgoISO(days: number): string {
  return formatBrazilDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
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
