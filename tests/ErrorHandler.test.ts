import ErrorHandler from "../src/api/ErrorHandler"

test('getError() 500', () => {
    const error = {
        status: 500,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "Error occurred in the remote system. If the problem doesn't resolve in sometime, contact the support immediately - support@rammer.ai"
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('getError() 500-511', () => {
    for (let status=500; status<=511; status++) {
        const error = {
            status: status,
            response: {
                body: {
                    "key": "value"
                }
            }
        }
        const resp = ErrorHandler.getError(error);
        const respBody = JSON.stringify(error.response.body)
        let message = "Error occurred in the remote system. If the problem doesn't resolve in sometime, contact the support immediately - support@rammer.ai"
        message = message + '\n' + respBody
        expect({
            "message": message,
            "internalError": error
        });
    }
})

test('getError() 400', () => {
    const error = {
        status: 400,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "The request syntax is not valid."
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('getError() 401', () => {
    const error = {
        status: 401,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "Your app is not authorized to perform this operation. Please make sure that the credentials are provided using init(), and are valid."
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('getError() 402', () => {
    const error = {
        status: 402,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "You don't have enough balance to perform this operation."
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('getError() 403', () => {
    const error = {
        status: 403,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "Your app doesn't have enough permissions to perform this operation."
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('getError() 404', () => {
    const error = {
        status: 404,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "The requested resource was not found."
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('getError() 405', () => {
    const error = {
        status: 405,
        response: {
            body: {
                "key": "value"
            }
        }
    }
    const resp = ErrorHandler.getError(error);
    const respBody = JSON.stringify(error.response.body)
    let message = "Error occurred in client sdk. please report this issue or contact the support - support@rammer.ai"
    message = message + '\n' + respBody
    expect({
        "message": message,
        "internalError": error
    });
})

test('internalError passed into getError()', () => {
    const error = {
        internalError: "This is an internal Error"
    }
    ErrorHandler.getError(error);
    expect({
        "internalError": error
    });
})