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
