# Agent Service

The Agent Service is the "brain" of the UCP demo. It orchestrates:

1. **AI Chat** - Calls Lambda for natural language understanding
2. **UCP Checkout** - Manages checkout flow with the Merchant Backend
3. **Stripe SPT** - Creates Shared Payment Tokens for secure payments

## Architecture

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Frontend   │────►│   Agent Service      │────►│ Merchant Backend│
│   (Next.js)  │◄────│   (this service)     │◄────│ (UCP endpoints) │
└──────────────┘     └──────────┬───────────┘     └─────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
              ┌──────▼──────┐    ┌───────▼───────┐
              │   Lambda    │    │    Stripe     │
              │ (AI Brain)  │    │  (Payments)   │
              └─────────────┘    └───────────────┘
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   # Lambda endpoint (the shared AI brain)
   LAMBDA_ENDPOINT=https://your-lambda-url.amazonaws.com/chat
   WORKSHOP_SECRET=your-workshop-secret

   # Stripe Configuration (Agent's Stripe account for SPT creation)
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

   # Merchant Backend URL
   MERCHANT_API_URL=http://localhost:4000

   # Server Configuration
   PORT=3001
   ```

3. Start the service:
   ```bash
   npm run dev
   ```

## API Endpoints

### Chat
- `POST /api/chat` - Send messages to AI (via Lambda)

### Checkout (UCP)
- `POST /api/checkout/create` - Create checkout session
- `GET /api/checkout/:id` - Get checkout status
- `PUT /api/checkout/:id` - Update checkout (address, shipping)
- `POST /api/checkout/:id/complete` - Complete with SPT
- `POST /api/checkout/:id/cancel` - Cancel checkout

### Payment (Stripe SPT)
- `GET /api/payment/config` - Get Stripe publishable key
- `POST /api/payment/setup-intent` - Create SetupIntent for card collection
- `POST /api/payment/save-method` - Save payment method to customer
- `GET /api/payment/methods?email=x` - Get saved payment methods
- `POST /api/payment/create-spt` - Create Shared Payment Token

## How SPT Works

Shared Payment Tokens (SPT) are a Stripe feature that enables secure cross-account payments.

### SPT Modes

| Mode | Env Variable | Stripe Accounts | When to Use |
|------|--------------|-----------------|-------------|
| **Simulation** | `SPT_SIMULATION_MODE=true` | Same account required | Demos, workshops (no API access) |
| **Production** | Not set or `false` | Different accounts OK | When SPT API is available |

To switch to production mode: Remove `SPT_SIMULATION_MODE` from `.env` and set the merchant's own Stripe key.

### Flow

1. **User saves payment method** - Card collected via Stripe Elements, attached to Agent's Customer
2. **Agent issues SPT** - When checkout is ready, Agent calls Stripe to create an SPT with:
   - Payment method reference
   - Usage limits (max amount, currency, expiration)
   - Seller details (merchant identifier)
3. **Agent sends SPT to Merchant** - Via UCP `/checkout-sessions/:id/complete` endpoint
4. **Merchant processes SPT** - Creates PaymentIntent with `shared_payment_granted_token`
5. **Stripe clones payment method** - Stripe creates a copy on Merchant's account
6. **Payment completes** - Funds go to Merchant, order is confirmed

### SPT Security Benefits

- Merchant **never** sees actual card details
- SPT has **usage limits** (amount, currency, expiration)
- Token is **one-time use**
- Works **cross-account** (Agent and Merchant can have different Stripe accounts)

### SPT API

**Agent issues SPT** (via test helper for development):
```bash
curl https://api.stripe.com/v1/test_helpers/shared_payment/granted_tokens \
  -d payment_method=pm_xxx \
  -d "usage_limits[currency]"=usd \
  -d "usage_limits[max_amount]"=10000 \
  -d "usage_limits[expires_at]"={{timestamp}}
```

**Merchant uses SPT**:
```bash
curl https://api.stripe.com/v1/payment_intents \
  -d amount=10000 \
  -d currency=usd \
  -d shared_payment_granted_token=spt_xxx \
  -d confirm=true
```


## Example Flow

```
User: "I want to buy Poor Charlie's Almanack"
           ↓
Agent calls Lambda → "User wants to buy PCA-001"
           ↓
Agent calls Merchant → POST /checkouts (creates session)
           ↓
User: "Ship to 123 Main St, SF CA 94105"
           ↓
Agent calls Merchant → PUT /checkouts/:id (updates address)
           ↓
User: "Yes, complete my order"
           ↓
Agent calls Stripe → Create SPT from saved payment method
           ↓
Agent calls Merchant → POST /checkouts/:id/complete (with SPT)
           ↓
Merchant charges card using SPT → Order complete!
```

