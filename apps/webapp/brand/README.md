# Brand overlay

`resource/` holds the image files that carry the look of one particular deployment: browser
icon, home-screen icons, logo and word mark, share image and the web manifest. During
`nx run webapp:configure` the script `bin/novae2e_apply_brand.js` copies this folder over the
default resources and sets the brand defaults (name, addresses) in `.env.defaults`.

In this public repository the folder contains **neutral placeholders only**: plain grey shapes
written by `bin/novae2e_placeholder_assets.py`. The same script writes the plain default
background for video calls (`assets/images/backgrounds/wire-1.png`). The placeholder images
are dedicated to the public domain (CC0 1.0). The logos and icons of the operator's hosted
service are not included and are not licensed; see `TRADEMARKS.md` in the repository root.

`resource/font/nova-name.woff2` is a small subset of Noto Sans (copyright The Noto Project Authors),
used as a fallback for rare letters in names. It is licensed under the SIL Open Font License 1.1;
the license text is in `source/SCHRIFT-LIZENZ-NotoSans-OFL.txt`. It is not a brand asset.

To use your own brand:

1. Replace the files in `resource/image` with your own artwork. Keep the file names and sizes.
   (`bin/novae2e_logo_assets.mjs` can derive all files from a few source images placed in
   `brand/source/logo`; that source folder is not part of this repository.)
2. Set your name and addresses in `bin/novae2e_apply_brand.js`, or pass them as environment
   variables at run time (`APP_NAME`, `BRAND_NAME`, `BACKEND_NAME`, `APP_BASE`,
   `URL_WEBSITE_BASE`, `URL_SOURCE_CODE` and the others listed in `libraries/config/src/env.ts`).
3. Replace the product name of the hosted service in the translation files (`src/i18n`) and in
   the few pages and scripts that show a name directly (`src/page`,
   `apps/server/templates/error.html`). Forks must not use that name; see `TRADEMARKS.md`.
