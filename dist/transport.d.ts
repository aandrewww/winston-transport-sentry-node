import * as Sentry from "@sentry/node";
import TransportStream = require("winston-transport");
export interface SentryTransportOptions extends TransportStream.TransportStreamOptions {
    sentry?: Sentry.NodeOptions;
    levelsMap?: SeverityOptions;
}
interface SeverityOptions {
    [key: string]: Sentry.Severity;
}
export default class SentryTransport extends TransportStream {
    silent: boolean;
    private levelsMap;
    constructor(opts?: SentryTransportOptions);
    log(info: any, callback: () => void): void;
    end(...args: any[]): void;
    get sentry(): typeof Sentry;
    private setLevelsMap;
    private static withDefaults;
    private static isObject;
    private static shouldLogException;
}
export {};
