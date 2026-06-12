export interface IDuplicateDetectionService {
  isDuplicate(url: string, title: string): Promise<boolean>;
}
