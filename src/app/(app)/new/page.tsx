import Link from "next/link";
import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { NewOrderForm } from "@/components/NewOrderForm";

export default async function NewOrder() {
  if (!(await currentSeller())) redirect("/login");
  return (
    <main className="space-y-6">
      <header>
        <Link href="/app" className="text-sm text-(--muted)">← Orders</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Collect a payment</h1>
      </header>

      <NewOrderForm />
    </main>
  );
}
