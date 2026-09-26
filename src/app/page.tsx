import { redirect } from "next/navigation";
import { currentSeller } from "@/lib/session";
import { Landing } from "@/components/Landing";

export const dynamic = "force-dynamic";

// The note's ground colours the browser chrome on this route only.
export const viewport = { themeColor: "#0b3d2e", width: "device-width", initialScale: 1 };

// Signed-in sellers skip the story and go to their orders.
export default async function Home() {
  if (await currentSeller()) redirect("/app");
  return <Landing />;
}
