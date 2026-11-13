/*
 * NovaE2E brand overlay: copies the files in apps/webapp/brand/resource over the downloaded default
 * resources and sets the brand defaults in .env.defaults. Runs as part of "nx run webapp:configure".
 */
const fs = require('fs');
const path = require('path');

const webappDir = path.join(__dirname, '..');
const source = path.join(webappDir, 'brand', 'resource');
const target = path.join(webappDir, 'resource');

fs.cpSync(source, target, {recursive: true, force: true});

const defaults = {
  APP_BASE: 'https://webapp.e2e.novaos.cloud',
  APP_NAME: 'NovaE²E',
  BACKEND_NAME: 'NovaE²E',
  BRAND_NAME: 'NovaE²E',
  WEBSITE_LABEL: 'novaos.cloud',
  OPEN_GRAPH_TITLE: 'NovaE²E · End-to-end encrypted messaging',
  OPEN_GRAPH_DESCRIPTION: 'Private chats, calls and files, protected with end-to-end encryption.',
  OPEN_GRAPH_IMAGE_URL: 'https://webapp.e2e.novaos.cloud/image/meta/og-image.png',
  URL_WEBSITE_BASE: 'https://novaos.cloud/e2e',
  // Public address of the source code of this build (GPL-3.0). Set it at deploy time (envVars.URL_SOURCE_CODE) once the repository is public.
  URL_SOURCE_CODE: '',
};
const envFile = path.join(webappDir, '..', '..', '.env.defaults');
if (fs.existsSync(envFile)) {
  let content = fs.readFileSync(envFile, 'utf8');
  for (const [key, value] of Object.entries(defaults)) {
    const line = `${key}="${value}"`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    content = pattern.test(content) ? content.replace(pattern, line) : `${content}\n${line}\n`;
  }
  // Every remaining default that points to the original vendor's sites goes to the own page instead.
  content = content.replace(/^([A-Z0-9_]+)="https?:\/\/[a-z0-9.-]*wire\.com[^"]*"$/gm, '$1="https://novaos.cloud/e2e"');
  fs.writeFileSync(envFile, content);
}
console.log('NovaE2E brand overlay applied');
