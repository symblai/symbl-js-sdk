import isNode from "detect-node";
import LogLevel from "loglevel";

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

    logger: typeof LogLevel;

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

                this.logger = LogLevel;
                global.clientSdkLogger = this.logger;

            }

        } else if (typeof window !== "undefined") {

            if (window.clientSdkLogger) {

                this.logger = window.clientSdkLogger;

            } else {

                this.logger = LogLevel;
                window.clientSdkLogger = this.logger;

            }

        } else {

            this.logger = LogLevel;

        }

    }

    /**
     * Sets the logging level.
     * @param {string} level - logging level
     */
    setLevel (...args: unknown[]): void {

        this.logger.setLevel.apply(
            null,
            args
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
    setDefaultLevel (...args: unknown[]): void {

        this.logger.setDefaultLevel.apply(
            null,
            args
        );

    }

    /**
     * Outputs a stack trace that will show the call path
     * taken to reach the point of the value
     * @param {string} value
     */
    trace (...args: unknown[]): void {

        this.logger.trace.apply(
            null,
            args
        );

    }

    /**
     * Outputs a debug level logging message
     */
    debug (...args: unknown[]): void {

        this.logger.debug.apply(
            null,
            args
        );

    }

    /**
     * Outputs a basic log level logging message
     */
    log (...args: unknown[]): void {

        this.logger.log.apply(
            null,
            args
        );

    }

    /**
     * Outputs an informational logging message
     */
    info (...args: unknown[]): void {

        this.logger.info.apply(
            null,
            args
        );

    }

    /**
     * Outputs a warn level logging message
     */
    warn (...args: unknown[]): void {

        this.logger.warn.apply(
            null,
            args
        );

    }

    /**
     * Outputs an error level logging message
     */
    error (...args: unknown[]): void {

        this.logger.error.apply(
            null,
            args
        );

    }

}
const logger = new Logger();
logger.setDefaultLevel("warn");

export default logger;
