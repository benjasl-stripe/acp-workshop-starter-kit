# 🏪 Merchant Backend

A standalone Express.js API server for managing products and merchant data.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd merchant-backend
npm install
```

### 2. Create Environment File

Create `.env` file:

```bash
PORT=4000
NODE_ENV=development
```

### 3. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs on: **http://localhost:4000**

---

## 📍 API Endpoints

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with filters) |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create new product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/meta/categories` | Get all categories |
| GET | `/api/products/meta/stats` | Get statistics |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/` | API info |

---

## 📖 Usage Examples

### Get All Products

```bash
curl http://localhost:4000/api/products
```

**Response:**
```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "products": [
    {
      "id": 1,
      "title": "Premium JavaScript Course",
      "price": 49.99,
      "currency": "USD",
      "thumbnail": "https://...",
      "description": "...",
      "category": "Courses",
      "inStock": true,
      "rating": 4.8,
      "reviews": 1250
    }
  ]
}
```

### Filter Products

```bash
# By category
curl "http://localhost:4000/api/products?category=Courses"

# By stock status
curl "http://localhost:4000/api/products?inStock=true"

# By price range
curl "http://localhost:4000/api/products?minPrice=30&maxPrice=100"

# Search by keyword
curl "http://localhost:4000/api/products?search=javascript"

# Combine filters
curl "http://localhost:4000/api/products?category=Courses&inStock=true&maxPrice=60"
```

### Get Single Product

```bash
curl http://localhost:4000/api/products/1
```

### Create Product

**macOS/Linux:**
```bash
curl -X POST http://localhost:4000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Product",
    "price": 29.99,
    "description": "Amazing product",
    "category": "Books",
    "inStock": true
  }'
```

**Windows (CMD):**
```cmd
curl -X POST http://localhost:4000/api/products -H "Content-Type: application/json" -d "{\"title\": \"New Product\", \"price\": 29.99, \"description\": \"Amazing product\", \"category\": \"Books\", \"inStock\": true}"
```

**Windows (PowerShell):**
```powershell
curl -X POST http://localhost:4000/api/products -H "Content-Type: application/json" -d '{"title": "New Product", "price": 29.99, "description": "Amazing product", "category": "Books", "inStock": true}'
```

### Update Product

**macOS/Linux:**
```bash
curl -X PUT http://localhost:4000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{
    "price": 39.99,
    "inStock": false
  }'
```

**Windows (CMD):**
```cmd
curl -X PUT http://localhost:4000/api/products/1 -H "Content-Type: application/json" -d "{\"price\": 39.99, \"inStock\": false}"
```

**Windows (PowerShell):**
```powershell
curl -X PUT http://localhost:4000/api/products/1 -H "Content-Type: application/json" -d '{"price": 39.99, "inStock": false}'
```

### Delete Product

```bash
curl -X DELETE http://localhost:4000/api/products/1
```

### Get Categories

```bash
curl http://localhost:4000/api/products/meta/categories
```

### Get Statistics

```bash
curl http://localhost:4000/api/products/meta/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 5,
    "inStock": 4,
    "outOfStock": 1,
    "categories": 3,
    "averagePrice": 85.99,
    "totalValue": 429.95
  }
}
```

---

## 🔗 Connect to AI Chat

### Configure AI Chat App

1. Start the merchant backend: `npm run dev` (port 4000)
2. Start Next.js app: `npm run dev` (port 3000)
3. Open http://localhost:3000
4. Click **⚙️ Configuration**
5. Set **Products API URL**: `http://localhost:4000/api/products`
6. Save!

Now the AI can answer questions about your products!

---

## 📁 Project Structure

```
merchant-backend/
├── server.js              # Main Express server
├── routes/
│   ├── products.js       # Products endpoints
│   └── health.js         # Health check
├── package.json          # Dependencies
├── .env                  # Environment variables (create this)
├── .env.example          # Example env file
└── README.md            # This file
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# Server
PORT=4000
NODE_ENV=development

# CORS (optional)
ALLOWED_ORIGINS=http://localhost:3000

# API Key (optional - for future auth)
API_KEY=your-secret-key
```

### Default Products

The server comes with 5 sample products. Edit `routes/products.js` to customize:

```javascript
let products = [
  {
    id: 1,
    title: "Your Product",
    price: 99.99,
    // ... more fields
  },
];
```

---

## 🗄️ Adding a Database

### Option 1: PostgreSQL

```bash
npm install pg
```

```javascript
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// In routes/products.js
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM products');
  res.json({ products: result.rows });
});
```

### Option 2: MongoDB

```bash
npm install mongoose
```

```javascript
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URL);

const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  // ...
});

const Product = mongoose.model('Product', ProductSchema);
```

---

## 🔒 Adding Authentication

### API Key Authentication

```javascript
// middleware/auth.js
export const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }
  
  next();
};

// In routes
import { authenticateApiKey } from '../middleware/auth.js';
router.post('/', authenticateApiKey, (req, res) => {
  // Protected route
});
```

---

## 📊 Features

✅ RESTful API with Express.js  
✅ CORS enabled  
✅ JSON request/response  
✅ Query filtering (category, price, stock, search)  
✅ CRUD operations  
✅ In-memory data store (easy to replace with DB)  
✅ Request logging  
✅ Error handling  
✅ Environment configuration  
✅ Development hot-reload (nodemon)  

---

## 🚢 Deployment

### Deploy to Render/Railway/Fly.io

1. Push to GitHub
2. Connect to deployment platform
3. Set environment variables
4. Deploy!

### Deploy with Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
```

```bash
docker build -t merchant-backend .
docker run -p 4000:4000 merchant-backend
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=5000 npm run dev
```

### CORS Errors

The server allows all origins by default. To restrict:

```javascript
// In server.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
```

---

## 🎯 Next Steps

- [ ] Add database (PostgreSQL/MongoDB)
- [ ] Add authentication/authorization
- [ ] Add rate limiting
- [ ] Add input validation (express-validator)
- [ ] Add file uploads for product images
- [ ] Add pagination for products list
- [ ] Add product categories management
- [ ] Add orders/transactions endpoints
- [ ] Add webhooks for external integrations
- [ ] Add API documentation (Swagger/OpenAPI)

---

## 📚 API Documentation

### Product Object Schema

```typescript
{
  id: number;              // Unique identifier
  title: string;           // Product name
  price: number;           // Price in USD
  currency: string;        // Currency code (USD)
  thumbnail: string;       // Image URL
  description: string;     // Product description
  category: string;        // Product category
  inStock: boolean;        // Availability
  rating: number;          // Average rating (0-5)
  reviews: number;         // Number of reviews
  created: string;         // ISO timestamp
  updated?: string;        // ISO timestamp (if updated)
}
```

---

**Built with Express.js** 🚀

