import { ImageTemplateType } from '../enums/image-template-type.enum.js';

export interface ImageTheme {
  id: string;
  bodyBackground: string;
  cardBackground: string;
  cardShadow: string;
  accentColor: string;
  titleColor: string;
  captionColor: string;
  footerColor: string;
  logoColor: string;
  heroBorderColor: string;
  fontFamily: string;
  heroPosition: 'left' | 'right' | 'top';
}

const THEMES: ImageTheme[] = [
  {
    id: 'classic-red',
    bodyBackground: 'linear-gradient(160deg, #0b1d3a 0%, #9b1b30 55%, #ffffff 55%)',
    cardBackground: 'rgba(7, 17, 36, 0.92)',
    cardShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
    accentColor: '#ef0107',
    titleColor: '#ffffff',
    captionColor: '#d7e3ff',
    footerColor: '#9fb4df',
    logoColor: '#ef0107',
    heroBorderColor: '#ef0107',
    fontFamily: 'Arial, Helvetica, sans-serif',
    heroPosition: 'left',
  },
  {
    id: 'midnight-gold',
    bodyBackground: 'radial-gradient(circle at top left, #1a2744 0%, #050b16 70%)',
    cardBackground: 'linear-gradient(145deg, rgba(18, 28, 52, 0.96), rgba(8, 12, 24, 0.98))',
    cardShadow: '0 28px 90px rgba(0, 0, 0, 0.55)',
    accentColor: '#d4af37',
    titleColor: '#fff8e7',
    captionColor: '#c9d4ef',
    footerColor: '#8fa0c4',
    logoColor: '#d4af37',
    heroBorderColor: '#d4af37',
    fontFamily: 'Georgia, "Times New Roman", serif',
    heroPosition: 'right',
  },
  {
    id: 'crimson-burst',
    bodyBackground: 'linear-gradient(135deg, #ef0107 0%, #7a0010 45%, #12040a 100%)',
    cardBackground: 'rgba(255, 255, 255, 0.08)',
    cardShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
    accentColor: '#ffffff',
    titleColor: '#ffffff',
    captionColor: '#ffe8ea',
    footerColor: '#ffc9cf',
    logoColor: '#ffffff',
    heroBorderColor: '#ffffff',
    fontFamily: 'Tahoma, Verdana, sans-serif',
    heroPosition: 'top',
  },
  {
    id: 'navy-clean',
    bodyBackground: 'linear-gradient(180deg, #063672 0%, #0a1f44 100%)',
    cardBackground: 'rgba(255, 255, 255, 0.95)',
    cardShadow: '0 18px 50px rgba(0, 0, 0, 0.25)',
    accentColor: '#ef0107',
    titleColor: '#0b1d3a',
    captionColor: '#334155',
    footerColor: '#64748b',
    logoColor: '#ef0107',
    heroBorderColor: '#063672',
    fontFamily: 'Arial, Helvetica, sans-serif',
    heroPosition: 'left',
  },
  {
    id: 'split-diagonal',
    bodyBackground: 'linear-gradient(125deg, #ffffff 42%, #ef0107 42%, #9b1b30 100%)',
    cardBackground: 'rgba(11, 29, 58, 0.9)',
    cardShadow: '0 22px 70px rgba(11, 29, 58, 0.35)',
    accentColor: '#ef0107',
    titleColor: '#ffffff',
    captionColor: '#dbe7ff',
    footerColor: '#b8c9e8',
    logoColor: '#ef0107',
    heroBorderColor: '#ffffff',
    fontFamily: '"Segoe UI", Tahoma, sans-serif',
    heroPosition: 'right',
  },
  {
    id: 'stadium-night',
    bodyBackground: 'linear-gradient(180deg, #020617 0%, #1e293b 55%, #450a0a 100%)',
    cardBackground: 'linear-gradient(160deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.88))',
    cardShadow: '0 30px 100px rgba(239, 1, 7, 0.15)',
    accentColor: '#ef0107',
    titleColor: '#f8fafc',
    captionColor: '#cbd5e1',
    footerColor: '#94a3b8',
    logoColor: '#ef0107',
    heroBorderColor: '#ef0107',
    fontFamily: 'Arial, Helvetica, sans-serif',
    heroPosition: 'top',
  },
];

export function pickImageTheme(seed: string): ImageTheme {
  let hash = 0;

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return THEMES[hash % THEMES.length]!;
}

export function getTemplateBadgeLabel(
  templateType: ImageTemplateType,
): string | null {
  switch (templateType) {
    case ImageTemplateType.TRANSFER_NEWS:
      return 'ข่าวย้ายทีม';
    case ImageTemplateType.MATCH_RESULT:
      return 'ผลการแข่งขัน';
    case ImageTemplateType.MATCH_PREVIEW:
      return 'พรีวิวแมตช์';
    default:
      return null;
  }
}
