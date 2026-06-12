export type StockImageSource = 'wikimedia' | 'pexels';

export interface StockImageResult {
  imageUrl: string;
  source: StockImageSource;
  query: string;
}

export interface IStockImageService {
  findImage(mainPerson?: string): Promise<StockImageResult | null>;
}
