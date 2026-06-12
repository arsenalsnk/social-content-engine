import { ImageTemplateType } from '../../../../shared/enums/image-template-type.enum.js';
import {
  getTemplateBadgeLabel,
  pickImageTheme,
} from '../../../../shared/utils/image-theme.util.js';

export function buildImageHtml(
  templateType: ImageTemplateType,
  title: string,
  caption: string,
  themeSeed: string,
  imageUrl?: string,
  mainPerson?: string,
): string {
  const theme = pickImageTheme(themeSeed);
  const badgeLabel = getTemplateBadgeLabel(templateType);
  const excerpt = caption.length > 160 ? `${caption.slice(0, 157)}...` : caption;
  const safeImageUrl = imageUrl?.trim() ? escapeHtml(imageUrl.trim()) : '';
  const safeMainPerson = mainPerson?.trim() ? escapeHtml(mainPerson.trim()) : '';
  const hasHero = Boolean(safeImageUrl);

  const badgeSection = badgeLabel
    ? `<span class="badge">${escapeHtml(badgeLabel)}</span>`
    : '';

  const personLabel = safeMainPerson
    ? `<div class="person-label">${safeMainPerson}</div>`
    : '';

  const heroImageClass = safeMainPerson ? 'hero-image portrait' : 'hero-image';

  const heroSection = hasHero
    ? `<div class="hero-wrap">
        <div class="hero">
          <img class="${heroImageClass}" src="${safeImageUrl}" alt="${safeMainPerson || 'news'}" />
        </div>
        ${personLabel}
      </div>`
    : '';

  const layoutClass = [
    'card',
    hasHero ? `with-hero hero-${theme.heroPosition}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const titleSize = hasHero
    ? theme.heroPosition === 'top'
      ? '48px'
      : '52px'
    : '72px';
  const captionSize = hasHero
    ? theme.heroPosition === 'top'
      ? '26px'
      : '28px'
    : '34px';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 1200px;
      font-family: ${theme.fontFamily};
      background: ${theme.bodyBackground};
      color: ${theme.titleColor};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      width: 1040px;
      height: 1040px;
      border-radius: 32px;
      background: ${theme.cardBackground};
      padding: 56px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: ${theme.cardShadow};
    }
    .content {
      display: block;
    }
    .card.with-hero.hero-left .content,
    .card.with-hero.hero-right .content {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 36px;
      align-items: start;
    }
    .card.with-hero.hero-right .content {
      direction: rtl;
    }
    .card.with-hero.hero-right .text {
      direction: ltr;
    }
    .card.with-hero.hero-top .content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .card.with-hero.hero-top .hero {
      width: 100%;
      height: 360px;
    }
    .badge {
      display: inline-block;
      background: ${theme.accentColor};
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 14px 22px;
      border-radius: 999px;
      margin-bottom: 28px;
    }
    .hero-wrap {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .hero {
      width: 360px;
      height: 420px;
      border-radius: 24px;
      overflow: hidden;
      border: 4px solid ${theme.heroBorderColor};
      background: rgba(0, 0, 0, 0.2);
    }
    .person-label {
      display: inline-block;
      align-self: flex-start;
      background: ${theme.accentColor};
      color: #fff;
      font-size: 24px;
      font-weight: 700;
      padding: 10px 18px;
      border-radius: 999px;
    }
    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
    }
    .hero-image.portrait {
      object-position: center 22%;
    }
    .title {
      font-size: ${titleSize};
      line-height: 1.15;
      font-weight: 800;
      color: ${theme.titleColor};
      margin-top: ${badgeLabel || hasHero ? '0' : '12px'};
    }
    .caption {
      font-size: ${captionSize};
      line-height: 1.45;
      color: ${theme.captionColor};
      margin-top: 28px;
      white-space: pre-wrap;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 36px;
      font-size: 24px;
      color: ${theme.footerColor};
    }
    .logo {
      font-size: 36px;
      font-weight: 800;
      color: ${theme.logoColor};
    }
  </style>
</head>
<body>
  <div class="${layoutClass}">
    <div>
      ${badgeSection}
      <div class="content">
        ${heroSection}
        <div class="text">
          <h1 class="title">${escapeHtml(title)}</h1>
          <p class="caption">${escapeHtml(excerpt)}</p>
        </div>
      </div>
    </div>
    <div class="footer">
      <span class="logo">ARSENAL FC</span>
      <span>Sakon Gunners</span>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
