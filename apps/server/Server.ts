/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import express, {Router} from 'express';
import expressSitemapXml from 'express-sitemap-xml';
import hbs from 'hbs';
import helmet from 'helmet';
import {StatusCodes as HTTP_STATUS} from 'http-status-codes';
import nocache from 'nocache';

import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';

import type {ClientConfig, ServerConfig} from '@wireapp/config';

import {AppleAssociationRoute} from './routes/appleassociation/appleAssociationRoute';
import {parseClientVersion} from './routes/clientVersionCheck/clientVersion';
import {createClientVersionCheckRoute} from './routes/clientVersionCheck/clientVersionCheckRoute';
import {ConfigRoute} from './routes/config/configRoute';
import {InternalErrorRoute, NotFoundRoute} from './routes/error/errorRoutes';
import {GoogleWebmasterRoute} from './routes/googlewebmaster/googleWebmasterRoute';
import {HealthCheckRoute} from './routes/health/healthRoute';
import {RedirectRoutes} from './routes/redirectRoutes';
import {Root} from './routes/root';
import {replaceHostnameInObject} from './util/hostnameReplacer';

class Server {
  private readonly app: express.Express;
  private server?: http.Server | https.Server;

  constructor(
    private readonly config: ServerConfig,
    private readonly clientConfig: ClientConfig,
  ) {
    if (this.config.DEVELOPMENT) {
      console.info(this.config);
    } else if (!this.config.APP_BASE.startsWith('https')) {
      throw new Error(`Config variable 'APP_BASE' must be protocol https but is '${this.config.APP_BASE}'`);
    }

    this.app = express();
    this.init();
  }

  private init(): void {
    // The order is important here, please don't sort!
    this.initTemplateEngine();
    this.initCaching();
    this.initForceSSL();
    this.initSecurityHeaders();
    this.initLatestBrowserRequired();
    this.initStaticRoutes();
    this.initWebpack();
    this.initSiteMap(this.config);

    this.app.use('/libs', express.static(path.join(__dirname, 'libs')));
    this.app.use(Root());
    this.app.use(HealthCheckRoute());
    this.app.use(ConfigRoute(this.config, this.clientConfig));
    this.app.use(GoogleWebmasterRoute(this.config));
    this.app.use(AppleAssociationRoute());

    this.app.use(
      createClientVersionCheckRoute({
        router: Router(),
        parseClientVersion,
        deployedClientVersion: this.config.VERSION,
        isClientVersionEnforcementEnabled: this.config.ENABLE_CLIENT_VERSION_ENFORCEMENT,
      }),
    );
    this.app.use(NotFoundRoute());
    this.app.use(InternalErrorRoute());
  }

  private initWebpack() {
    if (!this.config.DEVELOPMENT) {
      return;
    }

    const webpackCompiler = require('webpack')(require('../../webapp/webpack.config.dev'));
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    this.app.use(webpackDevMiddleware(webpackCompiler));
    this.app.use(webpackHotMiddleware(webpackCompiler));
  }

  private initCaching() {
    if (this.config.DEVELOPMENT) {
      this.app.use(nocache());
    } else {
      this.app.use((req, res, next) => {
        // If the user agent adds a v param, it means that its requesting a particular version of the file and that could be cached forever since the file will never change.
        const hasCacheVersionParam = typeof req.query.v === 'string';
        const oneYear = 31536000;
        const maxAge = hasCacheVersionParam ? oneYear : this.config.CACHE_DURATION_SECONDS;
        const milliSeconds = 1000;
        res.header('Cache-Control', `public, max-age=${maxAge}`);
        res.header('Expires', new Date(Date.now() + maxAge * milliSeconds).toUTCString());
        next();
      });
    }
  }

  private initForceSSL(): void {
    const SSLMiddleware: express.RequestHandler = (req, res, next) => {
      const shouldEnforceHTTPS = !this.config.ENFORCE_HTTPS || req.url.match(/_health\/?/) !== null;
      const isInsecure = !req.secure || req.get('X-Forwarded-Proto') !== 'https';

      if (isInsecure && !shouldEnforceHTTPS) {
        return res.redirect(HTTP_STATUS.MOVED_PERMANENTLY, `${this.config.APP_BASE}${req.url}`);
      }

      next();
    };

    this.app.enable('trust proxy');
    this.app.use(SSLMiddleware);
  }

  private initSecurityHeaders() {
    this.app.disable('x-powered-by');
    this.app.use(
      helmet({
        crossOriginEmbedderPolicy: false,
        crossOriginOpenerPolicy: false,
        frameguard: {action: 'deny'},
      }),
    );
    this.app.use(helmet.noSniff());
    this.app.use(helmet.xssFilter());
    this.app.use(
      helmet.hsts({
        includeSubDomains: true,
        maxAge: 31536000,
        preload: true,
      }),
    );
    this.app.use((req, res, next) => {
      helmet.contentSecurityPolicy({
        directives: this.config.ENABLE_DYNAMIC_HOSTNAME
          ? replaceHostnameInObject(this.config.CSP, req)
          : this.config.CSP,
        reportOnly: false,
      })(req, res, next);
    });
    this.app.use(
      helmet.referrerPolicy({
        policy: 'same-origin',
      }),
    );
    // With helmet v4 the X-XSS-Protection header is set to `0` by default.
    // After discussing this with @franziskuskiefer we want to keep this enabled for old browsers.
    // https://github.com/helmetjs/helmet/issues/230
    this.app.use((_req, res, next) => {
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
    // Scope clipboard delegation to self and the configured Collabora origin only.
    // Falls back to self-only when CELLS_PYDIO_URL is not configured.
    const collaboraOrigin = this.clientConfig.CELLS_PYDIO_URL;
    const clipboardAllowlist = collaboraOrigin ? `(self "${collaboraOrigin}")` : '(self)';
    this.app.use((_req, res, next) => {
      res.setHeader(
        'Permissions-Policy',
        `clipboard-read=${clipboardAllowlist}, clipboard-write=${clipboardAllowlist}`,
      );
      next();
    });
  }

  private initStaticRoutes() {
    this.app.use(RedirectRoutes(this.config));

    const staticRoutes = ['audio', 'ext', 'font', 'image', 'min', 'proto', 'style', 'worker', 'assets'];

    // NovaE2E: icons and the manifest are public files; the system's icon loader on phones must be able to read them.
    this.app.use('/image/meta', (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    });

    // NovaE2E: send the copies written at build time (bin/novae2e_precompress.js) instead of the raw file.
    this.app.use(this.createPrecompressedMiddleware(['libs', ...staticRoutes]));

    staticRoutes.forEach(route => {
      this.app.use(`/${route}`, express.static(path.join(__dirname, `static/${route}`)));
    });

    this.app.get('/favicon.ico', (_req, res) => res.sendFile(path.join(__dirname, 'static/image/favicon-v2.ico')));

    // NovaE2E: phones ask for the home-screen icon and the manifest at fixed root paths, whatever the page links to.
    const metaDir = path.join(__dirname, 'static/image/meta');
    const rootFiles: Record<string, string> = {
      '/apple-touch-icon.png': 'apple-touch-icon-180-v2.png',
      '/apple-touch-icon-precomposed.png': 'apple-touch-icon-180-v2.png',
      '/apple-touch-icon-180x180.png': 'apple-touch-icon-180-v2.png',
      '/apple-touch-icon-180x180-precomposed.png': 'apple-touch-icon-180-v2.png',
      '/apple-touch-icon-167x167.png': 'apple-touch-icon-167-v2.png',
      '/apple-touch-icon-152x152.png': 'apple-touch-icon-152-v2.png',
      '/apple-touch-icon-152x152-precomposed.png': 'apple-touch-icon-152-v2.png',
      '/apple-touch-icon-120x120.png': 'apple-touch-icon-120-v2.png',
      '/apple-touch-icon-120x120-precomposed.png': 'apple-touch-icon-120-v2.png',
      '/manifest.json': 'site.webmanifest',
      '/site.webmanifest': 'site.webmanifest',
    };
    Object.entries(rootFiles).forEach(([route, file]) => {
      this.app.get(route, (_req, res) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.sendFile(path.join(metaDir, file));
      });
    });
    if (!this.config.DEVELOPMENT) {
      this.app.get('/sw.js', (_req, res) => res.sendFile(path.join(__dirname, 'static/sw.js')));
    }
  }

  /**
   * NovaE2E: serves `<file>.br` or `<file>.gz` (written at build time) when the client accepts it.
   * Only the URL is rewritten; `express.static` still sends the file, so ETag, Last-Modified, ranges and
   * the cache headers set earlier keep working. The content type is the one of the original file.
   */
  private createPrecompressedMiddleware(routes: string[]): express.RequestHandler {
    const available = new Set<string>();
    const collect = (dir: string, urlPrefix: string) => {
      if (!fs.existsSync(dir)) {
        return;
      }
      for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        if (entry.isDirectory()) {
          collect(path.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
        } else if (entry.name.endsWith('.br') || entry.name.endsWith('.gz')) {
          available.add(`${urlPrefix}/${entry.name}`);
        }
      }
    };
    routes.forEach(route => {
      const dir = route === 'libs' ? path.join(__dirname, 'libs') : path.join(__dirname, `static/${route}`);
      collect(dir, `/${route}`);
    });

    return (req, res, next) => {
      if ((req.method !== 'GET' && req.method !== 'HEAD') || available.size === 0) {
        return next();
      }
      const queryStart = req.url.indexOf('?');
      const rawPath = queryStart === -1 ? req.url : req.url.slice(0, queryStart);
      const query = queryStart === -1 ? '' : req.url.slice(queryStart);
      let pathname: string;
      try {
        pathname = path.posix.normalize(decodeURIComponent(rawPath));
      } catch {
        return next();
      }
      if (!available.has(`${pathname}.br`) && !available.has(`${pathname}.gz`)) {
        return next();
      }
      // The answer depends on the Accept-Encoding header, whichever copy is sent.
      res.vary('Accept-Encoding');
      const accepted = req.acceptsEncodings(['br', 'gzip', 'identity']);
      const extension = accepted === 'br' ? '.br' : accepted === 'gzip' ? '.gz' : '';
      if (!extension || !available.has(`${pathname}${extension}`)) {
        return next();
      }
      res.type(path.extname(pathname));
      res.setHeader('Content-Encoding', accepted as string);
      req.url = `${encodeURI(pathname)}${extension}${query}`;
      return next();
    };
  }

  public initLatestBrowserRequired() {
    this.app.use((req, res, next) => {
      const fileExtensionRegx = /\.[^/]+$/;
      const ignoredPath =
        fileExtensionRegx.test(req.path) ||
        req.path.startsWith('/commit') ||
        req.path.startsWith('/test') ||
        req.path.startsWith('/_health') ||
        req.path.startsWith('/join') ||
        req.path.startsWith('/auth') ||
        req.path.startsWith('/google') ||
        req.path.startsWith('/unsupported') ||
        req.path.startsWith('/apple-app-site-association');

      if (ignoredPath) {
        return next();
      }

      return next();
    });
  }

  private initTemplateEngine() {
    this.app.set('view engine', 'html');
    this.app.engine('html', hbs.__express);
    this.app.set('views', [path.resolve(__dirname, 'static'), path.resolve(__dirname, 'templates')]);
    hbs.localsAsTemplateData(this.app);
    this.app.locals.config = {
      APP_BASE: this.config.APP_BASE,
      OPEN_GRAPH: this.config.OPEN_GRAPH,
      VERSION: this.config.VERSION,
    };
  }

  private initSiteMap(config: ServerConfig) {
    if (config.APP_BASE) {
      const pages = () => [
        {
          changeFreq: 'weekly',
          url: '/auth/',
        },
        {
          changeFreq: 'weekly',
          url: '/',
        },
      ];
      this.app.use(expressSitemapXml(pages, config.APP_BASE) as unknown as express.RequestHandler);
    }
  }

  start(): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        reject('Server is already running.');
      } else if (this.config.PORT_HTTP) {
        if (this.config.DEVELOPMENT && this.config.DEVELOPMENT_ENABLE_TLS) {
          const options = {
            cert: fs.readFileSync(this.config.SSL_CERTIFICATE_PATH),
            key: fs.readFileSync(this.config.SSL_CERTIFICATE_KEY_PATH),
          };
          this.server = https
            .createServer(options, this.app)
            .listen(this.config.PORT_HTTP, '0.0.0.0', () => resolve(this.config.PORT_HTTP));
        } else {
          this.server = this.app.listen(this.config.PORT_HTTP, '0.0.0.0', () => resolve(this.config.PORT_HTTP));
        }
      } else {
        reject('Server port not specified.');
      }
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      this.server = undefined;
    } else {
      throw new Error('Server is not running.');
    }
  }
}

export {Server};
