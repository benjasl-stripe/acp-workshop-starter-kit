# UCP Migration Log

Migration from Agentic Commerce Protocol (ACP) to Universal Commerce Protocol (UCP)

**Branch:** UCP
**Started:** 2026-03-02

---

## Summary of Changes

### Endpoint Renames
| ACP | UCP |
|-----|-----|
| `/checkouts` | `/checkout-sessions` |
| `/checkouts/:id` | `/checkout-sessions/{id}` |
| `/checkouts/:id/complete` | `/checkout-sessions/{id}/complete` |
| `/checkouts/:id/cancel` | `/checkout-sessions/{id}/cancel` |

---

## Change Log

### 1. Merchant Service - Route Rename
**Files changed:**
- `merchant-service/routes/checkouts.js` → `merchant-service/routes/checkout-sessions.js`
- Updated all header comments from ACP to UCP
- Updated all TODO error messages to reference `/checkout-sessions`

### 2. Merchant Service - Server Configuration
**File:** `merchant-service/server.js`
- Changed import from `checkouts.js` to `checkout-sessions.js`
- Changed route mount from `/checkouts` to `/checkout-sessions`
- Added `/.well-known/ucp` discovery endpoint (UCP spec requirement)
- Updated root endpoint documentation from ACP to UCP
- Updated console log messages

### 3. Merchant Service - Webhooks Import
**File:** `merchant-service/routes/webhooks.js`
- Updated import from `checkouts.js` to `checkout-sessions.js`

### 4. Agent Service - Checkout Route
**File:** `agent-service/routes/checkout.js`
- Updated header comments from ACP to UCP
- Updated all endpoint URLs from `/checkouts` to `/checkout-sessions`
- Updated all TODO comments to reference UCP endpoints

### 5. Agent Service - Server Configuration
**File:** `agent-service/server.js`
- Updated header comments from ACP to UCP
- Updated service description to "UCP Agent with Stripe SPT support"
- Added UCP version info to root endpoint response

### 6. Frontend - Chat Interface
**File:** `frontend/components/ChatInterface.tsx`
- Updated title from "ACP + SPT Demo" to "UCP + SPT Demo"
- Updated welcome message and checkout instructions

### 7. Frontend - Logger
**File:** `frontend/lib/acp-logger.ts`
- Updated header comment from ACP to UCP
- Updated path matching to support both `/checkouts` and `/checkout-sessions`

### 8. Frontend - Inspector
**File:** `frontend/components/ACPInspector.tsx`
- Updated all visible UI text from "ACP Inspector" to "UCP Inspector"

### 9. Frontend - Page Layout
**File:** `frontend/app/page.tsx`
- Updated comments from ACP to UCP

### 10. Frontend - API
**File:** `frontend/lib/api.ts`
- Updated comments from ACP to UCP

### 11. Agent Service - Call Logger
**File:** `agent-service/lib/acp-call-logger.js`
- Updated all comments from ACP to UCP
- Updated console log messages
- Updated endpoint extraction to support /checkout-sessions paths

### 12. Agent Service - Stripe Logger
**File:** `agent-service/lib/stripe-logger.js`
- Updated comment to reference UCP inspector

### 13. Agent Service - Package.json
**File:** `agent-service/package.json`
- Updated description to UCP

### 14. Agent Service - README
**File:** `agent-service/README.md`
- Updated all ACP references to UCP
- Updated endpoint paths in documentation

### 15. Main README
**File:** `README.md`
- Completely updated from ACP to UCP
- Added links to UCP specification

---

## Files Renamed

| Old Name | New Name |
|----------|----------|
| `merchant-service/routes/checkouts.js` | `merchant-service/routes/checkout-sessions.js` |

## Files NOT Renamed (kept for backwards compatibility)

- `agent-service/lib/acp-call-logger.js` - Function names kept as `logACPCall`, `loggedACPFetch`
- `frontend/lib/acp-logger.ts` - Class kept as `ACPLogger`
- `frontend/components/ACPInspector.tsx` - Component kept as `ACPInspector`

These files have updated comments and UI text but retain original names to minimize import changes.

### 16. UCP Discovery - Stripe Payment Handler
**File:** `merchant-service/server.js`
- Enhanced `/.well-known/ucp` endpoint with proper Stripe payment handler configuration
- Added `com.stripe.tokenization` as the payment handler (per UCP spec)
- Added `accepts_shared_payment_tokens: true` to indicate SPT support
- Added `merchant_of_record: true` to indicate merchant processes payments directly

### 17. AI Service Lambda - Tool Definitions
**File:** `agent-service/ai-service/app.mjs`
- Updated header comment from ACP to UCP
- Renamed `ACP_TOOLS` constant to `UCP_TOOLS`
- Updated reference in OpenAI request builder

### 18. Fix: catalog.js Import
**File:** `merchant-service/routes/catalog.js`
- Fixed import from `./checkouts.js` → `./checkout-sessions.js`
- This was missed during the initial rename; webhooks.js was updated but catalog.js was not
- The `checkouts` Map is still exported from `checkout-sessions.js`, so catalog code continues to work

### 19. Fix: ES Module Import Hoisting - dotenv
**File:** `merchant-service/server.js`
- **Problem:** ES modules hoist imports, so `checkout-sessions.js` and `webhooks.js` ran `new Stripe(process.env.STRIPE_SECRET_KEY)` before `dotenv.config()` executed, leaving the key undefined
- **Fix:** Changed to `import 'dotenv/config'` as the very first import (side-effect import loads env vars immediately)
- Removed `import dotenv from 'dotenv'` and `dotenv.config()` call

### 20. Important: Correct SPT Parameter for PaymentIntent
**File:** `merchant-service/routes/checkout-sessions.js` (complete endpoint)
- **Correct:** `payment_method_data.shared_payment_granted_token`
- **Wrong:** `payment_method_data.card.shared_payment_token` (does not exist)
- Do NOT use `automatic_payment_methods` with SPT - it can conflict with the fixed payment path
- Reference: https://docs.stripe.com/payments/shared-payment-tokens#sellers

```javascript
// Correct SPT usage:
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount,
  currency: 'usd',
  payment_method_data: {
    shared_payment_granted_token: payment_data.token,  // spt_xxx
  },
  confirm: true,
});
```

