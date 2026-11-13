/*
 * NovaE2E brand texts: replaces the product name "Wire" in the visible translation texts with "NovaE²E".
 * Copyright notices ("Wire Swiss GmbH") and technical identifiers are left untouched.
 * Usage: node apps/webapp/bin/novae2e_brand_texts.js
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'i18n');
const BRAND = 'NovaE²E';
const KEEP = 'Wire Swiss GmbH';
const MARK = '\u0000KEEP\u0000';
// German genitive forms that a plain word replacement cannot handle.
const GERMAN = {
  'accountForm.termsAndConditions': 'Ich akzeptiere die {termsAndConditionsLink} von NovaE²E',
  'oauth.privacypolicy': '<privacypolicy>Datenschutzerklärung</privacypolicy> von NovaE²E',
  teamCreationConfirmTermsOfUseLink: 'Nutzungsbedingungen von NovaE²E',
  teamCreationIntroLink: 'Erfahren Sie mehr über die Preise von NovaE²E',
};
let files = 0;
let changes = 0;

for (const name of fs.readdirSync(dir).filter(file => file.endsWith('.json'))) {
  const file = path.join(dir, name);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let changed = false;
  if (name === 'de-DE.json') {
    for (const key of Object.keys(GERMAN)) {
      if (data[key] !== undefined && data[key] !== GERMAN[key]) {
        data[key] = GERMAN[key];
        changed = true;
        changes++;
      }
    }
  }
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (typeof value !== 'string' || !/Wire|WIRE/.test(value)) {
      continue;
    }
    const next = value
      .split(KEEP)
      .join(MARK)
      .replace(/(?<![A-Za-z0-9_@/.])(Wire|WIRE)(?![A-Za-z0-9_/]|\.(com|link|app))/g, BRAND)
      .split(MARK)
      .join(KEEP);
    if (next !== value) {
      data[key] = next;
      changed = true;
      changes++;
    }
  }
  if (changed) {
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
    files++;
  }
}
console.log(`brand texts: ${changes} values in ${files} files`);
