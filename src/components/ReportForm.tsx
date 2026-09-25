"use client";

import { useState } from "react";
import { createReportAction } from "@/lib/actions";

export function ReportForm({ orderId }: { orderId: string }) {
  const [img, setImg] = useState<string>("");

  const onFile = (f: File | undefined) => {
    if (!f) return setImg("");
    const r = new FileReader();
    r.onload = () => setImg(String(r.result));
    r.readAsDataURL(f);
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
