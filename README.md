# ACP Demo - Agentic Commerce Protocol

A demo of AI-powered shopping using the Agentic Commerce Protocol with Shared Payment Tokens (SPT).

## Architecture

```
┌──────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Frontend   │────►│   Agent Service      │────►│ Merchant Service│
│   (Next.js)  │◄────│   (Express.js)       │◄────│ (ACP endpoints) │
└──────────────┘     └──────────┬───────────┘     └─────────────────┘
                               │
                     ┌─────────┴─────────┐
                     │                   │
              ┌──────▼──────┐    ┌───────▼───────┐
              │ AI Service  │    │    Stripe     │
              │ (AWS Lambda)│    │  (Payments)   │
              └─────────────┘    └───────────────┘
```
## Manual Setup

If you prefer manual control:

```bash
# Install dependencies
cd frontend && npm install && cd ..
cd agent-service && npm install && cd ..
cd merchant-service && npm install && cd ..

# Configure environment (copy .env.example to .env in each service)
# Then start each service in separate terminals:
cd frontend && npm run dev          # Port 3000
cd agent-service && npm run dev     # Port 3001
cd merchant-service && npm run dev  # Port 4000
```

## Environment Variables

**Agent Service** (`agent-service/.env`):
```bash
LAMBDA_ENDPOINT=https://your-lambda-url.amazonaws.com/Prod/
MERCHANT_API_URL=http://localhost:4000
STRIPE_PUBLISHABLE_KEY=pk_test_...
PORT=3001
```

**Merchant Service** (`merchant-service/.env`):
```bash
STRIPE_SECRET_KEY=sk_test_...
PORT=4000
```

## Project Structure

```
acp-demo/
├── frontend/              # Next.js UI
├── agent-service/         # Express.js orchestrator
│   ├── ai-service/       # AWS Lambda (OpenAI)
│   └── stripe-service/   # Stripe Lambda
├── merchant-service/      # Merchant backend (ACP endpoints)
└── dev.sh                # One-command startup
```

## Data Flow

1. **User chats** → Frontend sends to Agent Service
2. **Agent calls AI** → Lambda determines intent (create checkout, update, etc.)
3. **Agent calls Merchant** → ACP endpoints handle checkout operations
4. **Payment time** → Agent creates SPT, sends to Merchant
5. **Merchant charges** → Uses SPT to process payment via Stripe

## Shared Payment Tokens (SPT)

SPT enables secure cross-account payments:
- Agent issues SPT with usage limits (amount, expiration)
- Merchant receives SPT and creates PaymentIntent
- Stripe clones the payment method to Merchant's account
- Merchant never sees actual card details

## Services

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js UI |
| Agent Service | 3001 | AI orchestration, SPT creation |
| Merchant Service | 4000 | ACP endpoints, payment processing |
| AI Service | Lambda | Natural language understanding |

---

**Built with Next.js, Express, AWS Lambda, and Stripe**
