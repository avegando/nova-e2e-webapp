# Web messenger: source code (fork of the Wire web app)

This repository contains the source code of the web app behind the Nova E2E messenger service
operated by Avegando AI Labs LLC ("Avegando"). It is a modified version of the
[Wire web app](https://github.com/wireapp/wire-webapp) by Wire Swiss GmbH.

| | |
| --- | --- |
| Upstream project | `wireapp/wire-webapp` |
| Upstream base | tag `2026-06-02-production.0`, commit `44be756af1dd3e4ac1051f1518d38524ba5dd772` |
| Modified by | Avegando AI Labs LLC |
| Date of the modifications | 2026-11-13 (state of the published code) |
| License | GNU General Public License, version 3 (see `LICENSE`) |

The complete upstream history is kept in this repository. The modifications are published on
top of the upstream tag.

## License

The Wire web app is licensed under the GNU General Public License, version 3. This modified
version, including all changes made by Avegando, is licensed under the same license. There is
no warranty; see sections 15 and 16 of the license.

The license covers the program code. Names and logos are a separate matter. The product name and the public addresses of the hosted service appear in the code as they are in the running service; the logo and icon files are not part of this repository, plain grey placeholder images take their place. Neither the name nor the logos are licensed: if you distribute or host this software yourself, use your own name, logo and addresses. See `TRADEMARKS.md`.

This project is not affiliated with, endorsed by or supported by Wire Swiss GmbH. The notice
by Wire Swiss GmbH on the Wire trademark and on apps that connect to Wire's servers is kept
below. The hosted service runs this app against its own backend. If you build the app yourself,
set the backend addresses (`BACKEND_REST`, `BACKEND_WS`) to your own backend.

## What was changed (relative to the upstream tag)

- Brand overlay: a build step copies deployment-specific images over the default resources and
  sets name and address defaults (`apps/webapp/bin/novae2e_apply_brand.js`, `apps/webapp/brand`).
  The product name in the translation texts was replaced.
- Look: dark theme as the default, black and silver surfaces with one cyan accent, purple removed
  from the profile colours, emoji replaced by plain icons and text
  (`apps/webapp/src/style/foundation/novae2e.less`, colour values, two patches for
  `@wireapp/react-ui-kit` in `.yarn/patches`).
- Sign-in and registration pages: new layout and styles, an animated backdrop drawn from text
  characters on a canvas, own logo component, personal accounts first, no price wording.
- Phones and tablets: mobile browsers are let into the app, home-screen meta tags and a web
  manifest, layout that follows the visible height and the on-screen keyboard, a menu that
  opens and closes by tap.
- Server: static files are sent as Brotli or gzip copies written at build time; icons and the
  manifest are served at the fixed root paths phones ask for.
- Build: a low-memory bundle configuration and a wrapper that fails when the bundle has errors.
- Files received in a chat open inside the app on phones; a leftover single-instance marker no
  longer signs the user out.
- Voice messages from the message bar, delivery ticks on own messages, reaction and call bars for
  phones, an invitation link, and a display name and badge for single accounts set at deploy time
  (`NOVA_DISPLAY_NAMES`).
- About page: a license notice with a configurable link to this source code (`URL_SOURCE_CODE`).

## Building

Requirements: Node.js as given in `.nvmrc`, Yarn (via Corepack), and Docker for the container image.

```
yarn install                     # also runs "nx run webapp:configure": fetches the default configuration,
                                 # applies apps/webapp/brand and generates the icon components
yarn build:prod                  # standard production build of the libraries, the web app and the server
```

On a host with little memory run `yarn build:libs` and then
`apps/webapp/bin/novae2e_build_lowmem.sh` instead of `yarn build:prod`. The script runs the same
steps one by one with a smaller bundle configuration (`apps/webapp/webpack.config.lowmem.js`),
writes the compressed copies of the static files and, with `BUILD_IMAGE=1`, builds the container
image from `apps/server/Dockerfile`.

Backend addresses, the name shown in the app and all other settings are read from environment
variables at run time; `libraries/config/src/env.ts` lists them.

---

<!-- Below: the README of the upstream project, unchanged. -->

# Wire™

[![We are hiring](https://github.com/wireapp/wire/blob/master/assets/header-small.png?raw=true)](https://www.linkedin.com/company/wire-secure-communication/jobs/)

This repository is part of the source code of Wire. You can find more information at [wire.com](https://wire.com) or by contacting opensource@wire.com.

You can find the published source code at [github.com/wireapp/wire](https://github.com/wireapp/wire).

For licensing information, see the attached LICENSE file and the list of third-party licenses at [wire.com/legal/licenses/](https://wire.com/legal/licenses/).

If you compile the open source software that we make available from time to time to develop your own mobile, desktop, or web application, and cause that application to connect to our servers for any purposes, we refer to that resulting application as an "Open Source App". All Open Source Apps are subject to, and may only be used and/or commercialized in accordance with, the Terms of Use applicable to Wire Application, which can be found at https://wire.com/legal/#terms. Additionally, if you choose to build an Open Source App, certain restrictions apply, as follows:

a. You agree not to change the way the Open Source App connects and interacts with our servers;
b. You agree not to weaken any of the security features of the Open Source App;
c. You agree not to use our servers to store data for purposes other than the intended and original functionality of the Open Source App;
d. You acknowledge that you are solely responsible for any and all updates to your Open Source App.

For clarity, if you compile the open source software that we make available from time to time to develop your own mobile, desktop, or web application, and do not cause that application to connect to our servers for any purposes, then that application will not be deemed an Open Source App and the foregoing will not apply to that application.

No license is granted to the Wire trademark and its associated logos, all of which will continue to be owned exclusively by Wire Swiss GmbH. Any use of the Wire trademark and/or its associated logos is expressly prohibited without the express prior written consent of Wire Swiss GmbH.

# Monorepo Layout

- `apps/webapp/`: client (Webpack/React) plus E2E tests and i18n files
- `apps/server/`: node/express wrapper that serves the built webapp and handles proxying
- `libraries/config/`: `@wireapp/config` package - centralized environment configuration management with type-safe configuration loading and validation
- `libraries/core/`: `@wireapp/core` package - Wire's communication core library handling authentication, WebSocket connections, and protocol messaging
- Root-level tooling (`package.json`, Nx, bin scripts) orchestrates both apps and libraries

The root `yarn` and `nx` scripts are the entry points; package-level scripts delegate to them.

# How to Build the Open Source Client

Prerequisites:

1. Install [Node.js](https://nodejs.org/)
1. Install [Yarn](https://yarnpkg.com)

## 1. Install Dependencies & Fetch Configuration

1. Run `yarn` (uses Yarn 4 workspaces)
   - This will install all dependencies and run `webapp:configure` (via root `postinstall`).
   - `webapp:configure` uses `apps/webapp/app-config/package.json` to select a config repository version (`wire-web-config-wire` or `wire-web-config-default`), then copies:
     - config content into `apps/webapp/resource/`
     - `.env.defaults` into repository root
   - Runtime priority is: process environment (for example AWS) > `.env` > `.env.defaults` > code fallback.

## 2. Build & Run

### Development

1. Copy `.env.localhost` to `.env` to override/extend defaults
1. Add the following entries to your hosts file (macOS / Linux: `/etc/hosts`, Windows 10: `%WINDIR%\system32\drivers\etc\hosts`):
   - `127.0.0.1 local.zinfra.io` (to connect with the staging backend)
   - `127.0.0.1 local.imai.wire.link` (to connect with the imai backend)
1. Run `yarn nx build webapp --configuration=development` to build static assets
1. Run `yarn start` (runs `nx serve server`); the app will be available at https://local.zinfra.io:8081/auth/

#### Install Self-Signed Certificate

If you would like your browser to trust the certificate from "local.wire.com"/"local.zinfra.io"/"local.imai.wire.link":

1. Download [mkcert](https://github.com/FiloSottile/mkcert/releases/latest) - Installation on Mac: `brew install mkcert` (refer to the latest [README.md](https://github.com/FiloSottile/mkcert))
2. Set the `CAROOT` environment variable to `<WebApp Dir>/apps/server/certificate`
3. Run `mkcert -install`

#### Environment Configuration

The application can be configured to connect to different environments by modifying the following environment variables in your `.env` file:

For the full environment variable reference, see [Environment Variables](https://github.com/wireapp/wire-webapp/blob/dev/libraries/config/README.md#environment-variables).

**Staging:**

```
APP_BASE="https://local.zinfra.io:8081"
BACKEND_REST="https://staging-nginz-https.zinfra.io"
BACKEND_WS="wss://staging-nginz-ssl.zinfra.io"
```

**Imai:**

```
APP_BASE="https://local.imai.wire.link:8081"
BACKEND_REST="https://nginz-https.imai.wire.link"
BACKEND_WS="https://nginz-ssl.imai.wire.link"
```

**Local:**

```
APP_BASE="http://localhost:8081"
BACKEND_REST="http://localhost:8080"
BACKEND_WS="ws://localhost:8080"
```

After updating the environment variables, the app will be available at the corresponding `APP_BASE` URL.

### Production

1. Build and package for production: `yarn nx run server:package` (or `yarn build:prod`)
   - This builds both the server and webapp (in production mode) and creates the deployment package at `apps/server/dist/s3/ebs.zip`
1. Start the server output from `apps/server/dist` (or build a Docker image with `yarn docker <tag>`)

**Note:** The `yarn zip` command has been deprecated. Packaging is now integrated into the build process via `yarn build:prod` or `yarn nx run server:package`.

## Testing

[![codecov](https://codecov.io/gh/wireapp/wire-webapp/branch/dev/graph/badge.svg?token=9ELBEPM793)](https://codecov.io/gh/wireapp/wire-webapp)

To launch the full test suite:

```bash
yarn nx run-many -t test --all
```

Other useful tasks:

- Lint: `yarn nx run-many -t lint --all`
- Type-check: `yarn nx run-many -t type-check --all`
- E2E (Playwright): `yarn nx e2e webapp`

## CI Status

[![CI](https://github.com/wireapp/wire-webapp/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/wireapp/wire-webapp/actions/workflows/ci.yml) [![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

## Translations

All Wire translations are crowdsourced via [Crowdin](https://crowdin.com/projects/wire).

### Add New Strings

**Info:**

- To download translations we use Crowdin API v1, and you need to set up your [username](https://crowdin.com/settings#account) and [api_key](https://crowdin.com/settings#api-key) (Account API key)
- To upload translations we use Crowdin CLI v3, and you will need to set up [project_identifier](https://crowdin.com/project/wire-webapp/settings#api) and [api_token](https://crowdin.com/settings#api-key) (Personal Access Token)

**Setup:**

Create a `keys/crowdin.yaml` in this repository and add the following entries:

```yaml
api_key: your-account-api-key
api_token: your-personal-access-token
project_identifier: wire-webapp
username: your-username
```

**Usage:**

1. Add a string variable to "i18n/en-US.json"
2. Create a PR and merge it after approval. When the PR gets merged, our CI will take care of uploading the English texts to Crowdin

If our CI pipeline is broken, you still have the option to upload new strings manually. For this case, do the following:

1. Install [Crowdin CLI v3](https://support.crowdin.com/cli-tool/)
1. Verify you have a `keys/crowdin.yaml` in place
1. Run `yarn translate:upload`

Once translations are uploaded on Crowdin, our (and external) translators can translate the new strings on Crowdin. There is a script that will run to create PRs with translation updates. As an alternative, translations can be downloaded in the following way:

1. Verify your string shows up on the [Crowdin project: wire-webapp](https://crowdin.com/translate/wire-webapp/1224/en-en)
1. Add a translation on Crowdin
1. Approve the translation on Crowdin
1. Run `yarn translate:download`

## Contributing

Contributions are welcome! Feel free to check our [issues page](https://github.com/wireapp/wire-webapp/issues).

The following commits will help you get started quickly with our code base:

- [Show a modal / pop-up](https://github.com/wireapp/wire-webapp/commit/00d3d120aacb3f36da80edd1ca829afc045331e9)
- [Sync setting between via backend](https://github.com/wireapp/wire-webapp/commit/3e4595a208189b7b6b51935fd2c41a74bbd16994)
