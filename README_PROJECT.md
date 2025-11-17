# 🤖 AI Workshop Assistant

A serverless AI-powered chat assistant with a beautiful web interface. Built with AWS Lambda, OpenAI GPT-3.5, and vanilla JavaScript.

![AI Chat Interface](https://img.shields.io/badge/AWS-Lambda-FF9900?style=for-the-badge&logo=amazon-aws)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?style=for-the-badge&logo=openai)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Features

- 🎨 **Beautiful UI** - Modern gradient design with smooth animations
- 💬 **Smart Chat** - Context-aware responses using OpenAI GPT-3.5
- ⚡ **Response Caching** - DynamoDB caching for faster repeat questions
- 📊 **Analytics** - Track usage patterns and popular questions
- 🔒 **Secure** - API keys protected server-side, authentication via secret
- 📝 **Markdown Support** - Code blocks and formatting in responses
- 🚀 **Serverless** - No servers to manage, scales automatically
- 💰 **Cost Efficient** - ~$5-10 per 1,000 questions

## 🏗️ Architecture

```
┌─────────────────┐
│  HTML/CSS/JS    │  ← Beautiful frontend (no build required!)
│  Frontend       │
└────────┬────────┘
         │ HTTPS POST
         ▼
┌─────────────────┐
│  API Gateway    │  ← CORS & routing
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lambda         │  ← Node.js 22, validates secrets
│  (Node.js)      │
└────────┬────────┘
         │
    ┌────┴────┬─────────┐
    ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌──────────┐
│ OpenAI │ │DynamoDB│ │CloudWatch│
│ API    │ │(Cache) │ │  (Logs)  │
└────────┘ └────────┘ └──────────┘
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured
- AWS SAM CLI installed
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Node.js 22+ (for Lambda)

### 1. Install Lambda Dependencies

```bash
cd lambda
npm install
cd ..
```

### 2. Deploy Backend

```bash
# Build
sam build

# Deploy with your secrets
sam deploy --parameter-overrides \
  OpenAIApiKey=sk-your-openai-key-here \
  WorkshopSecret=your-secret-key
```

**Save the API endpoint from the output!**

### 3. Open Frontend

```bash
open index.html
```

### 4. Configure

1. Click **"⚙️ Configuration"**
2. Paste your API endpoint
3. Enter your workshop secret
4. Click **"Save Configuration"**

### 5. Start Chatting! 💬

Ask questions and get AI-powered responses!

## 📁 Project Structure

```
ai-chat/
├── index.html              # Frontend chat interface
├── style.css              # Styling (gradient theme)
├── app.js                 # Frontend logic
├── lambda/
│   ├── app.mjs           # Lambda handler (Node.js)
│   └── package.json      # Lambda dependencies
├── template.yaml          # SAM/CloudFormation template
├── samconfig.toml        # SAM deployment config
├── README.md             # Technical documentation
├── FRONTEND_SETUP.md     # Frontend setup guide
├── QUICKSTART.md         # Quick start guide
└── DYNAMODB_GUIDE.md     # DynamoDB setup guide
```

## 🔧 Configuration

### Environment Variables (Lambda)

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `WORKSHOP_SECRET` | Authentication secret | Yes |
| `DYNAMODB_TABLE` | DynamoDB table name | Auto |

### Frontend Configuration

Stored in browser's `localStorage`:
- `lambdaEndpoint` - Your Lambda API endpoint
- `workshopSecret` - Authentication secret

## 💰 Cost Estimate

Based on 1,000 questions/month:

| Service | Cost |
|---------|------|
| Lambda | $0 (free tier) |
| API Gateway | $0 (free tier) |
| DynamoDB | $0 (free tier) |
| OpenAI API | ~$5-10 |
| **Total** | **$5-10/month** |

## 🎨 Customization

### Change Colors

Edit `style.css`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Change AI Behavior

Edit `lambda/app.mjs` - the `guidelines` variable:
```javascript
const guidelines = `Your custom guidelines here...`;
```

### Add Custom Context

Edit `app.js` - the `buildWorkshopContext()` function.

## 📊 Monitoring

### View Lambda Logs
```bash
sam logs -n PostChatFunction --tail
```

### Check OpenAI Usage
https://platform.openai.com/usage

### View DynamoDB Data
AWS Console → DynamoDB → Tables → `ai-chat-ChatData`

## 🔒 Security

- ✅ OpenAI API key never exposed to frontend
- ✅ Workshop secret validates all requests
- ✅ CORS configured for API Gateway
- ✅ DynamoDB auto-expires old data (90 days)
- ✅ NoEcho parameters in CloudFormation

## 🚢 Deployment Options

### AWS (Production)
```bash
sam deploy --guided
```

### Local Testing
```bash
sam local start-api
```

### Frontend Hosting
- GitHub Pages (free)
- AWS S3 + CloudFront
- Netlify / Vercel
- Any static hosting

## 📚 Documentation

- **[README.md](README.md)** - Technical deep dive
- **[FRONTEND_SETUP.md](FRONTEND_SETUP.md)** - Frontend setup guide
- **[QUICKSTART.md](QUICKSTART.md)** - Quick start guide
- **[DYNAMODB_GUIDE.md](DYNAMODB_GUIDE.md)** - DynamoDB setup

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📝 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Built with [AWS SAM](https://aws.amazon.com/serverless/sam/)
- Powered by [OpenAI GPT-3.5](https://openai.com/)
- UI inspired by modern chat interfaces

## 📧 Support

Having issues? Check:
1. Lambda logs: `sam logs -n PostChatFunction --tail`
2. Browser console for frontend errors
3. AWS CloudFormation stack status
4. OpenAI API status

---

**Made with ❤️ for workshops everywhere**

