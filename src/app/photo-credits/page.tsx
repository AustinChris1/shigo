import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/Mark";
import { photos, creditsFor, landingPhotos } from "@/lib/photos";

export const metadata = { title: "Photo credits · Shigo" };

// Every photograph on the site, with its photographer. All are free to use under the Unsplash licence.
export default function PhotoCredits() {
  const used = creditsFor([...landingPhotos, photos.stall]);
  const all = [...landingPhotos, photos.stall].filter((p, i, a) => a.findIndex((q) => q.id === p.id) === i);
  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-(--muted)"><ArrowLeft size={16} aria-hidden="true" /> Home</Link>
      <div className="mt-6"><Wordmark size={30} /></div>
      <h1 className="font-display mt-6 text-3xl font-extrabold tracking-tight">Photo credits</h1>
      <p className="mt-2 text-(--muted)">The photographs on this site come from Unsplash and are free to use under the <a className="underline underline-offset-2" href="https://unsplash.com/license" target="_blank" rel="noreferrer">Unsplash licence</a>. Thank you to {used.length} photographers.</p>
      <ul className="mt-8 grid gap-3">
        {all.map((p) => (
          <li key={p.id} className="card flex items-start justify-between gap-4 p-4">
            <span>
              <span className="block font-semibold">{p.alt}</span>
              {p.place && <span className="text-sm text-(--muted)">{p.place}</span>}
            </span>
            <a className="shrink-0 text-sm underline underline-offset-2" href={`https://unsplash.com/@${p.user}`} target="_blank" rel="noreferrer">{p.by}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
