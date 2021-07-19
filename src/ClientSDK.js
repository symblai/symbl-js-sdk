import EndpointApi from './api/EndpointApi';
import RealtimeApi from './api/RealtimeApi';
import SessionApi from './api/SessionApi';
import StopProcessingEvent from './event/StopProcessingEvent';
import OAuth2 from './api/OAuth2';
import Cache from './cache/Cache';
import logger from './logger/Logger';
import isNode from 'detect-node';
import {ApiClient} from '@rammerai/api-client';
import EventApi from "./event/EventApi";

export default class ClientSDK {

    constructor(options = {}) {
        this.oauth2 = new OAuth2();
        this.apiClient = null;
        this.cache = new Cache();
    }

    async init(options) {
        if (!options) {
            throw new Error('options with appId and appSecret must be provided.');
        }

        const {appId, appSecret, logLevel, tlsAuth, basePath} = await options;

        if (!appId) {
            throw new Error('appId is required.');
        }

        if (!appSecret) {
            throw new Error('appSecret is required.');
        }

        if (logLevel) {
            logger.setLevel(logLevel);
        }

        if (!tlsAuth && isNode) {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        }

        this.basePath = basePath;

        logger.trace('Initializing SDK with options: ', options);

        return new Promise((resolve, reject) => {
            this.oauth2.init(options.appId, options.appSecret)
                .then(() => {
                    const apiClient = new ApiClient();
                    if (basePath || (basePath && basePath !== this.oauth2.apiClient.basePath)) {
                        apiClient.basePath = basePath;
                    }

                    apiClient.authentications = this.oauth2.apiClient.authentications;

                    this.endpointClient = new EndpointApi({}, apiClient);
                    resolve();
                }).catch(reason => reject(reason));
        });
    }

    async startRealtimeRequest(options = {}) {
        if (!this.oauth2) {
            throw new Error('SDK is not initialized or failed during initialization.');
        }

        options.basePath = options.basePath || this.basePath;

        const realtimeClient = new RealtimeApi(options, this.oauth2);

        const startRequest = (resolve, reject) => {
            logger.info('Starting request.');
            realtimeClient.startRequest().then((conversationId) => {
                logger.info('Realtime request started: ' + conversationId);
                resolve({
                    stop: () => {
                        return new Promise((resolve, reject) => {
                            realtimeClient.stopRequest().then((conversationData) => {
                                logger.info('Realtime request stopped.');
                                if (conversationData)
                                    delete conversationData.type;
                                resolve(conversationData);
                            }).catch((err) => {
                                reject(err);
                            });
                        });
                    },
                    sendAudio: (data) => {
                        realtimeClient.sendAudio(data);
                    },
                    conversationId
                });
            }).catch((err) => {
                reject(err);
            });
        };

        return new Promise((resolve, reject) => {
            let retryCount = 0;

            const retry = () => {
                if (retryCount < 4) {
                    logger.info('Retry attempt: ', retryCount, this.oauth2);
                    if (this.oauth2 && this.oauth2.activeToken) {
                        realtimeClient.connect();
                        startRequest(resolve, reject);
                    } else {
                        logger.info('Active Token not found.');
                        retryCount++;
                        setTimeout(retry.bind(this), 1000 * retryCount);
                    }
                } else {
                    reject({message: 'Could not connect to real-time api after 4 retries.'})
                }
            };
            setTimeout(retry.bind(this), 0);
        });
    }

    async startEndpoint(options, callback) {
        if (!options) {
            throw new Error('options must be provided.');
        }

        let {endpoint, validationToken, actions, intents, enableEvents, data, endpointWebhookUrl, headers, pushSpeakerEvents, languages: languagesArray, timezone} = options;

        if (!endpoint) {
            throw new Error('endpoint is required.');
        }

        if (!this.endpointClient) {
            throw new Error('SDK is not initialized or failed during initialization.')
        }

        let languages = undefined;

        if (languagesArray && languagesArray.length > 0) {
            languages = languagesArray.map(language => { return { code: language } });
        }

        if (!!timezone) {
            if (!data) {
                data = {
                    session: {}
                }
            }

            data.session.location = {timeZone: {name: timezone}};
        }

        return new Promise((resolve, reject) => {
            this.endpointClient.startEndpoint({endpoint, validationToken, actions, intents, enableEvents, data, endpointWebhookUrl, headers, pushSpeakerEvents, languages})
                .then((connection) => {
                    if (callback) {
                        const sessionApi = new SessionApi({callback, id: connection.connectionId, basePath: this.basePath}, this.oauth2);
                        sessionApi.connect();
                    }
                    resolve(connection);
                }).catch((err) => {
                reject(err);
            });
        });
    }

    async stopEndpoint(options) {
        if (!options) {
            throw new Error('options must be provided.');
        }

        const {connectionId, actions, data} = options;

        if (!connectionId) {
            throw new Error('connectionId is required to stop the endpoint connection.');
        }

        if (!this.endpointClient) {
            throw new Error('SDK is not initialized or was failed during initialization.')
        }

        if (this.cache.contains(connectionId)) {
            const connection = this.cache.get(connectionId);
            if (connection) {
                if (connection.eventApi.webSocketStatus === EventApi.getWebSocketConnectionStatuses().connected) {
                    this.pushEventOnConnection(connectionId, new StopProcessingEvent({
                        timestamp: new Date().toISOString(),
                        topic: StopProcessingEvent.topics().speaker
                    }).toJSON());
                }
            }
        }

        return new Promise((resolve, reject) => {
            this.endpointClient.stopEndpoint({connectionId, actions, data})
                .then((connection) => {
                    resolve(connection);
                }).catch((err) => {
                reject(err);
            });
        });
    }

    subscribeToConnection(connectionId, callback) {
        const sessionApi = new SessionApi({callback, id: connectionId, basePath: this.basePath}, this.oauth2);
        sessionApi.connect();
    }

    async pushEventOnConnection(connectionId, event, callback) {
        return new Promise((resolve, reject) => {
            if (this.cache.contains(connectionId)) {
                const connection = this.cache.get(connectionId);
                if (connection) {
                    if (connection.status === 'active') {
                        connection.pushEvent(event, (err) => {
                            if (err) {
                                if (callback) callback(err);
                                reject(err);
                            } else {
                                if (callback) callback();
                                resolve();
                            }
                        });
                    } else if (connection.status === 'closed') {
                        const err = {
                            message: `Connection with connectionId '${connectionId}' has been stopped. Cannot push an event on the stopped connection.`
                        };
                        if (callback) callback(err);
                        reject(err);
                    } else {
                        const err = {
                            message: `Connection with connectionId '${connectionId}' is in unexpected state.`
                        };
                        if (callback) callback(err);
                        reject(err);
                    }
                } else {
                    const err = {
                        message: `Invalid connection by connectionId '${connectionId}' detected.`
                    };
                    if (callback) callback(err);
                    reject(err);
                }
            } else {
                const err = {
                    message: `No connection by connectionId '${connectionId}' found.`
                };
                if (callback) callback(err);
                reject(err);
            }
        });
    }
}
