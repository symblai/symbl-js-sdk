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

        this.max = max;
        this.min = min;
        this.factor = factor;
        this.retries = maxRetries;
        this.nextDelay = max;

    }

    /**
     * Causes a pause in execution for a specified amount of time
     * @param {float} ms - milliseconds to sleep
     * @returns a Promise with a setTimeout of the time provided
     */
    // eslint-disable-next-line class-methods-use-this
    sleep (ms: number): Promise<void> {

        // eslint-disable-next-line no-promise-executor-return
        return new Promise((resolve) => {

            setTimeout(
                resolve,
                ms
            );

        });


    }

    /**
     * Inverse Exponential backoff for waiting retries of function
     * @param {function} fn - function to call after sleep
     * @returns the provided function and executes it
     */
    async run (fn: Function): Promise<Function> {

        if (!fn || typeof fn !== "function") {

            // eslint-disable-next-line max-len
            logger.error("Please provide a callback function to be run after the inverse exponential backoff delay");

        }

        if (this.retries === 0) {

            logger.error("No more retries left");

        }

        await this.sleep(this.nextDelay);

        this.retries -= 1;

        const newBackoffTime = this.nextDelay * this.factor;

        if (newBackoffTime > this.min) {

            this.nextDelay = newBackoffTime;

        } else {

            this.nextDelay = this.min;

        }

        return fn();

    }

}
