import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve(process.cwd(), 'public');

// Master SVG for SRIRAM FARMS: Mechanical Paddy Transplanter + Lush Rice Seedling
const masterSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bbf7d0" />
      <stop offset="50%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#022c22" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background App Rounded Tile -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="#34d399" stroke-width="4" stroke-opacity="0.35"/>

  <!-- Agricultural Machinery Outer Gear / Field Wheel -->
  <g filter="url(#shadow)">
    <!-- Wheel Rim & Ribs (Transplanter Paddy Wheel) -->
    <circle cx="256" cy="256" r="176" fill="#065f46" stroke="#a7f3d0" stroke-width="14"/>
    <circle cx="256" cy="256" r="140" fill="#044e39" stroke="#34d399" stroke-width="6" stroke-dasharray="14 16"/>

    <!-- Wheel Cleats (Paddy Tractor Ribs) -->
    <path d="M256 66 L256 94 M256 418 L256 446 M66 256 L94 256 M418 256 L446 256" stroke="#facc15" stroke-width="16" stroke-linecap="round"/>
    <path d="M122 122 L142 142 M370 370 L390 390 M122 390 L142 370 M370 122 L390 142" stroke="#facc15" stroke-width="16" stroke-linecap="round"/>

    <!-- Seedling Tray / Field Furrow Base -->
    <path d="M148 330 Q256 360 364 330 L350 365 Q256 395 162 365 Z" fill="#022c22" opacity="0.8"/>
    <path d="M140 330 C200 355 312 355 372 330" stroke="#facc15" stroke-width="6" fill="none"/>

    <!-- Twin Paddy Seedlings / Emerging Rice Sprout -->
    <!-- Left Leaf -->
    <path d="M256 330 C240 270 180 230 148 200 C154 260 196 305 256 330 Z" fill="url(#goldGrad)"/>
    <!-- Right Leaf -->
    <path d="M256 330 C272 250 332 195 364 165 C358 235 316 295 256 330 Z" fill="url(#leafGrad)"/>
    <!-- Center Tender Sprout -->
    <path d="M256 330 C250 240 252 180 256 128 C260 180 262 240 256 330 Z" fill="#ffffff" opacity="0.95"/>

    <!-- Center Mechanical Hub & Axis -->
    <circle cx="256" cy="256" r="38" fill="#facc15" stroke="#064e3b" stroke-width="8"/>
    <circle cx="256" cy="256" r="18" fill="#064e3b"/>
    <circle cx="256" cy="256" r="8" fill="#ffffff"/>
  </g>

  <!-- Top Monogram Badge: SF (High readability at small sizes) -->
  <g transform="translate(256, 436)">
    <rect x="-90" y="-22" width="180" height="36" rx="18" fill="#022c22" stroke="#facc15" stroke-width="3" opacity="0.9"/>
    <text x="0" y="3" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="18" fill="#ffffff" text-anchor="middle" letter-spacing="3">SRIRAM</text>
  </g>
</svg>`;

// Maskable SVG with safe padding (80% safe zone)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="50%" stop-color="#047857" />
      <stop offset="100%" stop-color="#15803d" />
    </linearGradient>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#facc15" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
    <linearGradient id="leafGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#bbf7d0" />
      <stop offset="50%" stop-color="#4ade80" />
      <stop offset="100%" stop-color="#16a34a" />
    </linearGradient>
  </defs>

  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Scaled content within 75% safe area -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Wheel Rim & Ribs (Transplanter Paddy Wheel) -->
    <circle cx="256" cy="256" r="176" fill="#065f46" stroke="#a7f3d0" stroke-width="14"/>
    <circle cx="256" cy="256" r="140" fill="#044e39" stroke="#34d399" stroke-width="6" stroke-dasharray="14 16"/>

    <!-- Wheel Cleats (Paddy Tractor Ribs) -->
    <path d="M256 66 L256 94 M256 418 L256 446 M66 256 L94 256 M418 256 L446 256" stroke="#facc15" stroke-width="16" stroke-linecap="round"/>
    <path d="M122 122 L142 142 M370 370 L390 390 M122 390 L142 370 M370 122 L390 142" stroke="#facc15" stroke-width="16" stroke-linecap="round"/>

    <!-- Seedling Tray Base -->
    <path d="M148 330 Q256 360 364 330 L350 365 Q256 395 162 365 Z" fill="#022c22" opacity="0.8"/>
    <path d="M140 330 C200 355 312 355 372 330" stroke="#facc15" stroke-width="6" fill="none"/>

    <!-- Rice Sprout -->
    <path d="M256 330 C240 270 180 230 148 200 C154 260 196 305 256 330 Z" fill="url(#goldGradM)"/>
    <path d="M256 330 C272 250 332 195 364 165 C358 235 316 295 256 330 Z" fill="url(#leafGradM)"/>
    <path d="M256 330 C250 240 252 180 256 128 C260 180 262 240 256 330 Z" fill="#ffffff" opacity="0.95"/>

    <!-- Center Hub -->
    <circle cx="256" cy="256" r="38" fill="#facc15" stroke="#064e3b" stroke-width="8"/>
    <circle cx="256" cy="256" r="18" fill="#064e3b"/>
    <circle cx="256" cy="256" r="8" fill="#ffffff"/>

    <text x="256" y="445" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="4">SRIRAM FARMS</text>
  </g>
</svg>`;

async function main() {
  console.log('Generating crisp favicons and PWA icons for SRIRAM FARMS...');

  // 1. Write master icon.svg
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), masterSvg);
  console.log('Created public/icon.svg');

  const svgBuffer = Buffer.from(masterSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // 2. Generate 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Created public/pwa-512x512.png');

  // 3. Generate 512x512 maskable PNG
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Created public/pwa-maskable-512x512.png');

  // 4. Generate 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Created public/pwa-192x192.png');

  // 5. Generate 180x180 Apple Touch Icon
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Created public/apple-touch-icon.png');

  // 6. Generate 32x32 & 16x16 PNG Favicons
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));
  console.log('Created public/favicon-32x32.png');

  await sharp(svgBuffer)
    .resize(16, 16)
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));
  console.log('Created public/favicon-16x16.png');

  // 7. Generate favicon.ico from 32x32
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Created public/favicon.ico');

  // 8. Generate Shortcut specific icons
  const shortcutIcons = [
    { name: 'shortcut-new.png', color: '#10b981', symbol: '+' },
    { name: 'shortcut-schedule.png', color: '#3b82f6', symbol: '📅' },
    { name: 'shortcut-calc.png', color: '#f59e0b', symbol: '🧮' },
  ];

  for (const s of shortcutIcons) {
    const scSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="24" fill="${s.color}"/>
      <text x="48" y="58" font-size="40" text-anchor="middle" fill="#ffffff" font-family="sans-serif">${s.symbol}</text>
    </svg>`;
    await sharp(Buffer.from(scSvg))
      .resize(96, 96)
      .png()
      .toFile(path.join(publicDir, s.name));
    console.log(`Created public/${s.name}`);
  }

  console.log('All icons and favicons generated successfully!');
}

main().catch(console.error);
