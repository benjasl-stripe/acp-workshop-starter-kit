# Product Images

## How to Add Images

1. Place your product images in this folder (`merchant-backend/public/images/products/`)
2. Name them appropriately (e.g., `book-cover-001.jpg`, `product-widget.png`)

## How to Reference Images in products.js

Once your images are in this folder, reference them in your products like this:

```javascript
{
  "id": "EXAMPLE-001",
  "title": "Example Product",
  "price": 29.99,
  "thumbnail": "http://localhost:4000/public/images/products/your-image.jpg",
  // ... other fields
}
```

## URL Pattern

- **Development**: `http://localhost:4000/public/images/products/filename.jpg`
- **Production**: Replace `localhost:4000` with your actual domain

## Supported Image Formats

- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`
- `.svg`

## Tips

- Use descriptive filenames (e.g., `poor-charlies-almanack.jpg` instead of `img1.jpg`)
- Optimize images before uploading (recommended max size: 500KB per image)
- Recommended dimensions: 300x400px for product thumbnails

