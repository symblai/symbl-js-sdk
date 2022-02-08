/* eslint-disable no-promise-executor-return */
import logger from "../logger/Logger";

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable arrow-body-style */

const DEFAULT_FACTOR = 0.90;
const DEFAULT_MAX_RETRIES = 20;
const DEFAULT_MAX = 5000;
const DEFAULT_MIN = 100;

export default class IEBackoff {

    max: number;

    min: number;

    factor: number;

    retries: number;

    nextDelay: number;

    /**
     * @param {integer} max - max delay time in milliseconds
     * @param {integer} min - min delay time in milliseconds
     * @param {float} factor - factor to multiply by
     * @param {integer} maxRetries - maximum number of retries
     */
    // eslint-disable-next-line max-params
    constructor (max = DEFAULT_MAX, min = DEFAULT_MIN, factor = DEFAULT_FACTOR, maxRetries = DEFAULT_MAX_RETRIES) {

        if (max <= min) {

            logger.error("Maximum delay must be greater than minimum delay.");

        }

        if (factor >= 1 || factor <= 0) {

            logger.error("Factor must be between 0 and 1.");

        }

        if (maxRetries <= 0) {

            logger.error("Maximum retries must be greater than 0.");

        }

        this.max = max;
        this.min = min;
        this.factor = factor;
        this.retries = maxRetries;
        this.nextDelay = max;

        this.reset = this.reset.bind(this);
        this.run = this.run.bind(this);
    }

    reset (): void {
        this.max = DEFAULT_MAX;
        this.min = DEFAULT_MIN;
        this.factor = DEFAULT_FACTOR;
        this.retries = DEFAULT_MAX_RETRIES;
        this.nextDelay = DEFAULT_MAX;
    }

    /**
     * Inverse Exponential backoff for waiting retries of function
     * @param {function} fn - function to call after sleep
     * @param context - Function context to execute with
     * @param args - Array of arguments for the function
     * @param executeWithoutDelay - Skip delay for an execution
     * @returns the provided function and executes it
     */
    async run (fn: Function, context = null, args = [], executeWithoutDelay = false): Promise<Function> {

        if (!fn || typeof fn !== "function") {

            // eslint-disable-next-line max-len
            const errorMessage = "Please provide a callback function to be run after the inverse exponential backoff delay.";
            logger.error(errorMessage);
            return Promise.reject(errorMessage);
        }

        if (args && !Array.isArray(args)) {
            logger.error("No valid arguments passed in args")
        }

        if (this.retries === 0) {

            logger.error("No retries remaining.");
            throw new Error("No retries remaining.");

        }

        try {

            if (!executeWithoutDelay) {
                // Pauses further execution of the function until delay has passed
                await new Promise((resolve) => setTimeout(
                    resolve,
                    this.nextDelay
                ));

                this.retries -= 1;

                const newBackoffTime = this.nextDelay * this.factor;

                if (newBackoffTime > this.min) {

                    this.nextDelay = newBackoffTime;

                } else {

                    this.nextDelay = this.min;

                }
            }

            const result = await fn.apply(context, args);

            return result;
        } catch (err) {

            if (this.retries <= 0) {
                logger.error(err);
                throw err;
            } else {
                logger.warn(`Execution failed with exception: ${err && err.message} -- Retrying`, err);
                return this.run(fn, context, args);
            }

        }

    }

}
