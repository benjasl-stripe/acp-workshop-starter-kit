import { getConfig } from './config';
import type { Product } from './products';
import { formatProductsForAI } from './products';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  content: string;
  cached: boolean;
}

export async function sendChatMessage(
  messages: Message[], 
  products?: Product[]
): Promise<ChatResponse> {
  const config = getConfig();

  if (!config.lambdaEndpoint || !config.workshopSecret) {
    throw new Error('Please configure your Lambda endpoint and Workshop secret in the settings.');
  }

  const workshopContext = buildWorkshopContext(products);

  const response = await fetch(config.lambdaEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Workshop-Secret': config.workshopSecret,
    },
    body: JSON.stringify({
      messages,
      workshopContext,
      currentPage: 'AI Chat - Next.js',
      currentUrl: typeof window !== 'undefined' ? window.location.href : '',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return await response.json();
}

function buildWorkshopContext(products?: Product[]): string {
  const productsContext = products && products.length > 0 
    ? `\n\nAvailable Products:\n${formatProductsForAI(products)}\n\nIMPORTANT: When recommending or showing products, use this format to display product cards:
[PRODUCT:id] or [PRODUCT:title]

The product cards will be displayed horizontally in a beautiful scrollable row. When showing multiple products, place them together:

Examples:
- Single product: "Here's what I recommend: [PRODUCT:1]"
- Multiple products: "Check out these options: [PRODUCT:1] [PRODUCT:2] [PRODUCT:3]"
- All products: "Here's everything we have: [PRODUCT:1] [PRODUCT:2] [PRODUCT:3] [PRODUCT:4] [PRODUCT:5]"

The cards will automatically arrange horizontally with scroll. Always show products when asked, don't just describe them.`
    : '\n\n⚠️ No products are currently available in the catalog.';

  return `You are a helpful AI assistant. When users ask about products, show them beautiful visual product cards.${productsContext}`;
}

