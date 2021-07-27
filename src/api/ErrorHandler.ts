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

interface IErrorHandler {
    getError(err: any): {
        internalError: any;
        message?: undefined;
    } | {
        message: string;
        internalError: any;
    };
}

export default class ErrorHandler implements IErrorHandler {

    static getError(err) {
        let message = errors.unhandledError;

        if (err.internalError) {
            return {
                internalError: err
            }
        }
        if (err && err instanceof Error) {
            const {status, response} = err;
            if (status) {
                // HTTP Codes: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
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
                try {
                    const resp = JSON.stringify(response.body, null, 2);
                    message = message + '\n' + resp;
                } catch (e) {
                    message = message + "\n" + response.body;
                }
            }
        }
        return {
            message,
            internalError: err
        }
    }

}
