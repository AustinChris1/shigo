// Pure name matching, safe to use in the browser and on the server.
const tokens = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter((t) => t.length >= 2);

// Bank names come as "OBI ADAEZE CHIOMA"; people type "Ada Obi". A typed word counts when it starts an account-name word,
// in either direction (Ada/Adaeze). Two words must match, or every word when only one was typed.
export function nameTallies(typed: string, onAccount: string): boolean {
  const t = tokens(typed);
  const a = tokens(onAccount);
  if (t.length === 0 || a.length === 0) return false;
  const hits = t.filter((w) => a.some((x) => x.startsWith(w) || w.startsWith(x))).length;
  return t.length === 1 ? hits === 1 : hits >= 2;
}
