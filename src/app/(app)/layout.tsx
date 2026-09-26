import { Nav } from "@/components/Nav";
import { currentSeller } from "@/lib/session";

// The seller's app: phone-width column with the bottom nav when signed in.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const seller = await currentSeller();
  return (
    <>
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">{children}</div>
      {seller && <Nav />}
    </>
  );
}
