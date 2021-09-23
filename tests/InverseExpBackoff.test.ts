/* eslint-disable no-new */
/* eslint-disable max-len */
import IEBackoff from "../src/api/InverseExpBackoff";

jest.useFakeTimers();

test(
    "constructor(): Check if fails when maximum delay is less than minimum delay",
    () => {

        try {

            new IEBackoff(
                100,
                200
            );

        } catch (err) {

            expect(err).toEqual("Maximum delay must be greater than minimum delay.");

        }

    }
);

test(
    "constructor(): Check if fails when factor is not between 0 and 1",
    () => {

        try {

            new IEBackoff(
                200,
                100,
                0
            );

        } catch (err) {

            expect(err).toEqual("Factor must be between 0 and 1.");

        }

        try {

            new IEBackoff(
                200,
                100,
                1
            );

        } catch (err) {

            expect(err).toEqual("Factor must be between 0 and 1.");

        }

    }
);

test(
    "constructor(): Check if fails when maxRetries is not greater than 0",
    () => {

        try {

            new IEBackoff(
                200,
                100,
                0.5,
                0
            );

        } catch (err) {

            expect(err).toEqual("Maximum retries must be greater than 0.");

        }

    }
);

test(
    "run(): Check if fails with no function provided",
    () => {

        const backoff = new IEBackoff();

        try {

            backoff.run();

        } catch (err) {

            expect(err).toEqual("Please provide a callback function to be run after the inverse exponential backoff delay.");

        }

    }
);

test(
    "run(): Check if fails on anything other than a function as an argument",
    () => {

        const backoff = new IEBackoff();

        try {

            backoff.run("test");

        } catch (err) {

            expect(err).toEqual("Please provide a callback function to be run after the inverse exponential backoff delay");

        }

        try {

            backoff.run(123);

        } catch (err) {

            expect(err).toEqual("Please provide a callback function to be run after the inverse exponential backoff delay");

        }

        try {

            backoff.run([
                1,
                2,
                3
            ]);

        } catch (err) {

            expect(err).toEqual("Please provide a callback function to be run after the inverse exponential backoff delay");

        }

    }
);

test(
    "run(): Check if fail when out of retries",
    async () => {

        const backoff = new IEBackoff(
            // Maximum/initial delay
            5000,
            // Minimum delay
            100,
            // Factor
            0.5,
            // Max Retries
            1
        );

        const retry = jest.fn();

        try {

            backoff.run(retry);
            jest.advanceTimersByTime(5000);
            await Promise.resolve();

            backoff.run(retry);

        } catch (err) {

            expect(err).toEqual("No retries remaining.");

        }

    }
);

test(
    "run(): Check if delay is correct amount of time",
    async () => {

        const backoff = new IEBackoff(
            // Maximum/initial delay
            5000,
            // Minimum delay
            100,
            // Factor
            0.5,
            // Max Retries
            1
        );

        const retry = jest.fn();

        try {

            backoff.run(retry);
            jest.advanceTimersByTime(5000);
            await Promise.resolve();
            expect(retry).toHaveBeenCalledTimes(1);

        } catch (err) {

            throw new Error(err);

        }

    }
);

test(
    "run(): Check if delay is correct amount of time",
    async () => {

        const backoff = new IEBackoff(
            // Maximum/initial delay
            5000,
            // Minimum delay
            100,
            // Factor
            0.5,
            // Max Retries
            4
        );

        const retry = jest.fn();

        try {

            backoff.run(retry);
            jest.advanceTimersByTime(5000);
            await Promise.resolve();

            backoff.run(retry);
            jest.advanceTimersByTime(5000 * 0.5);
            await Promise.resolve();

            backoff.run(retry);
            jest.advanceTimersByTime(5000 * 0.5 * 0.5);
            await Promise.resolve();

            backoff.run(retry);
            jest.advanceTimersByTime(5000 * 0.5 * 0.5 * 0.5);
            await Promise.resolve();

            expect(retry).toHaveBeenCalledTimes(4);

        } catch (err) {

            throw new Error(err);

        }

    }
);
