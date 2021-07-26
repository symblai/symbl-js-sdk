import {ApiClient, AuthenticationApi, Grant} from '@rammerai/api-client';
import config from '../config';
import ErrorHandler from './ErrorHandler';
import logger from "../logger/Logger";

export default class OAuth2 {

    constructor(options = {}) {
        this.apiClient = new ApiClient();
        this.apiClient.basePath = options.authBasePath || config.authBasePath || options.basePath || config.basePath;
        this.authenticationApi = new AuthenticationApi(this.apiClient);
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

        this.init = this.init.bind(this);
        this.processTokenResult = this.processTokenResult.bind(this);

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
        logger.trace('Token updated on : ', this.updatedOn);
        this.expiresOn = new Date(this.updatedOn.getTime() + this.expiresIn * 1000)
        logger.trace('Token will expire on : ', this.expiresOn);

        if (this.automaticallyRefreshToken) {
            this.refreshOn = new Date(this.expiresOn.getTime() - this.refreshTimeBeforeExpiry*1000);
            logger.trace('Token will be refreshed on: ', this.refreshOn);
            // const refreshDuration = moment.duration(this.refreshOn.diff(this.updatedOn)).asMilliseconds(); // In milliseconds
            const refreshDuration = (this.expiresIn - this.refreshTimeBeforeExpiry) * 1000;
            logger.trace('Refresh is scheduled in millis: ', refreshDuration);
            setTimeout(() => {
                this.init(this.appId, this.appSecret)
                    .then((() => {
                        logger.trace('Token refreshed');
                    })).catch((e) => {
                        logger.error(e);
                })
            }, refreshDuration);
        }
    }

    init(appId, appSecret) {
        if (arguments.length < 2) {
            throw new Error(`Expected number of arguments 2, detected: ${arguments.length}`);
        }

        if (!appId) {
            throw new Error('appId is required.');
        }

        if (!appSecret) {
            throw new Error('appSecret is required.');
        }

        this.appId = appId;
        this.appSecret = appSecret;

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
