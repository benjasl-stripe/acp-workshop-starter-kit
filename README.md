# 🤖 ACP Demo - Agentic Commerce Protocol

A demonstration of AI-powered shopping with Shared Payment Tokens (SPT) using the Agentic Commerce Protocol.

## 🏗️ Architecture

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

## 📁 Project Structure

```
acp-demo/
├── frontend/           # Next.js frontend application
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── lib/           # Utility functions & API client
│   └── package.json
│
├── agent-service/      # Agent backend (Express.js)
│   ├── routes/        # API routes (chat, checkout, payment)
│   ├── lib/           # Logging utilities
│   └── package.json
│
├── merchant-service/   # Merchant backend (Express.js)
│   ├── routes/        # ACP endpoints (checkouts, products)
│   ├── lib/           # Product store
│   └── package.json
│
├── ai-service/         # AWS Lambda (AI brain)
│   ├── app.mjs        # Lambda handler with OpenAI
│   └── package.json
│
└── template.yaml       # SAM/CloudFormation template
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Frontend
cd frontend && npm install && cd ..

# Agent Service
cd agent-service && npm install && cd ..

# Merchant Service
cd merchant-service && npm install && cd ..

# AI Service (Lambda)
cd ai-service && npm install && cd ..
```

### 2. Configure Environment

**Agent Service** (`agent-service/.env`):
```bash
LAMBDA_ENDPOINT=https://your-lambda-url.amazonaws.com/Prod/
MERCHANT_API_URL=http://localhost:4000
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PORT=3001
```

**Merchant Service** (`merchant-service/.env`):
```bash
STRIPE_SECRET_KEY=sk_test_...
PORT=4000
```

### 3. Deploy AI Service (Lambda)

```bash
sam build
sam deploy --parameter-overrides OpenAIApiKey=sk-your-openai-key
```

### 4. Start Services

```bash
# Terminal 1 - Frontend
cd frontend && npm run dev

# Terminal 2 - Agent Service
cd agent-service && npm run dev

# Terminal 3 - Merchant Service
cd merchant-service && npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔄 Data Flow

1. **User chats** → Frontend sends to Agent Service
2. **Agent calls AI** → Lambda determines intent (create checkout, update, etc.)
3. **Agent calls Merchant** → ACP endpoints handle checkout operations
4. **Payment time** → Agent creates SPT, sends to Merchant
5. **Merchant charges** → Uses SPT to process payment via Stripe

## 🔐 Shared Payment Tokens (SPT)

SPT enables secure cross-account payments:
- Agent issues SPT with usage limits (amount, expiration)
- Merchant receives SPT and creates PaymentIntent
- Stripe clones the payment method to Merchant's account
- Merchant never sees actual card details

## 📚 Service Details

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | Next.js UI |
| Agent Service | 3001 | AI orchestration, SPT creation |
| Merchant Service | 4000 | ACP endpoints, payment processing |
| AI Service | Lambda | Natural language understanding |

---

**Built with Next.js, Express, AWS Lambda, and Stripe**
