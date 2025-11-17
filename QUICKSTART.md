# 🚀 Quick Start - Secure Lambda Deployment

Get your Workshop AI Assistant running in **5 minutes**!

---

## Step 1: Generate a Secret

```bash
# On macOS/Linux:
openssl rand -base64 32

# Copy the output (example: xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0)
```

---

## Step 2: Deploy Lambda

```bash
cd ai-chat

sam build

sam deploy --parameter-overrides \
  OpenAIApiKey=sk-your-openai-key-here \
  WorkshopSecret=xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0
```

**Copy the API endpoint from the output!**

---

## Step 3: Configure Frontend

Create `.env` in project root:

```bash
VITE_WORKSHOP_SECRET=xK9mP2vLqR8wN5tY7jH4bC3dF6gS1aE0
```

---

## Step 4: Start Dev Server

```bash
npm run dev
```

---

## Step 5: Test It!

1. Open your workshop in browser
2. Click the purple AI button (bottom right)
3. Ask: "What is this workshop about?"
4. Get instant AI response! ✨

---

## 🎉 Done!

Your AI assistant is now:
- ✅ Secure (OpenAI key hidden in Lambda)
- ✅ Protected (Workshop secret validation)
- ✅ Fast (Direct Lambda calls)
- ✅ Cheap (Only pay for OpenAI usage)

---

## 🔧 Troubleshooting

### "Forbidden" error:
- Check `.env` has the correct `VITE_WORKSHOP_SECRET`
- Restart dev server: `npm run dev`

### "Server configuration error":
- Redeploy Lambda with both secrets:
  ```bash
  sam deploy --parameter-overrides \
    OpenAIApiKey=sk-... \
    WorkshopSecret=...
  ```

### No response:
- Check CloudWatch logs:
  ```bash
  sam logs -n PostChatFunction --stack-name ai-chat --tail
  ```

---

## 📚 More Info

- Full guide: `SECURE_DEPLOYMENT.md`
- Lambda code: `lambda/app.mjs`
- SAM template: `template.yaml`

---

**Need help?** Ask the AI assistant itself! 🛴

