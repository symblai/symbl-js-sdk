/* eslint-disable arrow-body-style */
/**
 * Causes a pause in execution for a specified amount of time
 * @param {float} ms - milliseconds to sleep
 * @returns a Promise with a setTimeout of the time provided
 */
const sleep = (ms) => {

    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => {

        setTimeout(
            resolve,
            ms
        );

    });

};

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
     * Inverse Exponential backoff for waiting retries of function
     * @param {function} fn - function to call after sleep
     * @returns the provided function and executes it
     */
    async run (fn) {

        if (this.retries === 0) {

            throw new Error("No more retries left");

        }

        await sleep(this.nextDelay);

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
