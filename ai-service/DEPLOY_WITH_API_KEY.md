# 🚀 Deploy with OpenAI API Key

Your Lambda function is now configured to accept an OpenAI API key as an environment variable. Here's how to deploy it:

## 📋 Prerequisites

1. Get your OpenAI API key from: https://platform.openai.com/api-keys
2. Make sure you have AWS SAM CLI installed

---

## 🎯 Deployment Options

### Option 1: Deploy with Command Line (Recommended)

```bash
cd ai-chat

# Build
sam build

# Deploy with API key
sam deploy --parameter-overrides OpenAIApiKey=sk-your-openai-key-here
```

**Replace `sk-your-openai-key-here` with your actual OpenAI API key!**

---

### Option 2: Deploy with Guided Setup

```bash
cd ai-chat
sam build
sam deploy --guided
```

When prompted:
```
Parameter OpenAIApiKey []: sk-your-openai-key-here
```

Paste your OpenAI API key when asked.

---

### Option 3: Update samconfig.toml (Permanent)

Edit `samconfig.toml` (line 25):

```toml
[default.deploy.parameters]
capabilities = "CAPABILITY_IAM"
confirm_changeset = true
resolve_s3 = true
s3_prefix = "ai-chat"
region = "us-west-2"
disable_rollback = true
image_repositories = []
parameter_overrides = "OpenAIApiKey=sk-your-openai-key-here"  # Uncomment and add your key
```

Then deploy normally:
```bash
sam build && sam deploy
```

**⚠️ Warning:** Don't commit this file if you add your API key here! Add `samconfig.toml` to `.gitignore`.

---

## 🔍 Verify Environment Variable

After deployment, check it's set:

```bash
aws lambda get-function-configuration \
  --function-name ai-chat-PostChatFunction-XXXXX \
  --query 'Environment.Variables'
```

You should see:
```json
{
  "OPENAI_API_KEY": "sk-your-key-here"
}
```

---

## 🧪 Test the Complete Setup

### 1. Test from Command Line

```bash
curl -X POST https://bnkl1g96p3.execute-api.us-west-2.amazonaws.com/Prod/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is Stripe?"}],
    "systemPrompt": "You are a helpful assistant.",
    "currentPage": "Test"
  }'
```

### 2. Test from Workshop

```bash
# In project root
npm run dev
```

Then:
1. Open http://localhost:5173
2. Click AI chat button
3. Ask a question
4. Should get real AI responses! 🎉

---

## 🔄 Update API Key Later

If you need to change your API key:

### Option A: Redeploy with new key
```bash
sam deploy --parameter-overrides OpenAIApiKey=sk-new-key-here
```

### Option B: Update directly in AWS
```bash
aws lambda update-function-configuration \
  --function-name ai-chat-PostChatFunction-XXXXX \
  --environment "Variables={OPENAI_API_KEY=sk-new-key-here}"
```

---

## 🔒 Security Best Practices

1. **Never commit your API key** to git
2. **Add to .gitignore** if you store it in config files:
   ```
   samconfig.toml
   .env
   ```

3. **Use AWS Secrets Manager** for production (optional):
   ```yaml
   Environment:
     Variables:
       OPENAI_API_KEY: !Sub '{{resolve:secretsmanager:OpenAIKey:SecretString}}'
   ```

4. **Set spending limits** in OpenAI dashboard:
   - Go to https://platform.openai.com/account/billing/limits
   - Set monthly budget cap

---

## 💰 Monitor Costs

### OpenAI Dashboard
- View usage: https://platform.openai.com/usage
- Set up alerts for spending

### AWS CloudWatch
```bash
# View Lambda invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=ai-chat-PostChatFunction-XXXXX \
  --start-time $(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

---

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Check you deployed with `--parameter-overrides`
- Verify environment variable is set (see above)

### "Invalid API key"
- Check key starts with `sk-`
- Verify key has credits at https://platform.openai.com/account/billing
- Try creating a new key

### Still getting test responses
- Make sure you added the OpenAI code to `ai-service/app.mjs`
- See `ai-service/ADD_OPENAI.md` for instructions
- Redeploy after adding the code

---

## ✅ Complete Deployment Checklist

- [ ] Get OpenAI API key
- [ ] Build Lambda: `sam build`
- [ ] Deploy with key: `sam deploy --parameter-overrides OpenAIApiKey=sk-...`
- [ ] Verify deployment succeeded
- [ ] Add OpenAI code to `ai-service/app.mjs` (see `ADD_OPENAI.md`)
- [ ] Rebuild and redeploy: `sam build && sam deploy`
- [ ] Test from workshop frontend
- [ ] Set spending limits in OpenAI
- [ ] Monitor usage

---

**That's it!** Your AI chat is now fully configured and secure! 🎊

For OpenAI integration code, see: `ai-service/ADD_OPENAI.md`

