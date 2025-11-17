# 📊 DynamoDB Integration Guide

Your Lambda function now has a DynamoDB table for storing chat analytics and caching responses!

---

## 🗄️ Table Structure

### Table Name
`ai-chat-ChatData` (auto-generated based on stack name)

### Schema
```
Partition Key (pk): String - Used to group related data
Sort Key (sk): String - Used to order items within a partition
TTL Field (ttl): Number - Auto-deletes old data after expiration
```

### Flexible Design
This is a **single-table design** that can store multiple types of data:
- Analytics logs
- Cached responses
- User sessions
- Rate limiting data
- Any other chat-related data

---

## 📈 Current Implementation: Analytics Logging

### What's Being Tracked

Every chat request automatically logs:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `pk` | String | `ANALYTICS#YYYY-MM-DD` | `ANALYTICS#2025-10-27` |
| `sk` | String | `{timestamp}#{random}` | `1730000000000#a7x3k` |
| `currentPage` | String | Page user is viewing | `"Getting Started"` |
| `currentUrl` | String | Full URL user is on | `"http://localhost:5174/module/0/chapter/1"` |
| `question` | String | User's question (truncated) | `"What is Stripe MCP?"` |
| `responseTime` | Number | Response time in ms | `1250` |
| `tokenCount` | Number | Approximate tokens used | `10500` |
| `timestamp` | String | ISO 8601 timestamp | `"2025-10-27T10:30:00Z"` |
| `ttl` | Number | Unix timestamp for auto-delete | `1743456000` |

### Data Retention
- **Auto-delete after 90 days** (configurable in Lambda code)
- DynamoDB automatically removes expired items
- No manual cleanup needed!

---

## 🔍 Querying Analytics Data

### View Today's Analytics

```bash
aws dynamodb query \
  --table-name ai-chat-ChatData \
  --key-condition-expression "pk = :pk" \
  --expression-attribute-values '{":pk":{"S":"ANALYTICS#2025-10-27"}}'
```

### View All Questions from a Specific Page

```bash
aws dynamodb scan \
  --table-name ai-chat-ChatData \
  --filter-expression "currentPage = :page" \
  --expression-attribute-values '{":page":{"S":"Getting Started"}}'
```

### View Questions from a Specific URL

```bash
aws dynamodb scan \
  --table-name ai-chat-ChatData \
  --filter-expression "contains(currentUrl, :url)" \
  --expression-attribute-values '{":url":{"S":"module/1"}}'
```

### Get Average Response Time (Last 7 Days)

```bash
# Use AWS CLI with jq for processing
for i in {0..6}; do
  date=$(date -u -d "$i days ago" +%Y-%m-%d)
  aws dynamodb query \
    --table-name ai-chat-ChatData \
    --key-condition-expression "pk = :pk" \
    --expression-attribute-values "{\":pk\":{\"S\":\"ANALYTICS#$date\"}}" \
    --output json
done | jq '[.Items[].responseTime.N | tonumber] | add / length'
```

---

## 💾 Use Cases & Examples

### 1. Track Most Common Questions

Query DynamoDB and analyze `question` field:

```javascript
// In Lambda or separate analysis script
const questions = {};

items.forEach(item => {
  const q = item.question.S.toLowerCase();
  questions[q] = (questions[q] || 0) + 1;
});

const topQuestions = Object.entries(questions)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('Top 10 Questions:', topQuestions);
```

**Why?** Identify which topics need better documentation.

---

### 2. Monitor Performance by Page

```javascript
// Group by page and calculate avg response time
const pageStats = {};

items.forEach(item => {
  const page = item.currentPage.S;
  const time = parseInt(item.responseTime.N);
  
  if (!pageStats[page]) {
    pageStats[page] = { total: 0, count: 0 };
  }
  
  pageStats[page].total += time;
  pageStats[page].count += 1;
});

Object.entries(pageStats).forEach(([page, stats]) => {
  console.log(`${page}: ${(stats.total / stats.count).toFixed(0)}ms avg`);
});
```

**Why?** Find pages where users need more AI help (complexity indicators).

---

### 3. Track Popular URLs/Routes

```javascript
// Group by URL path
const urlStats = {};

items.forEach(item => {
  const url = item.currentUrl.S;
  const path = new URL(url).pathname; // Extract path from full URL
  
  urlStats[path] = (urlStats[path] || 0) + 1;
});

Object.entries(urlStats)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([path, count]) => {
    console.log(`${path}: ${count} questions`);
  });
```

**Why?** Identify which specific pages/routes generate the most questions.

---

### 4. Cost Tracking

```javascript
// Calculate estimated costs
const COST_PER_1K_TOKENS = 0.0005; // GPT-3.5 input

let totalTokens = 0;
items.forEach(item => {
  totalTokens += parseInt(item.tokenCount.N);
});

const estimatedCost = (totalTokens / 1000) * COST_PER_1K_TOKENS;
console.log(`Total tokens: ${totalTokens}`);
console.log(`Estimated cost: $${estimatedCost.toFixed(2)}`);
```

**Why?** Track AI spending over time.

---

### 5. Response Caching (Future Enhancement)

Store frequently asked questions with their answers:

```javascript
// Add to Lambda code
async function cacheResponse(question, response) {
  const tableName = process.env.DYNAMODB_TABLE;
  const questionHash = hashString(question); // Simple hash function
  
  const item = {
    pk: `CACHE#${questionHash}`,
    sk: 'response',
    question,
    response,
    hitCount: 1,
    timestamp: new Date().toISOString(),
    ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Store in DynamoDB...
}

async function checkCache(question) {
  const tableName = process.env.DYNAMODB_TABLE;
  const questionHash = hashString(question);
  
  // Query DynamoDB for cached response
  const result = await dynamodb.getItem({
    TableName: tableName,
    Key: {
      pk: { S: `CACHE#${questionHash}` },
      sk: { S: 'response' }
    }
  });
  
  if (result.Item) {
    // Update hit count
    // Return cached response
    return result.Item.response.S;
  }
  
  return null;
}
```

**Why?** Save money on repeated questions (100% savings on cache hits!).

---

### 6. Rate Limiting by IP

Track requests per IP address:

```javascript
async function checkRateLimit(ip) {
  const tableName = process.env.DYNAMODB_TABLE;
  const today = new Date().toISOString().split('T')[0];
  
  // Check requests from this IP today
  const result = await dynamodb.query({
    TableName: tableName,
    KeyConditionExpression: 'pk = :pk',
    FilterExpression: 'ip = :ip',
    ExpressionAttributeValues: {
      ':pk': { S: `RATELIMIT#${today}` },
      ':ip': { S: ip }
    }
  });
  
  if (result.Items.length > 100) {
    throw new Error('Rate limit exceeded');
  }
  
  // Log this request
  await dynamodb.putItem({
    TableName: tableName,
    Item: {
      pk: { S: `RATELIMIT#${today}` },
      sk: { S: `${Date.now()}#${ip}` },
      ip: { S: ip },
      timestamp: { S: new Date().toISOString() },
      ttl: { N: (Math.floor(Date.now() / 1000) + 86400).toString() } // 24h
    }
  });
}
```

**Why?** Prevent abuse and control costs.

---

## 💰 Cost Estimation

### DynamoDB Pricing (Pay-per-request mode)

| Operation | Cost |
|-----------|------|
| Write request | $1.25 per million writes |
| Read request | $0.25 per million reads |
| Storage | $0.25 per GB-month |

### Example Monthly Costs

**Small Workshop (1,000 questions/month):**
- Writes: 1,000 × $1.25/million = **$0.001**
- Storage: ~1 MB = **$0.00**
- **Total: <$0.01/month** ✅

**Medium Workshop (10,000 questions/month):**
- Writes: 10,000 × $1.25/million = **$0.01**
- Storage: ~10 MB = **$0.00**
- **Total: ~$0.01/month** ✅

**Large Workshop (100,000 questions/month):**
- Writes: 100,000 × $1.25/million = **$0.13**
- Storage: ~100 MB = **$0.02**
- **Total: ~$0.15/month** ✅

### Cost vs. Value

Compare to alternative analytics solutions:
- **Google Analytics**: Free, but limited data
- **Mixpanel**: $25+/month
- **Custom logging**: $5-50/month
- **DynamoDB**: **<$1/month for most use cases** ✅

---

## 🚀 Deployment

The table is automatically created when you deploy:

```bash
cd ai-chat
sam build
sam deploy --parameter-overrides \
  OpenAIApiKey=sk-your-key \
  WorkshopSecret=your-secret
```

**That's it!** The table and permissions are set up automatically.

---

## 📊 Monitoring

### View Table in AWS Console

1. Go to AWS Console → DynamoDB
2. Find table: `ai-chat-ChatData`
3. Click "Explore table items"
4. View your analytics data!

### CloudWatch Metrics

DynamoDB automatically tracks:
- Read/Write capacity usage
- Throttled requests
- System errors
- User errors

Access via: CloudWatch → Metrics → DynamoDB

---

## 🔧 Customization

### Change TTL Duration

In `lambda/app.mjs`, line 32:

```javascript
// Current: 90 days
ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)

// Change to 30 days:
ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)

// Change to 1 year:
ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
```

### Add Custom Fields

Modify the `logAnalytics` function:

```javascript
const item = {
  pk: `ANALYTICS#${new Date().toISOString().split('T')[0]}`,
  sk: `${Date.now()}#${Math.random().toString(36).substring(7)}`,
  currentPage,
  question,
  responseTime,
  tokenCount,
  timestamp,
  ttl,
  // Add custom fields:
  userAgent: event.headers['user-agent'],
  sourceIp: event.requestContext.identity.sourceIp,
  model: 'gpt-3.5-turbo',
  region: process.env.AWS_REGION
};
```

### Change Partition Key Strategy

Current: Group by date (`ANALYTICS#2025-10-27`)

Alternative strategies:

**By Page:**
```javascript
pk: `PAGE#${currentPage.replace(/\s+/g, '-')}`
```

**By User (if you have user IDs):**
```javascript
pk: `USER#${userId}`
```

**By Hour (for high-traffic):**
```javascript
pk: `ANALYTICS#${new Date().toISOString().substring(0, 13)}` // 2025-10-27T10
```

---

## 🧪 Testing

### Test Analytics Logging

```bash
# Make a chat request
curl -X POST https://YOUR_ENDPOINT/Prod/ \
  -H "Content-Type: application/json" \
  -H "X-Workshop-Secret: your-secret" \
  -d '{
    "messages": [{"role": "user", "content": "Test question"}],
    "workshopContext": "Test context",
    "currentPage": "Test Page"
  }'

# Check DynamoDB
aws dynamodb scan \
  --table-name ai-chat-ChatData \
  --limit 10
```

### Verify TTL is Working

```bash
# Check table TTL settings
aws dynamodb describe-table \
  --table-name ai-chat-ChatData \
  --query 'Table.TimeToLiveDescription'
```

Should show:
```json
{
  "TimeToLiveStatus": "ENABLED",
  "AttributeName": "ttl"
}
```

---

## 🐛 Troubleshooting

### Analytics Not Logging?

**Check Lambda has permissions:**
```bash
aws lambda get-policy --function-name ai-chat-PostChatFunction
```

**Check CloudWatch logs:**
```bash
sam logs -n PostChatFunction --stack-name ai-chat --tail
```

Look for: `"Failed to log analytics"`

**Verify table exists:**
```bash
aws dynamodb describe-table --table-name ai-chat-ChatData
```

---

### Throttling Errors?

If you see `ProvisionedThroughputExceededException`:

1. **Switch to provisioned capacity** (if predictable traffic):
   ```yaml
   # In template.yaml
   BillingMode: PROVISIONED
   ProvisionedThroughput:
     ReadCapacityUnits: 5
     WriteCapacityUnits: 5
   ```

2. **Enable auto-scaling** (recommended):
   ```yaml
   # Add to template.yaml
   ApplicationAutoScalingScalingPolicy:
     Type: AWS::ApplicationAutoScaling::ScalingPolicy
     # ... (see AWS docs)
   ```

3. **Add retry logic** in Lambda (already built-in with AWS SDK)

---

## 📚 Additional Resources

**DynamoDB Documentation:**
- [Single Table Design Best Practices](https://aws.amazon.com/blogs/database/single-table-design-best-practices/)
- [TTL Documentation](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html)
- [Query vs Scan](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html)

**Analytics Ideas:**
- Build a QuickSight dashboard
- Export to S3 for long-term storage
- Create Lambda function to generate weekly reports
- Set up CloudWatch alarms for anomalies

---

## 🎯 Quick Reference

### Table Name
```bash
aws dynamodb describe-table --table-name ai-chat-ChatData --query 'Table.TableName'
```

### Item Count
```bash
aws dynamodb describe-table --table-name ai-chat-ChatData --query 'Table.ItemCount'
```

### Today's Questions
```bash
TODAY=$(date +%Y-%m-%d)
aws dynamodb query \
  --table-name ai-chat-ChatData \
  --key-condition-expression "pk = :pk" \
  --expression-attribute-values "{\":pk\":{\"S\":\"ANALYTICS#$TODAY\"}}"
```

### Delete All Data (Careful!)
```bash
# Easier to delete and recreate the table
aws dynamodb delete-table --table-name ai-chat-ChatData
sam deploy  # Recreates empty table
```

---

**Your DynamoDB table is ready to use!** 🎉

Analytics are being logged automatically on every chat request. Check the AWS Console to see your data!

