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

export default class ErrorHandler {

    static getError(err: any) {

        let message:string = errors.unhandledError;

        if (err.internalError) {
            return {
                internalError: err
            }
        }
        if (err && err.status && err.response) {
            const status:number = err.status; 
            const response:any = err.response;

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
                const resp = JSON.stringify(response.body, null, 2);
                message = message + '\n' + resp;
            }
        }
        return {
            message,
            internalError: err
        }
    }

}
