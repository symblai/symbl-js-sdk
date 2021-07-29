import isNode from 'detect-node';

interface ILogger {
    logger: any;
    trace(value: string): void;
    debug(...args: any[]): void;
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    setLevel(level: string): void;
    getLevel(): string;
    setDefaultLevel(level: string): void;
}

declare var window: any;

export class Logger implements ILogger {
    logger: any;

    constructor() {
        if (isNode) {
            if (global.clientSdkLogger) {
                this.logger = global.clientSdkLogger;
            } else {
                this.logger = require('loglevel');
                global.clientSdkLogger = this.logger;
            }
        } else if (typeof window!=="undefined") {
            if (window.clientSdkLogger) {
                this.logger = window.clientSdkLogger;
            } else {
                this.logger = require('loglevel');
                window.clientSdkLogger = this.logger;
            }
        } else {
            this.logger = require('loglevel');
        }

        this.trace = this.trace.bind(this);
        this.debug = this.debug.bind(this);
        this.log = this.log.bind(this);
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);

    }

    setLevel(level) {
        this.logger.setLevel.apply(null, arguments);
    }

    getLevel() {
        return this.logger.getLevel.apply(null, arguments);
    }

    setDefaultLevel(level) {
        this.logger.setDefaultLevel.apply(null, arguments);
    }

    trace(value) {
        // console.log('trace', arguments);
        this.logger.trace.apply(null, arguments);
    }

    debug() {
        this.logger.debug.apply(null, arguments);
    }

    log() {
        this.logger.log.apply(null, arguments);
    }

    info() {
        this.logger.info.apply(null, arguments);
    }

    warn() {
        this.logger.warn.apply(null, arguments);
    }

    error() {
        this.logger.error.apply(null, arguments);
    }

}
const logger = new Logger();
logger.setDefaultLevel('warn');

export default logger;