/*
 * NovaE2E logo assets. Every logo place in the web app is fed from the few image files in apps/webapp/brand/source/logo:
 *   novae2e-icon-<size>.png            icon (shield with lock): app icons, favicon, notification, share image
 *   novae2e-wordmark.png / -1000.png   word mark with tag line: sign-in and registration pages, mails
 *   novae2e-wordmark-notag.png / -1000 word mark without tag line: headers and small places
 * To change the logo: replace those files, run bin/novae2e_logo_assets.sh, build. Dark backgrounds only.
 * Needs a container with puppeteer only for the share image.
 */
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import puppeteer from 'puppeteer';

const dir = path.dirname(fileURLToPath(import.meta.url));
const brand = path.join(dir, '..', 'brand');
const srcFile = name => path.join(brand, 'source', 'logo', name);
const read = name => fs.readFileSync(srcFile(name));
const res = (...p) => path.join(brand, 'resource', 'image', ...p);
for (const d of ['meta', 'logo', 'icon']) fs.mkdirSync(res(d), {recursive: true});
const copy = (from, ...to) => fs.copyFileSync(srcFile(from), res(...to));
const dataUri = name => `data:image/png;base64,${read(name).toString('base64')}`;

// icons (file names of the upstream app are kept, so no template has to change)
copy('novae2e-icon-64.png', 'meta', 'wire-icon-64.png');
copy('novae2e-icon-128.png', 'meta', 'wire-icon-128.png');
copy('novae2e-icon-256.png', 'meta', 'wire-icon-256.png');
copy('novae2e-icon-512.png', 'meta', 'novae2e-icon-512.png');
copy('novae2e-icon-192.png', 'meta', 'novae2e-icon-192.png');
copy('apple-touch-icon-180.png', 'meta', 'apple-touch-icon.png'); // no transparency, as iOS wants it
copy('novae2e-icon-maskable-192.png', 'meta', 'novae2e-icon-maskable-192.png');
copy('novae2e-icon-maskable-512.png', 'meta', 'novae2e-icon-maskable-512.png');
// web manifest for "Add to Home Screen" on Android and iOS
fs.writeFileSync(
  res('meta', 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Nova E2E',
      short_name: 'Nova E2E',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#05070a',
      theme_color: '#05070a',
      icons: [
        {src: '/image/meta/novae2e-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any'},
        {src: '/image/meta/novae2e-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any'},
        {src: '/image/meta/novae2e-icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable'},
        {src: '/image/meta/novae2e-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable'},
      ],
    },
    null,
    2,
  ) + '\n',
);
copy('novae2e-icon-256.png', 'logo', 'notification.png');
copy('novae2e-icon-128.png', 'logo', 'wire-logo-120.png');
// word marks
copy('novae2e-wordmark.png', 'logo', 'novae2e-wordmark@2x.png');
copy('novae2e-wordmark-1000.png', 'logo', 'novae2e-wordmark.png');
copy('novae2e-wordmark-notag.png', 'logo', 'novae2e-wordmark-notag@2x.png');
copy('novae2e-wordmark-notag-1000.png', 'logo', 'novae2e-wordmark-notag.png');
copy('novae2e-wordmark-1000.png', 'logo', 'novae2e-logo-email.png');

// favicon: PNG entries 16, 32, 48; the badge variant gets a cyan dot
const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
const render = async (html, width, height, transparent = true) => {
  const page = await browser.newPage();
  await page.setViewport({width, height, deviceScaleFactor: 1});
  await page.setContent(`<body style="margin:0;background:${transparent ? 'transparent' : '#05070a'}">${html}</body>`, {waitUntil: 'load'});
  const buf = await page.screenshot({omitBackground: transparent, type: 'png'});
  await page.close();
  return buf;
};
const ico = async (file, badge) => {
  const sizes = [16, 32, 48];
  const pngs = [];
  for (const px of sizes) {
    if (!badge) {
      pngs.push(read(`novae2e-icon-${px}.png`));
      continue;
    }
    const dot = Math.round(px * 0.42);
    pngs.push(await render(`<div style="position:relative;width:${px}px;height:${px}px"><img src="${dataUri(`novae2e-icon-${px}.png`)}" width="${px}" height="${px}"><div style="position:absolute;right:0;top:0;width:${dot}px;height:${dot}px;border-radius:50%;background:#22d3ee;box-shadow:0 0 0 ${Math.max(1, px / 16)}px #05070a"></div></div>`, px, px));
  }
  const head = Buffer.alloc(6 + 16 * sizes.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(sizes.length, 4);
  let offset = head.length;
  sizes.forEach((px, i) => {
    const o = 6 + 16 * i;
    head.writeUInt8(px, o); head.writeUInt8(px, o + 1); head.writeUInt8(0, o + 2); head.writeUInt8(0, o + 3);
    head.writeUInt16LE(1, o + 4); head.writeUInt16LE(32, o + 6); head.writeUInt32LE(pngs[i].length, o + 8); head.writeUInt32LE(offset, o + 12);
    offset += pngs[i].length;
  });
  fs.writeFileSync(file, Buffer.concat([head, ...pngs]));
};
await ico(res('favicon.ico'), false);
await ico(res('favicon-badge.ico'), true);

// share image 1200x630
fs.writeFileSync(
  res('meta', 'og-image.png'),
  await render(
    `<div style="width:1200px;height:630px;display:flex;align-items:center;justify-content:center;gap:60px;background:radial-gradient(60rem 30rem at 50% 110%, rgba(34,211,238,.14), transparent 70%),#05070a">
       <img src="${dataUri('novae2e-icon-512.png')}" width="250" height="250"><img src="${dataUri('novae2e-wordmark.png')}" width="640"></div>`,
    1200, 630, false),
);
await browser.close();

// icon components of the app (generated from SVG files): they carry the images, the app only sets the size
const sizeOf = name => { const b = read(name); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const imageSvg = (name, width, height, opacity = 1) => {
  const [w, h] = sizeOf(name);
  // no "=" padding in the data address: the icon generator of the app splits attributes at "=" (browsers accept unpadded base64)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${w} ${h}">\n  <image href="${dataUri(name).replace(/=+$/, '')}" width="${w}" height="${h}" opacity="${opacity}"/>\n</svg>\n`;
};
fs.writeFileSync(res('icon', 'logo-icon.svg'), imageSvg('novae2e-icon-128.png', 39, 39));
fs.writeFileSync(res('icon', 'watermark-icon.svg'), imageSvg('novae2e-icon-512.png', 288, 288, 0.16));
fs.writeFileSync(res('icon', 'logo-full-icon.svg'), imageSvg('novae2e-wordmark-notag-1000.png', 102, 26));
console.log('NovaE2E logo assets written');
