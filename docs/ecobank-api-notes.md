# Ecobank API: what the developer portal actually says

Read on 27 September 2026 from https://apimuat-developer.ecobank.com (the portal's documentation pages and its public API catalogue at `/developer/apis`). Support: EcobankSandboxSupport@ecobank.com, Monday to Friday, 9:00 to 17:00 GMT.

## The ten published APIs

| API | Gateway path | Used by Shigo |
| --- | --- | --- |
| Account Enquiry Service | `corp-account-inquiry` | Yes: Validate Account Name, Account Info |
| Authentication Service | `corp-auth` | Yes: every call needs its token |
| Notification Service | `corp-notifications` | Yes: the green screen depends on it |
| Account Opening Service | `corp-account-opening` | No |
| Billpayment Service | `corp-billpayment` | No |
| Local Bank Payment Service | `corp-payment` | No |
| Payment From Ecobank Account | `corp-directdebit` | No |
| Remittance Service | `corp-remittance` | No |
| Remittance Service (Single RT) | `corp-rapidtransfer` | No |
| XpressCash Token Service | `corp-token` | No |

## How a call works

1. Subscribe to a product on the portal (**Products**, enter a subscription name, **Subscribe**). Each product gets a primary and secondary key, sent as the `Ocp-Apim-Subscription-Key` header.
2. Get a bearer token: `POST /api/v2/integration/auth/app/token` with `requestType: "GET_API_TOKEN"` and a `serviceCode` for the product. A token only works for the product it was issued for, and expires after 5 minutes.
3. Call the endpoint with `Authorization: Bearer <token>`. Every body carries a `headerRequest` (`affiliateCode`, `clientId`, `sourceCode`, `requestId`, `requestType`, `ipAddress`, `requestToken`) and a `secureHash`.
4. Signing: `requestToken = SHA-512(clientId + affiliateCode + sourceCode + requestId + requestType + ipAddress + secretKey)`. `secureHash = SHA-512(` the same header fields `+ requestToken +` the endpoint's own fields in the documented order `+ secretKey)`.

Response envelope: `headerResponse.responseCode` is `"000"` on success; the payload is in `data`.

## Validate Account Name (bank verification from Ecobank itself)

`POST /api/v2/integration/account/inquiry/validate`, `requestType: "GET_ACCOUNT_NAME"`.
Hash fields after the header: `accountNo + bankCode + requestToken + secretKey`.
Response `data`: `accountNo`, `accountName`, `ccy`, `branchCode`, `accountType`, `accountStatus` (e.g. `ACTIVE`).
The example uses `bankCode: "ECOBANK"`; whether it resolves accounts at other Nigerian banks is not stated. Shigo keeps Paystack's resolver for non-Ecobank banks.

## What the documentation does not cover

- **Notification Service:** the product exists and needs a subscription key, but it publishes no operations, no payload and no documentation section. How to register an account and a webhook URL, and what a notification looks like, is undocumented. The only webhook/callback mentions on the portal belong to the Remittance Service.
- **Nigeria:** every example uses `affiliateCode: "EGH"` (Ecobank Ghana). The Nigerian code is not listed.
- **Credentials:** where a sandbox partner gets `clientId` and the Secret Key is not stated; the portal says sandbox uses default values that return fixed responses, and personal credentials come at UAT.
- **Reference tables:** the Service Code and Request Type pages are empty.
- **Sandbox responses are static:** the sandbox returns predefined responses, so real account checks and real credit notifications only happen from UAT onwards.
