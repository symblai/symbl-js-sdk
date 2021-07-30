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

    /**
     * Constructor for the Logger class
     * binds all methods from the `loglevel` package
     * to the Logger object
     */
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

    /**
     * Sets the logging level.
     * @param {string} level - logging level 
     */
    setLevel(level) {
        this.logger.setLevel.apply(null, arguments);
    }

    /**
     * Returns the current logging level.
     * @returns {string} - logging level
     */
    getLevel() {
        return this.logger.getLevel.apply(null, arguments);
    }

    /**
     * Sets the default logging level.
     * @param {string} level - logging level
     */
    setDefaultLevel(level) {
        this.logger.setDefaultLevel.apply(null, arguments);
    }

    /**
     * Outputs a stack trace that will show the call path taken to reach the point of the value
     * @param {object} value 
     */
    trace(value) {
        this.logger.trace.apply(null, arguments);
    }

    /**
     * Outputs a debug level logging message
     */
    debug() {
        this.logger.debug.apply(null, arguments);
    }

    /**
     * Outputs a basic log level logging message
     */
    log() {
        this.logger.log.apply(null, arguments);
    }

    /**
     * Outputs an informational logging message
     */
    info() {
        this.logger.info.apply(null, arguments);
    }

    /**
     * Outputs a warn level logging message
     */
    warn() {
        this.logger.warn.apply(null, arguments);
    }

    /**
     * Outputs an error level logging message
     */
    error() {
        this.logger.error.apply(null, arguments);
    }

}
const logger = new Logger();
logger.setDefaultLevel('warn');

export default logger;