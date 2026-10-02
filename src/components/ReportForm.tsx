"use client";

import { useState } from "react";
import { createReportAction } from "@/lib/actions";

// Phone photos are 3 to 5 MB; uploads over 1 MB fail and cost the seller data. Shrink to a readable JPEG first.
const MAX_EDGE = 1280;
const QUALITY = 0.72;

async function shrink(f: File): Promise<string> {
  const url = URL.createObjectURL(f);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const kb = (dataUrl: string) => Math.round((dataUrl.length * 3) / 4 / 1024);

export function ReportForm({ orderId }: { orderId: string }) {
  const [img, setImg] = useState<string>("");
  const [error, setError] = useState<string>("");

  const onFile = async (f: File | undefined) => {
    setError("");
    if (!f) return setImg("");
    try {
      const small = await shrink(f);
      if (kb(small) > 700) throw new Error("too big");
      setImg(small);
    } catch {
      setImg("");
      setError("Could not use that picture. Try a screenshot instead.");
    }
  };

  return (
    <form action={createReportAction} className="card space-y-4 p-4">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="imageDataUrl" value={img} />
      <div>
        <label className="label" htmlFor="shot">Photo or screenshot of what they showed you</label>
        <input id="shot" type="file" accept="image/*" capture="environment" className="input" onChange={(e) => onFile(e.target.files?.[0])} />
        {/* A local data-URL preview; next/image adds nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt="receipt shown" className="mt-2 max-h-60 rounded-lg border border-(--line)" />}
        {img && <p className="mt-1 text-xs text-(--muted)">Saved small ({kb(img)} KB) to spare your data.</p>}
        {error && <p className="form-error mt-1 text-sm">{error}</p>}
      </div>
      <div>
        <label className="label" htmlFor="note">What happened</label>
        <textarea id="note" name="note" className="input" rows={3} placeholder="Customer showed an OPay receipt for 4,500 at 2:10pm. Nothing entered." />
      </div>
      <button className="btn btn-primary w-full" type="submit">Save report</button>
      <p className="text-xs text-(--muted)">Stays on your account only. You choose whether to send it to your bank.</p>
    </form>
  );
}
