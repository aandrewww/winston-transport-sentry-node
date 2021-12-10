"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const Sentry = (0, tslib_1.__importStar)(require("@sentry/node"));
const TransportStream = require("winston-transport");
const triple_beam_1 = require("triple-beam");
const DEFAULT_LEVELS_MAP = {
    silly: Sentry.Severity.Debug,
    verbose: Sentry.Severity.Debug,
    info: Sentry.Severity.Info,
    debug: Sentry.Severity.Debug,
    warn: Sentry.Severity.Warning,
    error: Sentry.Severity.Error,
};
class ExtendedError extends Error {
    constructor(info) {
        super(info.message);
        this.name = info.name || "Error";
        if (info.stack) {
            this.stack = info.stack;
        }
    }
}
class SentryTransport extends TransportStream {
    constructor(opts) {
        super(opts);
        this.silent = false;
        this.levelsMap = {};
        this.setLevelsMap = (options) => {
            if (!options) {
                return DEFAULT_LEVELS_MAP;
            }
            const customLevelsMap = Object.keys(options).reduce((acc, winstonSeverity) => {
                acc[winstonSeverity] = Sentry.Severity.fromString(options[winstonSeverity]);
                return acc;
            }, {});
            return Object.assign(Object.assign({}, DEFAULT_LEVELS_MAP), customLevelsMap);
        };
        this.levelsMap = this.setLevelsMap(opts && opts.levelsMap);
        this.silent = (opts && opts.silent) || false;
        Sentry.init(SentryTransport.withDefaults((opts && opts.sentry) || {}));
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit("logged", info);
        });
        if (this.silent)
            return callback();
        const { message, tags, user } = info, meta = (0, tslib_1.__rest)(info, ["message", "tags", "user"]);
        const winstonLevel = info[triple_beam_1.LEVEL];
        const sentryLevel = this.levelsMap[winstonLevel];
        Sentry.configureScope((scope) => {
            scope.clear();
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
            Sentry.captureException(error, { tags });
            return callback();
        }
        // Capturing Messages
        Sentry.captureMessage(message, sentryLevel);
        return callback();
    }
    end(...args) {
        Sentry.flush().then(() => {
            super.end(...args);
        });
    }
    get sentry() {
        return Sentry;
    }
    static withDefaults(options) {
        return Object.assign(Object.assign({}, options), { dsn: (options && options.dsn) || process.env.SENTRY_DSN || "", serverName: (options && options.serverName) || "winston-transport-sentry-node", environment: (options && options.environment) ||
                process.env.SENTRY_ENVIRONMENT ||
                process.env.NODE_ENV ||
                "production", debug: (options && options.debug) || !!process.env.SENTRY_DEBUG || false, sampleRate: (options && options.sampleRate) || 1.0, maxBreadcrumbs: (options && options.maxBreadcrumbs) || 100 });
    }
    // private normalizeMessage(msg: any) {
    //   return msg && msg.message ? msg.message : msg;
    // }
    static isObject(obj) {
        const type = typeof obj;
        return type === "function" || (type === "object" && !!obj);
    }
    static shouldLogException(level) {
        return level === Sentry.Severity.Fatal || level === Sentry.Severity.Error;
    }
}
exports.default = SentryTransport;
//# sourceMappingURL=transport.js.map