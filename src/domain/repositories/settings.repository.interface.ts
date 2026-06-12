import type { FacebookSettings } from '../entities/settings.entity.js';

export interface ISettingsRepository {
  getFacebookSettings(): Promise<FacebookSettings | null>;
  saveFacebookSettings(settings: FacebookSettings): Promise<FacebookSettings>;
}
