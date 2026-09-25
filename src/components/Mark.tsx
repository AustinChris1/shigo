// The Shigo mark: the account is a box with a slot; the coin is outside until the bank confirms, then inside.
export type MarkState = "pending" | "entered" | "mono";

export function Mark({ size = 24, state = "entered", animate = false, className = "" }: { size?: number; state?: MarkState; animate?: boolean; className?: string }) {
  const ink = "currentColor";
  const coin = state === "mono" ? ink : state === "entered" ? "var(--green)" : "var(--amber)";
  const cy = state === "pending" ? 10 : 41;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path d="M20 24 H17 A9 9 0 0 0 8 33 V49 A9 9 0 0 0 17 58 H47 A9 9 0 0 0 56 49 V33 A9 9 0 0 0 47 24 H44" stroke={ink} strokeWidth="6" strokeLinecap="round" />
      <path d="M20 24 H44" stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy={cy} r="9" fill={coin} className={animate ? "mark-coin-drop" : undefined} />
    </svg>
  );
}

export function Wordmark({ size = 28, state = "entered" }: { size?: number; state?: MarkState }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark size={size} state={state} />
      <span className="font-display font-extrabold tracking-tight" style={{ fontSize: size * 0.95, lineHeight: 1 }}>
        Shigo
      </span>
    </span>
  );
}
