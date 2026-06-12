import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

import puppeteer from 'puppeteer';

import type { IImageService } from '../../../domain/services/image.service.interface.js';
import {
  IMAGE_HEIGHT,
  IMAGE_WIDTH,
} from '../../../shared/constants/image.constants.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import type {
  GeneratedImage,
  ImageGenerationInput,
} from '../../../shared/types/image.types.js';
import { pickImageTheme } from '../../../shared/utils/image-theme.util.js';
import { buildImageHtml } from './templates/base.template.js';

export class ImageService implements IImageService {
  constructor(private readonly outputDir: string) {}

  async generate(input: ImageGenerationInput): Promise<GeneratedImage> {
    const theme = pickImageTheme(input.themeSeed);
    const html = buildImageHtml(
      input.templateType,
      input.title,
      input.caption,
      input.themeSeed,
      input.imageUrl,
      input.mainPerson,
    );
    const outputPath = join(
      this.outputDir,
      `${Date.now()}-${theme.id}.png`,
    );

    try {
      await mkdir(this.outputDir, { recursive: true });

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        await page.setViewport({
          width: IMAGE_WIDTH,
          height: IMAGE_HEIGHT,
          deviceScaleFactor: 1,
        });
        await page.setContent(html, { waitUntil: 'load', timeout: 30000 });

        if (input.imageUrl?.trim()) {
          await page
            .waitForFunction(
              `(() => {
                const img = document.querySelector('.hero-image');
                return !img || (img.complete && img.naturalWidth > 0);
              })()`,
              { timeout: 15000 },
            )
            .catch(() => undefined);
        }

        await page.screenshot({
          path: outputPath,
          type: 'png',
          clip: {
            x: 0,
            y: 0,
            width: IMAGE_WIDTH,
            height: IMAGE_HEIGHT,
          },
        });
      } finally {
        await browser.close();
      }

      return {
        imagePath: outputPath,
        width: IMAGE_WIDTH,
        height: IMAGE_HEIGHT,
      };
    } catch (error) {
      throw new ProviderError('Failed to generate image', 'image', error);
    }
  }
}
