/* eslint-disable */
const errors = {
    unhandledError: `Unrecognized error has occurred, please report this issue or contact the support - support@rammer.ai`,
    unhandledServerError: `Error occurred in the remote system. If the problem doesn't resolve in sometime, contact the support immediately - support@rammer.ai`,
    unhandledClientError: `Error occurred in client sdk. please report this issue or contact the support - support@rammer.ai`,
    unauthorized: `Your app is not authorized to perform this operation. Please make sure that the credentials are provided using init(), and are valid.`,
    forbidden: `Your app doesn't have enough permissions to perform this operation.`,
    notFound: `The requested resource was not found.`,
    badRequest: `The request syntax is not valid.`,
    paymentRequired: `You don't have enough balance to perform this operation.`
};
/* eslint-enable */
interface SymblError {
    status: number;
    response: { body: unknown }
    internalError?: unknown
}

interface InternalError {
    "internalError": SymblError,
    "message"?: string
}

export default class ErrorHandler {

    /**
     * Single method inside ErrorHandler class that takes in error
     * parameters via an object and returns an object containing the
     * error message as a string and the error object.
     * @param {object} err - Error object
     * @returns {object} - object containing message string and err obj
     */
    static getError (err: SymblError): InternalError {

        let message:string = errors.unhandledError;

        if (err.internalError) {

            return {
                "internalError": err
            };

        }
        if (err && err.status && err.response) {

            const {status, response} = err;

            if (status) {

                // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
                if (status >= 500 && status <= 511) {

                    // Server errors
                    message = errors.unhandledServerError;

                } else if (status >= 400 && status <= 451) {

                    // Client errors
                    switch (status) {

                    case 400:
                        message = errors.badRequest;
                        break;
                    case 401:
                        message = errors.unauthorized;
                        break;
                    case 402:
                        message = errors.paymentRequired;
                        break;
                    case 403:
                        message = errors.forbidden;
                        break;
                    case 404:
                        message = errors.notFound;
                        break;
                    default:
                        message = errors.unhandledClientError;

                    }

                }

            }
            if (response && response.body) {

                const resp = JSON.stringify(
                    response.body,
                    null,
                    2
                );
                message = `${message}\n${resp}`;

            }

        }
        return {
            "internalError": err,
            message
        };

    }

}
