import { ecobankRail } from "@/lib/rails/ecobank";
import { handleWebhook } from "@/lib/rails/handle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return handleWebhook(ecobankRail, req);
}
