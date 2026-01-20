# 🔒 Secure Lambda Deployment with Custom Authentication

Your Lambda function is now protected with **custom secret validation** - all authentication happens server-side!

## 🎯 What's Different Now

### ✅ Before (API Gateway Key):
- ❌ API key visible in browser DevTools
- ✅ Rate limiting in API Gateway
- ⚠️ Users could extract the key

### ✅ After (Lambda Secret Validation):
- ✅ Secret validated entirely in Lambda
- ✅ Same secret used for deployment AND runtime
- ✅ Simpler setup - one secret for everything
- ✅ No AWS API Gateway key management needed

---

## 🚀 Deploy with Custom Secret

### 1. Generate a Random Secret

Create a strong random string (or use this command):

```bash
# On macOS/Linux:
openssl rand -base64 32

# Or use this simple Python one-liner:
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Example output: xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0
```

### 2. Deploy Lambda with Both Secrets

```bash
cd ai-chat
sam build
sam deploy --parameter-overrides \
  OpenAIApiKey=sk-your-openai-key-here \
  WorkshopSecret=xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0
```

### 3. Add Secret to Frontend `.env`

Create or update `.env` in project root:

```bash
# Same secret you used in sam deploy!
VITE_WORKSHOP_SECRET=xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0
```

**Important:** This must match the `WorkshopSecret` you deployed with!

### 4. Restart Dev Server

```bash
npm run dev
```

---

## 🧪 Test It

### Without Secret (Should Fail):
```bash
curl -X POST https://bnkl1g96p3.execute-api.us-west-2.amazonaws.com/Prod/ \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "test"}]}'
```

**Expected:** `{"error":"Forbidden","message":"Invalid or missing authentication"}`

### With Secret (Should Work):
```bash
curl -X POST https://bnkl1g96p3.execute-api.us-west-2.amazonaws.com/Prod/ \
  -H "Content-Type: application/json" \
  -H "X-Workshop-Secret: xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0" \
  -d '{
    "messages": [{"role": "user", "content": "What is Stripe?"}],
    "systemPrompt": "You are a helpful assistant.",
    "currentPage": "Test"
  }'
```

**Expected:** AI response! ✅

---

## 🔐 How It Works

### Request Flow:

1. **Frontend** sends request with `X-Workshop-Secret` header
2. **Lambda** receives request and validates:
   ```javascript
   if (providedSecret !== process.env.WORKSHOP_SECRET) {
     return 403 Forbidden
   }
   ```
3. **If valid** → Call OpenAI and return response
4. **If invalid** → Return 403 error

### Security Layers:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Workshop Secret** | Lambda validates | Prevents unauthorized access |
| **OpenAI API Key** | Lambda only | Never exposed to browser |
| **CORS** | API Gateway | Limits which domains can call |

---

## 🔄 Rotate Secret

To change the workshop secret:

### 1. Generate New Secret:
```bash
openssl rand -base64 32
# Example: nQ7pL9xM4wK2vJ8hR6tC5bN3aF1gY0e
```

### 2. Redeploy Lambda:
```bash
cd ai-chat
sam deploy --parameter-overrides \
  OpenAIApiKey=sk-your-openai-key-here \
  WorkshopSecret=nQ7pL9xM4wK2vJ8hR6tC5bN3aF1gY0e
```

### 3. Update Frontend `.env`:
```bash
VITE_WORKSHOP_SECRET=nQ7pL9xM4wK2vJ8hR6tC5bN3aF1gY0e
```

### 4. Restart Dev Server:
```bash
npm run dev
```

**Done!** Old secret no longer works.

---

## 🛡️ Security Comparison

| Method | OpenAI Safe? | Secret Visible? | Setup | Rotation |
|--------|--------------|-----------------|-------|----------|
| **Client-side OpenAI** | ❌ Exposed | N/A | 1 min | Never use |
| **API Gateway Key** | ✅ Safe | ⚠️ Yes (browser) | 5 min | Via AWS Console |
| **Lambda Secret** (Current) | ✅ Safe | ⚠️ Yes (browser) | **5 min** | **Re-deploy** |
| **Cognito Auth** | ✅ Safe | ✅ No | 1 hour | Via Cognito |
| **Lambda Authorizer** | ✅ Safe | ✅ No | 2 hours | Custom |

---

## 💡 Why This Approach?

### Pros:
- ✅ **Simple**: One secret for everything
- ✅ **No AWS key management**: No need to retrieve keys from API Gateway
- ✅ **Easy rotation**: Just redeploy
- ✅ **OpenAI key protected**: Never leaves Lambda
- ✅ **No extra cost**: Everything in Lambda

### Cons:
- ⚠️ Secret still visible in browser (but different from OpenAI key!)
- ⚠️ Determined attackers could extract it
- ⚠️ No built-in rate limiting (can add in Lambda if needed)

### Perfect For:
- Internal workshops
- Trusted user groups
- Development environments
- Quick prototypes

---

## 🚀 Add Rate Limiting (Optional)

Want to add rate limiting in Lambda? Here's how:

### 1. Install DynamoDB for tracking:
```javascript
// In Lambda, track requests per IP
const requestCount = await getRequestCount(ipAddress);
if (requestCount > 10) {
  return { statusCode: 429, body: 'Rate limit exceeded' };
}
```

### 2. Or use a simple in-memory cache:
```javascript
const requestCounts = {};
const IP = event.requestContext.identity.sourceIp;

if (!requestCounts[IP]) requestCounts[IP] = [];
requestCounts[IP].push(Date.now());

// Keep only last minute
requestCounts[IP] = requestCounts[IP].filter(t => Date.now() - t < 60000);

if (requestCounts[IP].length > 10) {
  return { statusCode: 429, body: 'Too many requests' };
}
```

---

## 📊 Monitor Usage

### CloudWatch Logs:
```bash
sam logs -n PostChatFunction --stack-name ai-chat --tail
```

### CloudWatch Metrics:
1. Go to AWS Console → CloudWatch
2. Metrics → Lambda
3. View: Invocations, Duration, Errors

### Set Up Alarms:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name high-lambda-invocations \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --metric-name Invocations \
  --namespace AWS/Lambda \
  --period 3600 \
  --statistic Sum \
  --threshold 1000
```

---

## 🐛 Troubleshooting

### "Forbidden" error:
- ✅ Check `.env` has `VITE_WORKSHOP_SECRET`
- ✅ Verify secret matches Lambda deployment
- ✅ Restart dev server: `npm run dev`
- ✅ Check browser DevTools → Network → Request Headers

### "Server configuration error":
- ✅ Lambda missing `WORKSHOP_SECRET` env var
- ✅ Redeploy with `--parameter-overrides WorkshopSecret=...`

### Secret visible in DevTools:
- ✅ This is expected and OK
- ✅ The important secret (OpenAI key) is safe in Lambda
- ✅ For higher security, use Cognito or Lambda Authorizer

---

## 🎯 Next Level Security

Want even more security? Here are options:

### 1. IP Whitelisting
Restrict to specific IPs in API Gateway:
```yaml
# template.yaml
ResourcePolicy:
  IpRangeWhitelist:
    - "203.0.113.0/24"  # Your office IP
```

### 2. AWS Cognito (User Login)
Require users to log in:
```yaml
Auth:
  DefaultAuthorizer: MyCognitoAuth
  Authorizers:
    MyCognitoAuth:
      UserPoolArn: !GetAtt UserPool.Arn
```

### 3. Lambda Authorizer (Custom JWT)
Validate JWT tokens with custom logic:
```yaml
Auth:
  DefaultAuthorizer: MyLambdaAuth
  Authorizers:
    MyLambdaAuth:
      FunctionArn: !GetAtt AuthFunction.Arn
```

---

## ✅ Security Checklist

- [ ] Workshop secret generated (32+ random characters)
- [ ] Lambda deployed with `WorkshopSecret` parameter
- [ ] OpenAI API key deployed with `OpenAIApiKey` parameter
- [ ] Frontend `.env` has `VITE_WORKSHOP_SECRET`
- [ ] `.env` in `.gitignore`
- [ ] Tested with valid secret (works)
- [ ] Tested without secret (fails with 403)
- [ ] CloudWatch logs monitoring enabled
- [ ] Team knows how to rotate secret

---

## 💰 Cost

**Everything is FREE** (within AWS free tier):
- Lambda: 1M invocations/month free
- API Gateway: 1M requests/month free
- CloudWatch: 5GB logs free
- **Only cost:** OpenAI API (~$0.03-0.08 per question)

---

## 📝 Quick Reference

### Deploy:
```bash
cd ai-chat
sam build
sam deploy --parameter-overrides \
  OpenAIApiKey=sk-... \
  WorkshopSecret=your-random-secret
```

### Frontend `.env`:
```bash
VITE_WORKSHOP_SECRET=your-random-secret
```

### Test:
```bash
curl -X POST YOUR_ENDPOINT \
  -H "Content-Type: application/json" \
  -H "X-Workshop-Secret: your-random-secret" \
  -d '{"messages":[{"role":"user","content":"test"}],"systemPrompt":"hi","currentPage":"test"}'
```

---

**Your Lambda is now secured with server-side secret validation!** 🎉

The OpenAI key is completely hidden, and you have full control over authentication.
