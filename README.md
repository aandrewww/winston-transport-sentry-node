
# winston-transport-sentry-node
[![CircleCI](https://circleci.com/gh/aandrewww/winston-transport-sentry-node.svg?style=svg)](https://circleci.com/gh/aandrewww/winston-transport-sentry-node)
[![node](https://img.shields.io/badge/node-6.4.0+-brightgreen.svg)][node-url]
[![winston](https://img.shields.io/badge/winston-3.x+-brightgreen.svg)][winston-url]
[![license](https://img.shields.io/github/license/aandrewww/winston-transport-sentry-node.svg)][license-url]

[@Sentry/node](https://github.com/getsentry/sentry-javascript/tree/master/packages/node) transport for the [winston](https://github.com/winstonjs/winston) v3 logger.

## Index

* [Install](#install)
* [Usage](#usage)
* [Options](#options-options)
  - [Transport related options](#transport-related-options)
  - [Sentry common options](#sentry-common-options)
  - [Info object](#format-info-object)
  - [Log Level Mapping](#log-level-mapping)
* [License](#license)

## Install

```bash
npm install --save winston winston-transport-sentry-node
```


## Usage

You can configure `winston-transport-sentry-node` in two different ways.

With `winston.createLogger`:

```js
const winston = require('winston');
const Sentry = require('winston-transport-sentry-node').default;

const options = {
  sentry: {
    dsn: 'https://******@sentry.io/12345',
  },
  level: 'info'
};

const logger = winston.createLogger({
  transports: [
    new Sentry(options)
  ]
});
```

Or with winston's `add` method:

```js
const winston = require('winston');
const Sentry = require('winston-transport-sentry-node').default;

const logger = winston.createLogger();

logger.add(new Sentry(options));
```

See [Options](#options-options) below for custom configuration.

## Options (`options`)

### Transport related options

* `sentry` (Object) - a Sentry configuration object (see [Sentry Common Options](#sentry-common-options))
* `silent` (Boolean) - suppress logging (defaults to `false`)
* `level` (String) - transport's level of messages to log (defaults to `info`)
* `format` (Object) - custom log format (see [Winston Formats](https://github.com/winstonjs/winston#formats))
* `levelsMap` (Object) - optional custom mapping between Winston's log levels and Sentry's log levels ([default](#log-level-mapping))

### Sentry common options

* `dsn` (String) - your Sentry DSN or Data Source Name (defaults to `process.env.SENTRY_DSN`)
* `environment` (String) - (defaults to `process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production'`)
* `serverName` (String) - transport's name (defaults to `winston-transport-sentry-node`)
* `debug` (Boolean) - turns debug mode on or off (default to `process.env.SENTRY_DEBUG || false`)
* `sampleRate` (Number) - sample rate as a percentage of events to be sent in the range of 0.0 to 1.0 (default to `1.0`)
* `maxBreadcrumbs` (Number) - total amount of breadcrumbs that should be captured (default to `100`)
* ... [Other options](https://docs.sentry.io/error-reporting/configuration/?platform=javascript)

### Info object ([See more](https://github.com/winstonjs/winston#streams-objectmode-and-info-objects))

If `info.tags` is an object, it will be sent as [Sentry Tags](https://docs.sentry.io/enriching-error-data/context/?platform=javascript#tagging-events).

```js
logger.error("some error", { tags: { tag1: "yo", tag2: "123" } });
```

If `info.user` is an object, it will be sent as [Sentry User](https://docs.sentry.io/platforms/javascript/#capturing-the-user).

```js
logger.error("some error", { user: { username: "somebody", id: "123" } });
```

Additional properties of `info` are sent as [Sentry Extra Context](https://docs.sentry.io/enriching-error-data/context/?platform=javascript#extra-context).

```js
logger.error("some error", { whatever: "is sent as extra" });
```

Tip! If you already have logging in place and want to use Sentry tags but don’t want to update all places where you log something, use a `format` function.

```js
const sentryFormat = format(info => {
  const {path, label, ...extra} = info;
  return {
    ...extra,
    tags: {
      path: path || '',
      request_id: label
    }
  }
});

new SentryTransport({
  format: sentryFormat()
  // ...
});
```

### Log Level Mapping

Winston logging levels are mapped by default to Sentry's acceptable levels.

```js
{
  silly: 'debug',
  verbose: 'debug',
  info: 'info',
  debug: 'debug',
  warn: 'warning',
  error: 'error'
}
```

See available [Sentry's levels](https://getsentry.github.io/sentry-javascript/enums/types.severity-1.html).
Matching is done with [`Sentry.Severity.fromString()`](https://getsentry.github.io/sentry-javascript/enums/types.severity-1.html#fromstring) method and will defaults to [`log`](https://getsentry.github.io/sentry-javascript/enums/types.severity-1.html#log)

## License

[MIT License][license-url]

[license-url]: LICENSE
[node-url]: https://nodejs.org
[winston-url]: https://github.com/winstonjs/winston
