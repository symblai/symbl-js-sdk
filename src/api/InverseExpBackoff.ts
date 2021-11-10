/* eslint-disable no-promise-executor-return */
import logger from "../logger/Logger";

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable arrow-body-style */

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
    constructor (max = 5000, min = 100, factor = 0.75, maxRetries = 10) {

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

    }

    /**
     * Inverse Exponential backoff for waiting retries of function
     * @param {function} fn - function to call after sleep
     * @returns the provided function and executes it
     */
    async run (fn: Function): Promise<Function> {

        if (!fn || typeof fn !== "function") {

            // eslint-disable-next-line max-len
            logger.error("Please provide a callback function to be run after the inverse exponential backoff delay.");

        }

        if (this.retries === 0) {

            logger.error("No retries remaining.");
            throw new Error("No retries remaining.");

        }

        try {

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

            return fn();

        } catch (err) {

            logger.error(err);

        }

    }

}
