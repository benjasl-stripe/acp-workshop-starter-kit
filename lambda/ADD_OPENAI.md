# Adding OpenAI to Your Lambda Function

Your Lambda is ready to receive requests from the frontend! Now add the OpenAI API call to make it work.

## 🚀 Quick Setup

### 1. Add OpenAI Package

```bash
cd lambda
npm install openai
```

### 2. Update `app.mjs`

Replace the TODO section (lines 51-79) with this code:

```javascript
// Get OpenAI API key from environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  return {
    statusCode: 500,
    headers,
    body: JSON.stringify({ error: 'OpenAI API key not configured' })
  };
}

// Call OpenAI API
const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo', // or 'gpt-4' for better quality
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});

if (!openaiResponse.ok) {
  const error = await openaiResponse.json();
  throw new Error(error.error?.message || 'OpenAI API error');
}

const data = await openaiResponse.json();
const responseContent = data.choices[0].message.content;
```

### 3. Set Environment Variable in AWS

#### Option A: AWS Console
1. Go to Lambda console
2. Select your function
3. Configuration → Environment variables → Edit
4. Add:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-openai-key-here`

#### Option B: AWS CLI
```bash
aws lambda update-function-configuration \
  --function-name your-function-name \
  --environment "Variables={OPENAI_API_KEY=sk-your-key-here}"
```

#### Option C: SAM Template
Update `template.yaml`:
```yaml
Environment:
  Variables:
    OPENAI_API_KEY: !Ref OpenAIApiKey

Parameters:
  OpenAIApiKey:
    Type: String
    NoEcho: true
```

### 4. Redeploy

```bash
cd ai-chat
sam build && sam deploy
```

### 5. Test It!

Your chat should now work with real AI responses! 🎉

---

## 🎯 Alternative: Use Anthropic Claude

Replace OpenAI with Claude for better context handling:

### 1. Install Anthropic SDK
```bash
npm install @anthropic-ai/sdk
```

### 2. Update Lambda Code
```javascript
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  })
});

const data = await response.json();
const responseContent = data.content[0].text;
```

---

## 💰 Cost Estimates

### OpenAI (GPT-3.5 Turbo)
- Input: $0.0005 per 1K tokens
- Output: $0.0015 per 1K tokens
- **Typical question**: ~$0.03-0.08

### OpenAI (GPT-4)
- Input: $0.01 per 1K tokens
- Output: $0.03 per 1K tokens
- **Typical question**: ~$0.50-1.50

### Anthropic Claude
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens
- **Typical question**: ~$0.10-0.30

---

## 🔍 Testing

### Test from Command Line
```bash
curl -X POST https://your-api-gateway-url/Prod/ \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "What is Stripe?"}],
    "systemPrompt": "You are a helpful assistant.",
    "currentPage": "Test"
  }'
```

### Check Logs
```bash
aws logs tail /aws/lambda/your-function-name --follow
```

---

## 🐛 Troubleshooting

### "OpenAI API key not configured"
- Check environment variable is set in Lambda
- Verify key starts with `sk-`

### "Invalid API key"
- Get new key from https://platform.openai.com
- Make sure key has credits

### "Rate limit exceeded"
- You've hit OpenAI's rate limit
- Upgrade to paid tier
- Add retry logic

### CORS error in browser
- Check Lambda headers include proper CORS
- Verify API Gateway has CORS enabled

---

## ✅ Complete Lambda Code Example

Here's the full code with OpenAI integrated:

```javascript
export const lambdaHandler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { messages, systemPrompt, currentPage } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid request' })
      };
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }

    const data = await openaiResponse.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: data.choices[0].message.content
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process request',
        message: error.message
      })
    };
  }
};
```

---

**That's it!** Your AI chat is now fully functional and secure! 🎉

