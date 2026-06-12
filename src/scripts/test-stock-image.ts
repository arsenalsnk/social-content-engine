import 'dotenv/config';

import { loadEnvConfig } from '../config/env.js';
import {
  PexelsProvider,
  StockImageService,
} from '../infrastructure/providers/stock-image/index.js';

async function main(): Promise<void> {
  const env = loadEnvConfig();
  const service = new StockImageService(
    new PexelsProvider(env.stockImage.pexelsApiKey),
    env.stockImage.defaultPexelsQuery,
  );

  console.log('USE_NEWS_IMAGES:', env.stockImage.useNewsImages);
  console.log('Pexels configured:', Boolean(env.stockImage.pexelsApiKey));

  for (const person of ['Bukayo Saka', undefined]) {
    console.log(`\n=== Search: ${person ?? '(no person)'} ===`);
    const result = await service.findImage(person);
    if (!result) {
      console.log('No image found');
      continue;
    }

    console.log('Source:', result.source);
    console.log('Query:', result.query);
    console.log('URL:', result.imageUrl);
  }
}

main().catch((error: unknown) => {
  console.error('Stock image test failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
