/* eslint-disable max-len */
/* eslint-disable sort-keys */
/* eslint-disable max-lines */
/* eslint-disable padded-blocks */
import EndpointApi from "./api/EndpointApi";
import RealtimeApi from "./api/RealtimeApi";
import SessionApi from "./api/SessionApi";
import StopProcessingEvent from "./event/StopProcessingEvent";
import OAuth2 from "./api/OAuth2";
import Cache from "./cache/Cache";
import logger from "./logger/Logger";
import isNode from "detect-node";
import {ApiClient} from "@symblai/api-client";
import EventApi from "./event/EventApi";

export default class ClientSDK {

    constructor (options = {}) {

        this.oauth2 = new OAuth2();
        this.apiClient = null;
        this.cache = new Cache();
        this.logger = logger;

    }

    // eslint-disable-next-line class-methods-use-this
    setOffline (isOffline = false) {
        // Add more offline/reconnection states here
        RealtimeApi.isOffline = isOffline;
    }

    async init (options) {

        if (!options) {

            throw new Error("options with appId and appSecret must be provided.");

        }

        const {appId, appSecret, logLevel, tlsAuth, basePath, accessToken} = await options;

        if (!appId && !accessToken) {
            throw new Error('appId is required.');
        }

        if (!appSecret && !accessToken) {
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
            this.oauth2.init(options.appId, options.appSecret, options.accessToken)
                .then(() => {
                    const apiClient = new ApiClient();
                    if (basePath || basePath && basePath !== this.oauth2.apiClient.basePath) {

                        apiClient.basePath = basePath;

                    }

                    apiClient.authentications = this.oauth2.apiClient.authentications;

                    this.endpointClient = new EndpointApi(
                        {},
                        apiClient
                    );
                    resolve();
                }).catch(reason => reject(reason));
        });
    }

    async createStream (options = {}) {

        if (!this.oauth2) {

            throw new Error("SDK is not initialized or failed during initialization.");
        }

        options.basePath = options.basePath || this.basePath;
        if (!options.id) {
            logger.warn(`No 'id' detected. Generating a UUID. Reference 'connectionId' property of the resolved object.`);
            options.id = v4();
        }

        let realtimeClient = this.cache.get(options.id);
        if (!realtimeClient) {
            realtimeClient = new RealtimeApi(options, this.oauth2, false, {
                _onClose: () => {
                    this.cache.remove(options.id);
                }
            });
            this.cache.set(options.id, realtimeClient);
        }

        return new Promise((resolve, reject) => {
            let retryCount = 0;

            const retry = () => {
                if (retryCount < 4) {
                    logger.info(
                        "Retry attempt: ",
                        retryCount,
                        this.oauth2
                    );

                    if (this.oauth2 && this.oauth2.activeToken) {
                        realtimeClient.connect(async (err) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({
                                    stop: async () => {
                                        try {
                                            const conversationData = await realtimeClient.stopRequest();
                                            if (conversationData) {
                                                logger.info("Realtime request stopped.");
                                                delete conversationData.type;

                                                return conversationData;
                                            }

                                            return {};
                                        } catch (e) {
                                            throw e;
                                        }
                                    },

                                    start: (options) => {
                                        if (options && typeof options === "object") {
                                            realtimeClient.options = {
                                                ...(realtimeClient.options || {}),
                                                ...options
                                            };
                                        }

                                        return new Promise((resolveS, rejectS) => {
                                            realtimeClient.sendStart(resolveS, rejectS);
                                        });
                                    },

                                    sendAudio: (data) => {
                                        realtimeClient.sendAudio(data);
                                    },

                                    close: () => {
                                        realtimeClient.webSocket.disconnect();
                                        this.cache.remove(options.id);
                                    },

                                    connectionId: realtimeClient.id,
                                    conversationId: realtimeClient.conversationId,
                                });
                            }
                        });
                    } else {
                        logger.info("Active Token not found.");
                        retryCount++;
                        setTimeout(
                            retry.bind(this),
                            1000 * retryCount
                        );
                    }
                } else {
                    reject({"message": "Could not connect to real-time api after 4 retries."});
                }
            };

            setTimeout(
                retry.bind(this),
                0
            );
        });
    }

    async startRealtimeRequest (options = {}) {
        if (!this.oauth2) {
            throw new Error("SDK is not initialized or failed during initialization.");
        }

        options.basePath = options.basePath || this.basePath;

        let realtimeClient = this.cache.get(options.id);
        if (!realtimeClient) {
            realtimeClient = new RealtimeApi(options, this.oauth2, true, {
                _onClose: () => {
                    this.cache.remove(options.id);
                }
            });
            this.cache.set(options.id, realtimeClient);
        }

        const startRequest = (resolve, reject) => {

            logger.info("Starting request.");
            realtimeClient.startRequest().then((conversationId) => {

                logger.info(`Realtime request started: ${conversationId}`);
                resolve({
                    "stop": () => new Promise((resolve, reject) => {

                        realtimeClient.stopRequest().then((conversationData) => {

                            logger.info("Realtime request stopped.");
                            if (conversationData) {
                                delete conversationData.type;
                            }

                            this.cache.remove(options.id);
                            resolve(conversationData);
                        }).catch((err) => {
                            this.cache.remove(options.id);
                            reject(err);
                        });

                    }),
                    "sendAudio": (data) => {
                        realtimeClient.sendAudio(data);
                    },
                    "connectionId": realtimeClient.id,
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

                    logger.info(
                        "Retry attempt: ",
                        retryCount,
                        this.oauth2
                    );
                    if (this.oauth2 && this.oauth2.activeToken) {

                        realtimeClient.connect();
                        startRequest(
                            resolve,
                            reject
                        );

                    } else {

                        logger.info("Active Token not found.");
                        retryCount++;
                        setTimeout(
                            retry.bind(this),
                            1000 * retryCount
                        );

                    }

                } else {

                    reject({"message": "Could not connect to real-time api after 4 retries."});

                }

            };
            setTimeout(
                retry.bind(this),
                0
            );

        });

    }

    async startEndpoint (options, callback) {

        if (!options) {

            throw new Error("options must be provided.");

        }

        let {endpoint, validationToken, actions, intents, enableEvents, data, endpointWebhookUrl, headers, pushSpeakerEvents, "languages": languagesArray, timezone} = options;

        if (!endpoint) {

            throw new Error("endpoint is required.");

        }

        if (!this.endpointClient) {

            throw new Error("SDK is not initialized or failed during initialization.");

        }

        let languages;

        if (languagesArray && languagesArray.length > 0) {

            languages = languagesArray.map((language) => ({"code": language}));

        }

        if (timezone) {

            if (!data) {

                data = {
                    "session": {}
                };

            }

            data.session.location = {"timeZone": {"name": timezone}};

        }

        return new Promise((resolve, reject) => {

            this.endpointClient.startEndpoint({endpoint,
                validationToken,
                actions,
                intents,
                enableEvents,
                data,
                endpointWebhookUrl,
                headers,
                pushSpeakerEvents,
                languages}).
                then((connection) => {

                    if (callback) {

                        const sessionApi = new SessionApi(
                            {callback,
                                "id": connection.connectionId,
                                "basePath": this.basePath},
                            this.oauth2
                        );
                        sessionApi.connect();

                    }
                    resolve(connection);

                }).
                catch((err) => {

                    reject(err);

                });

        });

    }

    async stopEndpoint (options) {

        if (!options) {

            throw new Error("options must be provided.");

        }

        const {connectionId, actions, data} = options;

        if (!connectionId) {

            throw new Error("connectionId is required to stop the endpoint connection.");

        }

        if (!this.endpointClient) {

            throw new Error("SDK is not initialized or was failed during initialization.");

        }

        if (this.cache.contains(connectionId)) {

            const connection = this.cache.get(connectionId);
            if (connection) {

                if (connection.eventApi.webSocketStatus === EventApi.getWebSocketConnectionStatuses().connected) {

                    this.pushEventOnConnection(
                        connectionId,
                        new StopProcessingEvent({
                            "timestamp": new Date().toISOString(),
                            "topic": StopProcessingEvent.topics().speaker
                        }).toJSON()
                    );

                }

            }

        }

        return new Promise((resolve, reject) => {

            this.endpointClient.stopEndpoint({connectionId,
                actions,
                data}).
                then((connection) => {

                    resolve(connection);

                }).
                catch((err) => {

                    reject(err);

                });

        });

    }

    subscribeToConnection (connectionId, options) {
        // For backwards compatability. 2nd param was previously
        // a callback function.
        if (typeof options === "function") {
            options = {
                handlers: {
                    onMessage: options
                }
            }
        }
        const sessionApi = new SessionApi(
            {
                options,
                "id": connectionId,
                "basePath": this.basePath,
                "isStreaming": false
            },
            this.oauth2
        );
        sessionApi.connect();

    }

    subscribeToStream (connectionId, options) {
        // For backwards compatability. 2nd param was previously
        // a callback function.
        if (typeof options === "function") {
            options = {
                handlers: {
                    onMessage: options
                }
            }
        }
        const sessionApi = new SessionApi(
            {
                options,
                "id": connectionId,
                "basePath": this.basePath,
                "isStreaming": true
            },
            this.oauth2
        );
        sessionApi.connect();

    }

    async pushEventOnConnection (connectionId, event, callback) {

        return new Promise((resolve, reject) => {

            if (this.cache.contains(connectionId)) {

                const connection = this.cache.get(connectionId);
                if (connection) {

                    if (connection.status === "active") {

                        connection.pushEvent(
                            event,
                            (err) => {

                                if (err) {

                                    if (callback) {

                                        callback(err);

                                    }
                                    reject(err);

                                } else {

                                    if (callback) {

                                        callback();

                                    }
                                    resolve();

                                }

                            }
                        );

                    } else if (connection.status === "closed") {

                        const err = {
                            "message": `Connection with connectionId '${connectionId}' has been stopped. Cannot push an event on the stopped connection.`
                        };
                        if (callback) {

                            callback(err);

                        }
                        reject(err);

                    } else {

                        const err = {
                            "message": `Connection with connectionId '${connectionId}' is in unexpected state.`
                        };
                        if (callback) {

                            callback(err);

                        }
                        reject(err);

                    }

                } else {

                    const err = {
                        "message": `Invalid connection by connectionId '${connectionId}' detected.`
                    };
                    if (callback) {

                        callback(err);

                    }
                    reject(err);

                }

            } else {

                const err = {
                    "message": `No connection by connectionId '${connectionId}' found.`
                };
                if (callback) {

                    callback(err);

                }
                reject(err);

            }

        });

    }

}
