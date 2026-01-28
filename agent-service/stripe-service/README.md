# Stripe Proxy Lambda

A serverless proxy for Stripe API calls. Workshop participants use this shared Lambda instead of managing their own Stripe API keys.

## Supported Operations

### Customer Operations
- `customers.create` - Create a new customer
- `customers.list` - List/search customers
- `customers.update` - Update customer (requires `customerId`)
- `customers.retrieve` - Get customer details (requires `customerId`)

### SetupIntent Operations
- `setupIntents.create` - Create SetupIntent for collecting cards
- `setupIntents.retrieve` - Get SetupIntent status (requires `setupIntentId`)
- `setupIntents.confirm` - Confirm a SetupIntent (requires `setupIntentId`)

### PaymentMethod Operations
- `paymentMethods.retrieve` - Get payment method details (requires `paymentMethodId`)
- `paymentMethods.attach` - Attach to customer (requires `paymentMethodId`, `customer`)
- `paymentMethods.list` - List payment methods
- `paymentMethods.detach` - Detach from customer (requires `paymentMethodId`)

### PaymentIntent Operations
- `paymentIntents.create` - Create a PaymentIntent
- `paymentIntents.retrieve` - Get PaymentIntent (requires `paymentIntentId`)
- `paymentIntents.confirm` - Confirm PaymentIntent (requires `paymentIntentId`)

### CustomerSession Operations
- `customerSessions.create` - Create customer session for saved payment methods UI

### Shared Payment Token (SPT) Operations
- `spt.create` - Create an SPT for delegated payments

### Configuration
- `config.get` - Get publishable key (safe to expose)

## Usage

### Request Format

```javascript
const response = await fetch(STRIPE_PROXY_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Workshop-Secret': 'your-workshop-secret',
  },
  body: JSON.stringify({
    operation: 'customers.create',
    params: {
      email: 'customer@example.com',
      metadata: { source: 'workshop' },
    },
  }),
});

const { success, data } = await response.json();
```

### Response Format

Success:
```json
{
  "success": true,
  "data": { /* Stripe API response */ }
}
```

Error:
```json
{
  "error": "Error type",
  "message": "Error description",
  "code": "stripe_error_code"
}
```

## Deployment

### Prerequisites
- AWS CLI configured
- SAM CLI installed
- Stripe API keys

### Deploy

```bash
cd stripe-service

# Install dependencies
npm install

# Build and deploy
sam build
sam deploy --guided

# Or with parameters directly:
sam deploy \
  --parameter-overrides \
    StripeSecretKey=sk_test_xxx \
    StripePublishableKey=pk_test_xxx \
    WorkshopSecret=your-secret
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `WORKSHOP_SECRET` | Auth secret for requests | Yes |
| `STRIPE_API_VERSION` | Stripe API version | No (default: 2024-12-18.acacia) |
| `SPT_API_URL` | Custom SPT endpoint | No |
| `SPT_NETWORK_ID` | Network ID for SPT | No (default: internal) |

## Security

- All requests require the `X-Workshop-Secret` header
- Stripe secret key is stored as environment variable (encrypted at rest)
- CORS is configured for workshop use - restrict in production

## Local Development

```bash
# Start local API
sam local start-api \
  --env-vars env.json

# env.json example:
{
  "StripeProxyFunction": {
    "STRIPE_SECRET_KEY": "sk_test_xxx",
    "STRIPE_PUBLISHABLE_KEY": "pk_test_xxx", 
    "WORKSHOP_SECRET": "local-secret"
  }
}
```

