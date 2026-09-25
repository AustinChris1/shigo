import { currentSeller } from "@/lib/session";
import { subscribe } from "@/lib/events";

// SSE: the phone holds one connection and hears order.paid the instant the matcher settles.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const seller = await currentSeller();
  if (!seller) return new Response("unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      send({ type: "hello" });
      unsubscribe = subscribe(seller.id, send);
      ping = setInterval(() => controller.enqueue(encoder.encode(`: ping\n\n`)), 25000);
    },
    cancel() {
      unsubscribe();
      if (ping) clearInterval(ping);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
