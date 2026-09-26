// OTP delivery through Termii on the "dnd" route (reaches Do-Not-Disturb numbers, no MTN night block).
// Without TERMII_API_KEY the app runs in demo mode: the code is shown on screen, clearly labelled.
export type SendResult = { sent: true } | { sent: false; demo: true } | { sent: false; demo: false; error: string };

export const smsConfigured = () => !!process.env.TERMII_API_KEY && !!process.env.TERMII_BASE_URL;

export async function sendOtpSms(phone: string, code: string): Promise<SendResult> {
  if (!smsConfigured()) return { sent: false, demo: true };
  const to = "234" + phone.replace(/^0/, "");
  try {
    const r = await fetch(`${process.env.TERMII_BASE_URL!.replace(/\/$/, "")}/api/sms/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        to,
        from: process.env.TERMII_SENDER_ID ?? "Shigo",
        sms: `Your Shigo code is ${code}. It expires in 10 minutes. Do not share it with anyone.`,
        type: "plain",
        channel: "dnd",
      }),
      cache: "no-store",
    });
    if (!r.ok) return { sent: false, demo: false, error: `SMS provider returned ${r.status}` };
    return { sent: true };
  } catch {
    return { sent: false, demo: false, error: "Could not reach the SMS provider" };
  }
}
