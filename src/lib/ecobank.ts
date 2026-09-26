import { createHash, randomUUID } from "crypto";

// Ecobank Account Enquiry client, built from the developer portal's published formulas (docs/ecobank-api-notes.md).
// Off until Ecobank issues a clientId, secret key and Nigeria affiliate code; the sandbox only returns fixed responses.
const cfg = () => ({
  base: (process.env.ECOBANK_BASE_URL ?? "https://apimuat-gateway.ecobank.com").replace(/\/$/, ""),
  subscriptionKey: process.env.ECOBANK_ACCOUNT_SUBSCRIPTION_KEY ?? "",
  clientId: process.env.ECOBANK_CLIENT_ID ?? "",
  secretKey: process.env.ECOBANK_SECRET_KEY ?? "",
  publicKey: process.env.ECOBANK_PUBLIC_KEY ?? "",
  affiliateCode: process.env.ECOBANK_AFFILIATE_CODE ?? "",
  sourceCode: process.env.ECOBANK_SOURCE_CODE ?? "",
  ipAddress: process.env.ECOBANK_IP_ADDRESS ?? "127.0.0.1",
});

export const ecobankConfigured = () => {
  const c = cfg();
  return !!(c.subscriptionKey && c.clientId && c.secretKey && c.affiliateCode && c.sourceCode);
};

const sha512 = (s: string) => createHash("sha512").update(s).digest("hex");

function header(requestType: string) {
  const c = cfg();
  const requestId = randomUUID().replace(/-/g, "").slice(0, 20);
  // requestToken = SHA-512(clientId + affiliateCode + sourceCode + requestId + requestType + ipAddress + secretKey)
  const requestToken = sha512(c.clientId + c.affiliateCode + c.sourceCode + requestId + requestType + c.ipAddress + c.secretKey);
  return { affiliateCode: c.affiliateCode, clientId: c.clientId, sourceCode: c.sourceCode, requestId, ipAddress: c.ipAddress, requestType, requestToken };
}

type Envelope<T> = { headerResponse?: { responseCode?: string; responseDesc?: string }; data?: T };

async function post<T>(path: string, body: unknown, bearer?: string): Promise<Envelope<T>> {
  const c = cfg();
  const r = await fetch(c.base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": c.subscriptionKey,
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return (await r.json().catch(() => ({}))) as Envelope<T>;
}

// Tokens last 5 minutes and are tied to one service code. The token's secureHash field order is not published;
// this follows the documented pattern (header fields + requestToken + body fields + secret) and must be confirmed.
async function token(serviceCode: string) {
  const c = cfg();
  const h = header("GET_API_TOKEN");
  const secureHash = sha512(c.clientId + c.affiliateCode + c.sourceCode + h.requestId + h.requestType + c.ipAddress + h.requestToken + c.publicKey + serviceCode + c.secretKey);
  const res = await post<{ access_token?: string }>("/corp-auth/api/v2/integration/auth/app/token", { headerRequest: h, publicKey: c.publicKey, serviceCode, secureHash });
  if (res.headerResponse?.responseCode !== "000" || !res.data?.access_token) throw new Error(res.headerResponse?.responseDesc ?? "token failed");
  return res.data.access_token;
}

export type EcobankName = { found: true; name: string; active: boolean } | { found: false };

// Validate Account Name: secureHash = SHA-512(header fields + accountNo + bankCode + requestToken + secretKey), as documented.
export async function validateEcobankAccount(accountNo: string): Promise<EcobankName> {
  const c = cfg();
  const bearer = await token("ACCOUNT_SERVICE");
  const h = header("GET_ACCOUNT_NAME");
  const bankCode = "ECOBANK";
  const secureHash = sha512(c.clientId + c.affiliateCode + c.sourceCode + h.requestId + h.requestType + c.ipAddress + accountNo + bankCode + h.requestToken + c.secretKey);
  const res = await post<{ accountName?: string; accountStatus?: string }>(
    "/corp-account-inquiry/api/v2/integration/account/inquiry/validate",
    { headerRequest: h, secureHash, accountNo, bankCode },
    bearer,
  );
  if (res.headerResponse?.responseCode !== "000" || !res.data?.accountName) return { found: false };
  return { found: true, name: res.data.accountName, active: (res.data.accountStatus ?? "").toUpperCase() === "ACTIVE" };
}
