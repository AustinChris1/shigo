export const naira = (kobo: number) =>
  "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: kobo % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });

export const toKobo = (nairaInput: string | number) => {
  const n = typeof nairaInput === "number" ? nairaInput : parseFloat(String(nairaInput).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) throw new Error("enter a valid amount");
  return Math.round(n * 100);
};

// Order references: short, unambiguous (no 0/O, 1/I), easy to type into a narration box.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function newReference() {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return `SG-${s}`;
}
