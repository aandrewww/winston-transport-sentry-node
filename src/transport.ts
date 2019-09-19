import * as Sentry from '@sentry/node';
import TransportStream = require("winston-transport");

interface Info {
  message: string;
  level: string;
  tags?: {[key: string]: any};
  [key: string]: any;
}

export interface SentryTransportOptions extends TransportStream.TransportStreamOptions {
  sentry?: Sentry.NodeOptions;
}

export default class SentryTransport extends TransportStream {
  public silent = false;

  private levelsMap = {
    silly: Sentry.Severity.Debug,
    verbose: Sentry.Severity.Debug,
    info: Sentry.Severity.Info,
    debug: Sentry.Severity.Debug,
    warn: Sentry.Severity.Warning,
    error: Sentry.Severity.Error
  };

  public constructor(opts?: SentryTransportOptions) {
    super(opts);

    this.silent = opts && opts.silent || false;
    Sentry.init(this.withDefaults(opts && opts.sentry || {}));
  }

  public log(info: Info, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (this.silent) return callback();

    const { message, level: winstonLevel, tags, ...meta } = info;

    const sentryLevel = (this.levelsMap as any)[winstonLevel];

    Sentry.configureScope(scope => {
      if (tags !== undefined && this.isObject(tags)) {
        scope.setTags(tags);
      }

      scope.setExtras(meta);

      // TODO: add user details
      // scope.setUser({ id: '4711' }); // id, email, username, ip_address

      // TODO: add fingerprints
      // scope.setFingerprint(['{{ default }}', path]); // fingerprint should be an array

      // scope.clear();
    });

    // TODO: add breadcrumbs
    // Sentry.addBreadcrumb({
    //   message: 'My Breadcrumb',
    //   // ...
    // });

    // Capturing Errors / Exceptions
    if (this.shouldLogException(sentryLevel)) {
      Sentry.captureException(new Error(message));

      return callback();
    }

    // Capturing Messages
    Sentry.captureMessage(message, sentryLevel);
    return callback();
  }

  public get sentry() {
    return Sentry;
  }

  private withDefaults(options: Sentry.NodeOptions) {
    return {
      dsn: options && options.dsn || process.env.SENTRY_DSN || '',
      serverName: options && options.serverName || 'winston-transport-sentry-node',
      environment: options && options.environment || process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
      debug: options && options.debug || !!process.env.SENTRY_DEBUG || false,
      sampleRate: options && options.sampleRate || 1.0,
      maxBreadcrumbs: options && options.maxBreadcrumbs || 100,
      ...options
    };
  }

  // private normalizeMessage(msg: any) {
  //   return msg && msg.message ? msg.message : msg;
  // }

  private isObject (obj: any) {
    const type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  }

  private shouldLogException(level: Sentry.Severity) {
    return level === Sentry.Severity.Fatal || level === Sentry.Severity.Error;
  }
};
