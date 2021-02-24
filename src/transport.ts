import * as Sentry from '@sentry/node';
import TransportStream = require("winston-transport");
import { LEVEL } from 'triple-beam';

const DEFAULT_LEVELS_MAP: SeverityOptions = {
  silly: Sentry.Severity.Debug,
  verbose: Sentry.Severity.Debug,
  info: Sentry.Severity.Info,
  debug: Sentry.Severity.Debug,
  warn: Sentry.Severity.Warning,
  error: Sentry.Severity.Error,
};

export interface SentryTransportOptions extends TransportStream.TransportStreamOptions {
  sentry?: Sentry.NodeOptions;
  levelsMap?: SeverityOptions;
}

interface SeverityOptions {
  [key: string]: Sentry.Severity;
}

class ExtendedError extends Error {
  constructor(info: any) {
    super(info.message);

    this.name = info.name || "Error";
    if (info.stack) {
      this.stack = info.stack;
    }
  }
}

export default class SentryTransport extends TransportStream {
  public silent = false;

  private levelsMap = {};

  public constructor(opts?: SentryTransportOptions) {
    super(opts);

    this.levelsMap = this.setLevelsMap(opts && opts.levelsMap);
    this.silent = opts && opts.silent || false;
    Sentry.init(SentryTransport.withDefaults(opts && opts.sentry || {}));
  }

  public log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (this.silent) return callback();

    const { message, level, tags, user, ...meta } = info;
    const winstonLevel = info[LEVEL];

    const sentryLevel = (this.levelsMap as any)[winstonLevel];

    Sentry.configureScope(scope => {
      if (tags !== undefined && SentryTransport.isObject(tags)) {
        scope.setTags(tags);
      }

      scope.setExtras(meta);

      if (user !== undefined && SentryTransport.isObject(user)) {
        scope.setUser(user);
      }

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
    if (SentryTransport.shouldLogException(sentryLevel)) {
      const error = message instanceof Error ? message : new ExtendedError(info);
      Sentry.captureException(error);

      return callback();
    }

    // Capturing Messages
    Sentry.captureMessage(message, sentryLevel);
    return callback();
  }

  end(...args: any[]) {
    Sentry.flush().then(() => {
      super.end(...args);
    });
  }

  public get sentry() {
    return Sentry;
  }

  private setLevelsMap = (options?: SeverityOptions): SeverityOptions => {
    if (!options) {
      return DEFAULT_LEVELS_MAP;
    }

    const customLevelsMap = Object.keys(options).reduce(
      (acc: { [key: string]: any }, winstonSeverity: string) => {
        acc[winstonSeverity] = Sentry.Severity.fromString(options[winstonSeverity]);
        return acc;
      },
      {}
    );

    return {
      ...DEFAULT_LEVELS_MAP,
      ...customLevelsMap,
    };
  };

  private static withDefaults(options: Sentry.NodeOptions) {
    return {
      ...options,
      dsn: options && options.dsn || process.env.SENTRY_DSN || '',
      serverName: options && options.serverName || 'winston-transport-sentry-node',
      environment: options && options.environment || process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
      debug: options && options.debug || !!process.env.SENTRY_DEBUG || false,
      sampleRate: options && options.sampleRate || 1.0,
      maxBreadcrumbs: options && options.maxBreadcrumbs || 100
    };
  }

  // private normalizeMessage(msg: any) {
  //   return msg && msg.message ? msg.message : msg;
  // }

  private static isObject (obj: any) {
    const type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  }

  private static shouldLogException(level: Sentry.Severity) {
    return level === Sentry.Severity.Fatal || level === Sentry.Severity.Error;
  }
};
