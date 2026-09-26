import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { Landing } from "@/components/Landing";

export const dynamic = "force-dynamic";

// Signed-in sellers skip the story and go to their orders.
export default async function Home() {
  if (await currentSeller()) redirect("/app");
  return <Landing />;
}
