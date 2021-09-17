/* eslint-disable max-len */
import IEBackoff from "../src/api/InverseExpBackoff";

jest.useFakeTimers();

test(
    "sleep(): Check error on not supplying a ms argument",
    () => {

        const backoff = new IEBackoff();

        try {

            backoff.sleep();

        } catch (err) {

            expect(err).toEqual("Please supply the ms value for sleep");

        }

    }
);

test(
    "sleep(): Check if sleep returns a setTimeout() function in promise",
    () => {

        const backoff = new IEBackoff();

        expect(backoff.sleep(100)).resolves.toBe(setTimeout);

    }

);

test(
    "run(): Check if fails with no function provided",
    () => {

        const backoff = new IEBackoff();

        try {

            backoff.run();

        } catch (err) {

            expect(err).toEqual("Please provide a callback function to be run after the inverse exponential backoff delay");

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
    "run(): Check if delay is correct amount of time",
    async () => {

        const backoff = new IEBackoff(1000);

        const retry = jest.fn();

        backoff.run(retry);
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        expect(retry).toHaveBeenCalledTimes(1);

    }
);
