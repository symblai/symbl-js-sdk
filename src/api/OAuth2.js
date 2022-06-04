import {ApiClient, AuthenticationApi, Grant} from '@symblai/api-client';
import config from '../config';
import ErrorHandler from './ErrorHandler';
import logger from "../logger/Logger";

export default class OAuth2 {

    constructor(options = {}) {
        this.apiClient = new ApiClient();
        const basePath = options.authBasePath || config.authBasePath || options.basePath || config.basePath;
        this.setBasePath(basePath);
        this.appId = null;
        this.appSecret = null;
        this.activeToken = null;
        this.updatedOn = null;
        this.expiresOn = null;
        this.expiresIn = null;
        if (options.hasOwnProperty('automaticallyRefreshToken')) {
            this.automaticallyRefreshToken = options.automaticallyRefreshToken;
        } else {
            this.automaticallyRefreshToken = true;
        }

        // seconds
        this.refreshTimeBeforeExpiry = options.refreshTimeBeforeExpiry ||
            config.refreshTimeBeforeExpiry ||
            300;

        this.refreshOn = null;
        this.refreshTimeoutRef = null;

        this.init = this.init.bind(this);
        this.processTokenResult = this.processTokenResult.bind(this);
        this.validateToken = this.validateToken.bind(this);
        this.refreshAuthToken = this.refreshAuthToken.bind(this);
        this.setBasePath = this.setBasePath.bind(this);
    }

    setBasePath(basePath) {
        this.apiClient.basePath = basePath;
        this.authenticationApi = new AuthenticationApi(this.apiClient);
    }

    getApiClient() {
        return this.apiClient;
    }

    processTokenResult(data) {
        const {accessToken, expiresIn} = data;
        this.activeToken = accessToken;
        logger.trace('Token received.');
        this.apiClient.authentications.jwt.apiKey = this.activeToken;

        this.expiresIn = expiresIn;
        logger.trace('Token will expire in seconds: ', this.expiresIn);

        this.updatedOn = new Date();
        logger.trace('Token updated on: ', this.updatedOn);
        this.expiresOn = new Date(this.updatedOn.getTime() + this.expiresIn * 1000)
        logger.trace('Token will expire on : ', this.expiresOn);

        if (this.automaticallyRefreshToken) {
            this.refreshOn = new Date(this.expiresOn.getTime() - this.refreshTimeBeforeExpiry*1000);
            logger.trace('Token will be refreshed on: ', this.refreshOn);
            // const refreshDuration = moment.duration(this.refreshOn.diff(this.updatedOn)).asMilliseconds(); // In milliseconds
            let refreshDuration = (this.expiresIn - this.refreshTimeBeforeExpiry) * 1000;
            logger.trace('Refresh is scheduled in millis: ', refreshDuration);

            if (refreshDuration < 0) {
                refreshDuration = this.expiresIn * 1000;
            }

            if (this.refreshTimeoutRef) {
                clearTimeout(this.refreshTimeoutRef);
            }

            this.refreshTimeoutRef = setTimeout(() => {
                this.init(this.appId, this.appSecret)
                .then((() => {
                    logger.trace('Token refreshed');
                })).catch((e) => {
                    logger.error(e);
                })
            }, refreshDuration);
        }
    }

    refreshAuthToken() {
        return this.validateToken(this.activeToken);
    }

    validateToken(token) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!!token) {
                    const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').
                        toString());
                    if (tokenPayload.exp) {
                        const expiry = Math.floor(tokenPayload.exp - Date.now() / 1000);
                        if (expiry <= 60) {
                            if (this.appId && this.appSecret) {
                                try {
                                    const tokenData = await this.init(this.appId, this.appSecret);

                                    this.processTokenResult(tokenData);
                                    resolve(tokenData);
                                } catch (e) {
                                    logger.error(`Exception caught while refreshing token: ${e && e.message}`);
                                    reject({
                                        message: `The authentication token failed with exception: ${e && e.message}`
                                    })
                                }

                                return;
                            } else {
                                reject({
                                    message: `Provided token has expired`
                                });
                            }

                            return;
                        }

                        const data = {
                            accessToken: token,
                            expiresIn: expiry
                        };

                        this.processTokenResult(data);
                        resolve(data);
                    } else {
                        reject({
                            message: `Provided token is invalid`
                        });
                    }
                } else {
                    reject({
                        message: `Provided token was empty, undefined or null`
                    });
                }
            } catch (e) {
                logger.warn(`Token regeneration failed with error: ${e && e.message}`);
                resolve();
            }
        });
    }

    init(appId, appSecret, token) {
        if (!appId) {
            appId = this.appId;
        }

        if (!appSecret) {
            appSecret = this.appSecret;
        }

        if (!token) {
            token = this.activeToken;
        }

        if (!appId && !token) {
            throw new Error('appId is required.');
        }

        if (!appSecret && !token) {
            throw new Error('appSecret is required.');
        }

        if ((!appId || !appSecret) && !token) {
            throw new Error('token or appId/appSecret pair is required');
        }

        this.appId = appId;
        this.appSecret = appSecret;

        if (token) {
            return this.validateToken(token);
        }

        return new Promise((resolve, reject) => {
            logger.trace(`Initializing app with appId and appSecret`, appId, appSecret);
            try {
                const grant = Grant.constructFromObject({
                    type: 'application',
                    appId,
                    appSecret
                });
                this.authenticationApi.generateToken(grant, (err, data) => {
                    if (err) {
                        if (err.status && err.status === 401) {
                            const message = 'Combination of appId and appSecret is not valid.';
                            logger.info(message);
                            reject({
                                message,
                                internalError: err
                            });
                        } else {
                            reject(ErrorHandler.getError(err));
                        }
                    } else if (data) {
                        this.processTokenResult(data);
                        const {accessToken, expiresIn} = data;
                        resolve({
                            accessToken: accessToken,
                            expiresIn: expiresIn
                        });

                    } else {
                        reject(ErrorHandler.getError());
                    }
                });
            } catch (e) {
                reject(ErrorHandler.getError(e));
            }

        });
    }


}
