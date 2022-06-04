import * as log from "loglevel";
import isNode from "detect-node";

declare let window: any; // eslint-disable-line

/**
 * Represents the logger
 * @constructor
 * Checks whether or not it's running in node
 * or the browser and binds all methods from
 * the "loglevel" package to the Logger object
 * to either the global or window objects.
 */
export class Logger {

    logger: typeof log;

    constructor () {

        this.initializeLogger();
        this.trace = this.trace.bind(this);
        this.debug = this.debug.bind(this);
        this.log = this.log.bind(this);
        this.info = this.info.bind(this);
        this.warn = this.warn.bind(this);
        this.error = this.error.bind(this);

    }

    initializeLogger (): void {

        if (isNode) {

            if (global.clientSdkLogger) {

                this.logger = global.clientSdkLogger;

            } else {

                this.logger = log;
                global.clientSdkLogger = this.logger;

            }

        } else if (typeof window !== "undefined") {

            if (window.clientSdkLogger) {

                this.logger = window.clientSdkLogger;

            } else {

                this.logger = log;
                window.clientSdkLogger = this.logger;

            }

        } else {

            this.logger = log;

        }

    }

    /**
     * Sets the logging level.
     * @param {string} level - logging level
     */
    setLevel (level): void {

        this.logger.setLevel.apply(
            null,
            [level]
        );

    }

    /**
     * Returns the current logging level.
     * @returns {string} - logging level
     */
    getLevel (): string {

        return this.logger.getLevel.apply(
            null,
            []
        );

    }

    /**
     * Sets the default logging level.
     * @param {string} level - logging level
     */
    setDefaultLevel (level): void {

        this.logger.setDefaultLevel.apply(
            null,
            [level]
        );

    }

    /**
     * Outputs a stack trace that will show the call path
     * taken to reach the point of the value
     * @param {string} value
     */
    trace (msg, meta = {}): void {

        this.logger.trace.apply(
            null,
            [msg, meta]
        );

    }

    /**
     * Outputs a debug level logging message
     */
    debug (msg, meta = {}): void {

        this.logger.debug.apply(
            null,
            [msg, meta]
        );

    }

    /**
     * Outputs a basic log level logging message
     */
    log (msg, meta = {}): void {

        this.logger.log.apply(
            null,
            [msg, meta]
        );

    }

    /**
     * Outputs an informational logging message
     */
    info (msg, meta = {}): void {

        this.logger.info.apply(
            null,
            [msg, meta]
        );

    }

    /**
     * Outputs a warn level logging message
     */
    warn (msg, meta = {}): void {

        this.logger.warn.apply(
            null,
            [msg, meta]
        );

    }

    /**
     * Outputs an error level logging message
     */
    error (msg, meta = {}): void {

        this.logger.error.apply(
            null,
            [msg, meta]
        );

    }

}
const logger = new Logger();
logger.setDefaultLevel("warn");

export default logger;
