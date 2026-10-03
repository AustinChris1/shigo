// Small bank logos bundled with the site (public/banks, about 22 KB for all), so they show on every screen and
// phone, in the browser or the Android app. Sources, fetched 3 Oct 2026: OPay's Google Play app icon; the others
// are each bank's website icon via Google's favicon service. Access Bank had no usable one, so it gets initials.
const LOGOS: Record<string, string> = {
  "team.opay.pay": "/banks/opay.webp",
  "com.moniepoint.personal": "/banks/moniepoint.png",
  "com.moniepoint.business": "/banks/moniepoint.png",
  "com.transsnet.palmpay": "/banks/palmpay.png",
  "com.kudabank.app": "/banks/kuda.png",
  "com.app.ecobank": "/banks/ecobank.png",
  "com.ecobank.mobileapp5": "/banks/ecobank.png",
  "com.ecobankbusiness": "/banks/ecobank.png",
  "com.gtbank.gtworldv1": "/banks/gtbank.png",
  "com.zenithBank.eazymoney": "/banks/zenith.png",
  "com.firstbank.firstmobile": "/banks/firstbank.png",
  "com.wemabank.alat.prod": "/banks/alat.png",
  "com.uba.vericash": "/banks/uba.png",
  "com.fidelitybank.mobile": "/banks/fidelity.png",
};

const initials = (label: string) => {
  const words = label.replace(/[^A-Za-z ]/g, " ").split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : label.slice(0, 2)).toUpperCase();
};

export function BankBadge({ pkg, label, size = 36 }: { pkg: string; label: string; size?: number }) {
  const logo = LOGOS[pkg];
  const box = { width: size, height: size };
  if (logo) {
    return (
      <span title={label} style={box} className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
        {/* Tiny static logo; next/image would add a request for nothing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={label} width={size} height={size} loading="lazy" className="size-full object-contain" />
      </span>
    );
  }
  return (
    <span title={label} aria-label={label} style={{ ...box, fontSize: size * 0.36 }} className="grid shrink-0 place-items-center rounded-xl border border-(--line) bg-(--bg-2) font-bold text-(--muted)">
      {initials(label)}
    </span>
  );
}
