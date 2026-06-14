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
  const excerpt = caption.length > 140 ? `${caption.slice(0, 137)}...` : caption;
  const safeImageUrl = imageUrl?.trim() ? escapeHtml(imageUrl.trim()) : '';
  const safeMainPerson = mainPerson?.trim() ? escapeHtml(mainPerson.trim()) : '';
  const hasPhoto = Boolean(safeImageUrl);

  const badgeSection = badgeLabel
    ? `<span class="badge">${escapeHtml(badgeLabel)}</span>`
    : '';

  const personSection = safeMainPerson
    ? `<div class="person-name">${safeMainPerson}</div>`
    : '';

  if (hasPhoto) {
    return buildPhotoOverlayHtml({
      theme,
      badgeSection,
      personSection,
      safeImageUrl,
      safeMainPerson,
      title,
      excerpt,
    });
  }

  return buildFallbackHtml({
    theme,
    badgeSection,
    personSection,
    title,
    excerpt,
  });
}

function buildPhotoOverlayHtml(input: {
  theme: ReturnType<typeof pickImageTheme>;
  badgeSection: string;
  personSection: string;
  safeImageUrl: string;
  safeMainPerson: string;
  title: string;
  excerpt: string;
}): string {
  const { theme, badgeSection, personSection, safeImageUrl, safeMainPerson, title, excerpt } =
    input;
  const imagePositionClass = safeMainPerson ? 'photo portrait' : 'photo';

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 1200px;
      font-family: ${theme.fontFamily};
      overflow: hidden;
    }
    .canvas {
      position: relative;
      width: 1200px;
      height: 1200px;
      overflow: hidden;
      background: #0b1d3a;
    }
    .photo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center center;
      display: block;
    }
    .photo.portrait {
      object-position: center 18%;
    }
    .shade-top {
      position: absolute;
      inset: 0 0 55% 0;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, transparent 100%);
      pointer-events: none;
    }
    .shade-bottom {
      position: absolute;
      inset: 38% 0 0 0;
      background: linear-gradient(
        180deg,
        transparent 0%,
        rgba(0, 0, 0, 0.35) 28%,
        rgba(0, 0, 0, 0.82) 62%,
        rgba(0, 0, 0, 0.94) 100%
      );
      pointer-events: none;
    }
    .accent-glow {
      position: absolute;
      inset: auto 0 0 0;
      height: 6px;
      background: ${theme.accentColor};
      opacity: 0.95;
    }
    .top-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      padding: 40px 48px 0;
    }
    .badge {
      display: inline-block;
      background: ${theme.accentColor};
      color: #fff;
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 12px 22px;
      border-radius: 999px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }
    .person-name {
      color: #fff;
      font-size: 30px;
      font-weight: 700;
      text-align: right;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8);
      max-width: 420px;
      line-height: 1.2;
    }
    .text-overlay {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 2;
      padding: 0 56px 48px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .title {
      font-size: 54px;
      line-height: 1.18;
      font-weight: 800;
      color: #ffffff;
      text-shadow: 0 3px 18px rgba(0, 0, 0, 0.75);
    }
    .caption {
      font-size: 28px;
      line-height: 1.45;
      color: rgba(255, 255, 255, 0.92);
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
      white-space: pre-wrap;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      font-size: 22px;
      color: rgba(255, 255, 255, 0.72);
      text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
    }
    .logo {
      font-size: 30px;
      font-weight: 800;
      color: ${theme.accentColor};
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
    }
  </style>
</head>
<body>
  <div class="canvas">
    <img class="${imagePositionClass}" src="${safeImageUrl}" alt="${safeMainPerson || 'news'}" />
    <div class="shade-top"></div>
    <div class="shade-bottom"></div>
    <div class="accent-glow"></div>
    <div class="top-bar">
      ${badgeSection}
      ${personSection}
    </div>
    <div class="text-overlay">
      <h1 class="title">${escapeHtml(title)}</h1>
      <p class="caption">${escapeHtml(excerpt)}</p>
      <div class="footer">
        <span class="logo">ARSENAL FC</span>
        <span>Sakon Gunners</span>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function buildFallbackHtml(input: {
  theme: ReturnType<typeof pickImageTheme>;
  badgeSection: string;
  personSection: string;
  title: string;
  excerpt: string;
}): string {
  const { theme, badgeSection, personSection, title, excerpt } = input;

  return `<!DOCTYPE html>
<html lang="th">
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
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 28px;
    }
    .badge {
      display: inline-block;
      background: ${theme.accentColor};
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      padding: 14px 22px;
      border-radius: 999px;
    }
    .person-name {
      color: ${theme.titleColor};
      font-size: 28px;
      font-weight: 700;
      text-align: right;
    }
    .title {
      font-size: 72px;
      line-height: 1.15;
      font-weight: 800;
      color: ${theme.titleColor};
    }
    .caption {
      font-size: 34px;
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
  <div class="card">
    <div>
      <div class="top-row">
        ${badgeSection}
        ${personSection}
      </div>
      <h1 class="title">${escapeHtml(title)}</h1>
      <p class="caption">${escapeHtml(excerpt)}</p>
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
