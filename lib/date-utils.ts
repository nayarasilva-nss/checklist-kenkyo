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
  return new Intl.DateTimeFormat("en-CA", { timeZone: BRAZIL_TIMEZONE }).format(new Date());
}
