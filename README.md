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
Requires the companion instructions:
https://main.d2zbqeognilkf1.amplifyapp.com/module/0/chapter/0
---
