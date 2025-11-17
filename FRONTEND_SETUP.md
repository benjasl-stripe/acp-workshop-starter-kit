# 🎨 Frontend Setup Guide

Your AI chat frontend is ready to use! This is a simple HTML/CSS/JavaScript interface that requires no build process.

## 📁 Files Created

- **`index.html`** - Main chat interface
- **`style.css`** - Styling (beautiful gradient theme)
- **`app.js`** - JavaScript logic for API communication

## 🚀 Quick Start

### 1. Deploy Your Lambda Backend (if not done yet)

```bash
cd /Users/benjasl/Desktop/code/ai-chat

# Build the Lambda function
sam build

# Deploy with your OpenAI API key
sam deploy --parameter-overrides \
  OpenAIApiKey=sk-your-openai-key-here \
  WorkshopSecret=my-secret-key-123
```

**Get your OpenAI API key from:** https://platform.openai.com/api-keys

**After deployment**, you'll see output like:
```
Outputs:
ApiEndpoint: https://abc123xyz.execute-api.us-west-2.amazonaws.com/Prod/
```

**Save that endpoint URL!** You'll need it next.

---

### 2. Open the Frontend

Simply open `index.html` in your browser:

```bash
open index.html
```

Or double-click `index.html` in Finder.

---

### 3. Configure the Frontend

1. Click **"⚙️ Configuration"** at the bottom of the chat window
2. Enter your **Lambda Endpoint** (from deployment step above)
3. Enter your **Workshop Secret** (the one you used in deployment)
4. Click **"Save Configuration"**

The configuration is saved in your browser's localStorage, so you only need to do this once!

---

## 💬 Using the Chat

- Type your question in the text box
- Press **Enter** or click **Send**
- The AI will respond based on workshop content
- Responses support markdown formatting including code blocks
- Cached responses show a "⚡ Cached response" indicator

---

## ✨ Features

- **Beautiful UI** with gradient theme
- **Markdown support** for formatted responses
- **Code syntax highlighting** in responses
- **Conversation history** maintained during session
- **Response caching** (via DynamoDB)
- **Error handling** with helpful messages
- **Loading states** with spinner animation
- **Mobile responsive** design

---

## 🔧 Troubleshooting

### "Please configure your Lambda endpoint..."
- Make sure you've deployed the Lambda function
- Click Configuration and enter your API endpoint and secret

### "Failed to get response: HTTP 403"
- Your workshop secret is incorrect
- Check the secret you used during `sam deploy`

### "Failed to get response: HTTP 500"
- Check Lambda logs: `sam logs -n PostChatFunction --tail`
- Verify your OpenAI API key is valid

### Deployment Issues
If you haven't set up AWS CLI:
```bash
# Configure AWS credentials
aws configure
```

---

## 🎯 Testing Without Deployment

If you want to test the Lambda locally:

```bash
# Start local API
sam local start-api

# Use this endpoint in Configuration:
# http://127.0.0.1:3000/
```

---

## 🌐 Hosting the Frontend

This is a static site, so you can host it anywhere:

### Option 1: GitHub Pages
1. Push to a GitHub repo
2. Enable GitHub Pages in Settings
3. Access via `https://yourusername.github.io/ai-chat/`

### Option 2: AWS S3 + CloudFront
```bash
aws s3 sync . s3://your-bucket-name --exclude "lambda/*"
```

### Option 3: Netlify
Just drag and drop the folder into Netlify!

---

## 📊 Monitoring

- **Lambda logs:** `sam logs -n PostChatFunction --tail`
- **OpenAI usage:** https://platform.openai.com/usage
- **DynamoDB table:** Check AWS Console for analytics data

---

## 🎨 Customization

### Change Colors
Edit `style.css` - look for the gradient colors:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Change Workshop Context
Edit `app.js` - the `buildWorkshopContext()` function:
```javascript
function buildWorkshopContext() {
    return `Your custom context here...`;
}
```

### Add More Features
The code is simple and well-commented - feel free to extend it!

---

## 💰 Cost Estimate

- **AWS Lambda:** Free tier covers 1M requests/month
- **API Gateway:** Free tier covers 1M requests/month  
- **DynamoDB:** Free tier covers 25GB + 25 read/write units
- **OpenAI:** ~$0.005 per question (with caching can be 90% less)

**Estimated cost for 1,000 questions/month:** ~$5-10

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)

---

**Enjoy your AI Workshop Assistant! 🚀**

