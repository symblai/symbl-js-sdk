/* eslint-disable max-classes-per-file */
/* eslint-disable arrow-body-style */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-len */
/* eslint-disable sort-keys */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable capitalized-comments */
/* eslint-disable max-lines */
import Config from "../config";
import IEBackoff from "./InverseExpBackoff";
import WebSocket from "../websocket/WebSocket";
import logger from "../logger/Logger";
import {
    v4 as uuid
} from "uuid";

const webSocketConnectionStatus = {
    "closed": "closed",
    "connected": "connected",
    "connecting": "connecting",
    "error": "error",
    "notAvailable": "not_available",
    "notConnected": "not_connected"
};

export default class RealtimeApi {

    // eslint-disable-next-line default-param-last
    static isOffline = false;

    static networkConnectivityDispatcher;

    static setNetworkConnectivityDispatcher (networkConnectivityDispatcher) {
        RealtimeApi.networkConnectivityDispatcher = networkConnectivityDispatcher;
    }

    constructor (options = {}, oauth2, usePreviousGenerationResponses = false, handlers = {}) {

        let basePath = options.basePath || Config.basePath;
        basePath = basePath.replace(
            /^http/u,
            "ws"
        );
        const uri = `${basePath}/v1/realtime/insights`;

        if (!oauth2) {

            throw new Error("oauth2 is required for Real-time API.");

        }

        const {
            id
        } = options;

        // eslint-disable-next-line no-ternary
        this.id = id
            ? id
            : uuid();

        this.usePreviousGenerationResponses = usePreviousGenerationResponses;

        if (options.backoff) {

            this.backoff = new IEBackoff(
                options.backoff.max,
                options.backoff.min,
                options.backoff.factor,
                options.backoff.maxRetries
            );

        } else {

            this.backoff = new IEBackoff();

        }

        this.webSocketUrl = `${uri}/${this.id}`;
        this.options = options;

        this.referenceIds = [uuid()];

        this.connect = this.connect.bind(this);
        this._connect = this._connect.bind(this);
        this.reConnect = this.reConnect.bind(this);
        this.onConnectWebSocket = this.onConnectWebSocket.bind(this);
        this.onErrorWebSocket = this.onErrorWebSocket.bind(this);
        this.onMessageWebSocket = this.onMessageWebSocket.bind(this);
        this.onCloseWebSocket = this.onCloseWebSocket.bind(this);
        this.onForceClose = this.onForceClose.bind(this);

        this.onStartedListening = this.onStartedListening.bind(this);
        this.onSpeechDetected = this.onSpeechDetected.bind(this);
        this.onRequestStart = this.onRequestStart.bind(this);
        this.onRequestStop = this.onRequestStop.bind(this);
        this.onMessageResponse = this.onMessageResponse.bind(this);
        this.onInsightResponse = this.onInsightResponse.bind(this);
        this.onTrackerResponse = this.onTrackerResponse.bind(this);
        this.onTopicResponse = this.onTopicResponse.bind(this);
        this.onDataReceived = this.onDataReceived.bind(this);

        this.sendAudio = this.sendAudio.bind(this);
        this.sendStart = this.sendStart.bind(this);
        this.startRequest = this.startRequest.bind(this);

        this.oauth2 = oauth2;
        this.handlers = { ...(this.options.handlers || {}), ...handlers };

        this.retryCount = 0;
        this.requestStarted = false;

        this.conversationId = new Promise((resolve, reject) => {
            this.conversationIdSuccess = resolve;
            this.conversationIdError = reject;
        });
    }

    onErrorWebSocket (err) {

        this.webSocketStatus = webSocketConnectionStatus.error;

        logger.error(err);

        if (this.onConnectCallback) {
            if (typeof this.onConnectCallback === 'function') {
                this.onConnectCallback(err);
            } else {
                logger.warn("onConnectCallback is not a function");
            }
        }

    }

    onMessageWebSocket (result) {

        // Incoming results for this connection
        if (result) {

            const data = JSON.parse(result);
            if (data.type === "message") {

                const {
                    "message": {
                        type
                    }
                } = data;

                switch (type) {

                case "recognition_started":
                    if (!this.requestStarted)
                        this.requestStarted = true;
                    this.onRequestStart(data.message);
                    break;
                case "recognition_result":
                    this.onSpeechDetected(data.message);
                    break;
                case "started_listening":
                    this.requestStarted = true;
                    this.onStartedListening(data.message);
                    break;
                case "recognition_stopped":
                    this.onRequestStop();
                    break;
                case "conversation_completed":
                    this.onRequestStop(data.message);
                    if (this.handlers.onConversationCompleted) {

                        setImmediate(() => {

                            this.handlers.onConversationCompleted(data);

                        });

                    }
                    break;
                case "error":
                    this.onRequestError(data);
                    break;
                default:
                    break;

                }

            } else {

                switch (data.type) {

                case "message_response":
                    this.onMessageResponse(data.messages);
                    break;
                case "insight_response":
                    this.onInsightResponse(data.insights);
                    break;
                case "tracker_response":
                    this.onTrackerResponse(data);
                    break;
                case "topic_response":
                    this.onTopicResponse(data.topics);
                    break;
                default:
                    break;

                }

            }
            this.onDataReceived(data);

        }

    }

    async connect (onConnectCallback) {
        try {
            await this.backoff.run(this._connect, this, [onConnectCallback, this.referenceIds[this.referenceIds.length - 1]], true);
        } catch (e) {
            logger.error(`Exception caught while retrying to connect: ${e && e.message}`, e);
            if (this.handlers.onReconnectFail && typeof this.handlers.onReconnectFail === "function") {
                this.handlers.onReconnectFail(e);
            }
        }
    }

    async reConnect(reCheckNetworkConnectivity = false) {
        try {
            this.backoff.reset();

            if (reCheckNetworkConnectivity && RealtimeApi.networkConnectivityDispatcher) {
                logger.info('Rechecking network connectivity');
                RealtimeApi.isOffline = true;
                RealtimeApi.networkConnectivityDispatcher.forceCheckNetworkConnectivity();
            }

            if (!RealtimeApi.isOffline) {
                await this.oauth2.refreshAuthToken();

                this.referenceIds.push(uuid());
                this.connect(this.onConnectCallback).then(() => {
                    if (this.requestStarted) {
                        this.startRequest();
                    }
                });
            } else {
                let maxReconnectionAttempts = 900;
                let reconnectionIntervalRef = setInterval(() => {
                    if (!RealtimeApi.isOffline) {
                        clearInterval(reconnectionIntervalRef);
                        this.reConnect();
                    } else if (maxReconnectionAttempts > 0) {
                        maxReconnectionAttempts -= 1;
                    } else {
                        clearInterval(reconnectionIntervalRef);
                        const errorMessage = `Max attempts to reconnect exceeded! Not attempting reconnection`;
                        logger.error(errorMessage);
                        if (this.handlers.onReconnectFail && typeof this.handlers.onReconnectFail === "function") {
                            this.handlers.onReconnectFail(new Error(errorMessage));
                        }
                    }
                }, 2000);
            }
        } catch (e) {
            logger.error(`Exception caught while reconnecting: ${e && e.message}`, e);
        }
    }

    onForceClose (referenceId) {
        this.webSocketStatus = webSocketConnectionStatus.closed;
        logger.info(`Force closed WebSocket due to network issues -- Attempting to reconnect`);

        if (this.options.reconnectOnError) {
            if (this.referenceIds.includes(referenceId)) {
                logger.debug("Attempting reconnect after error.");
                this.referenceIds.splice(this.referenceIds.indexOf(referenceId), 1);

                this.reConnect(true);
            } else {
                logger.debug(`Reconnection already handled for socket with connectionId: ${this.id}`);
            }
        } else {
            logger.debug(`Reconnection not enabled for socket with connectionId: ${this.id}`);
        }
    }

    onCloseWebSocket (referenceId) {
        return (event) => {
            this.webSocketStatus = webSocketConnectionStatus.closed;
            logger.info(`WebSocket connection closed`, event);

            if (this.options.reconnectOnError && (event.wasClean === false || event.code === 1005 || event.code === 3006)) {
                if (this.referenceIds.includes(referenceId)) {
                    logger.debug("Attempting reconnect after error.");
                    this.referenceIds.splice(this.referenceIds.indexOf(referenceId), 1);

                    this.reConnect(event.handshakeFailed);
                } else {
                    logger.debug(`Reconnection already handled for socket with connectionId: ${this.id}`);
                }
            } else {
                logger.debug("WebSocket Closed.");

                if (this.handlers && this.handlers.onClose) {
                    setImmediate(() => {

                        this.handlers.onClose(event);

                    });
                }
            }
        }
    }

    onConnectWebSocket () {

        logger.debug("WebSocket Connected.");
        this.webSocketStatus = webSocketConnectionStatus.connected;

        if (this.onConnectCallback) {
            logger.debug(`Invoking this.onConnectCallback`, typeof this.onConnectCallback);
            if (typeof this.onConnectCallback === 'function') {
                this.onConnectCallback(null);
                this.onConnectCallback = null;
            } else {
                logger.warn("onConnectCallback is not a function");
            }
        }
    }

    _connect (onConnectCallback, referenceId) {

        return new Promise((resolve) => {
            if (this.webSocketStatus !== webSocketConnectionStatus.connected) {
                logger.debug("WebSocket Connecting.");
                if (this.webSocketStatus !== webSocketConnectionStatus.connecting) {
                    this.webSocketStatus = webSocketConnectionStatus.connecting;
                }

                if (onConnectCallback)
                    this.onConnectCallback = onConnectCallback;

                this.webSocket = new WebSocket({
                    "accessToken": this.oauth2.activeToken,
                    "onClose": this.onCloseWebSocket(referenceId),
                    "onConnect": this.onConnectWebSocket,
                    "onError": this.onErrorWebSocket,
                    "onMessage": this.onMessageWebSocket,
                    "url": this.webSocketUrl,
                    "onConnectSuccess": resolve,
                    "onForceClose": this.onForceClose,
                    "reconnectOnError": this.options.reconnectOnError,
                    referenceId
                });
            } else if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                resolve();
            }
        });

    }

    onStartedListening(message) {
        if (!this.usePreviousGenerationResponses) {
            if (this.requestStartedResolve) {
                this.requestStartedResolve();
                this.requestStartedResolve = null;
            }
        } else {
            logger.info(`Using the older version of 'createStream' - 'startRealtimeRequest'. 'startRealtimeRequest' will be deprecated in the future in favor of new function 'createStream' that provides lower latencies in processing events.`);
        }

        if (this.handlers.onStartedListening) {

            setImmediate(() => {

                this.handlers.onStartedListening(message);

            });

        }
    }

    onRequestStart (message) {
        if (this.usePreviousGenerationResponses) {
            if (this.requestStartedResolve) {
                this.conversationIdSuccess(message.data && message.data.conversationId);

                this.requestStartedResolve(message.data && message.data.conversationId);
                this.requestStartedResolve = null;
            }
        } else {
            const conversationId = message.data && message.data.conversationId;
            if (conversationId) {
                this.conversationIdSuccess(conversationId);
            }
        }

        if (this.handlers.onRequestStart) {

            setImmediate(() => {

                this.handlers.onRequestStart(message);

            });

        }
    }

    onRequestStop (conversationData) {
        if (this.usePreviousGenerationResponses) {
            if (this.requestStoppedResolve && conversationData) {
                this.requestStoppedResolve(conversationData);
                this.requestStoppedResolve = null;
            }
        } else {
            if (this.requestStoppedResolve) {
                this.requestStoppedResolve();
                this.requestStoppedResolve = null;
            }
        }

        if (this.options.disconnectOnStopRequest !== false) {
            this.webSocket.disconnect();
        }

        if (this.handlers.onRequestStop) {

            setImmediate(() => {

                this.handlers.onRequestStop(conversationData);

            });

        }

    }

    onRequestError (err) {

        if (this.requestErrorReject) {

            this.requestErrorReject(err);
            this.requestErrorReject = null;

        }

        if (this.handlers.onRequestError) {

            setImmediate(() => {

                this.handlers.onRequestError(err);

            });

        }

    }

    sendStart (resolve, reject) {

        const {
            insightTypes,
            config,
            speaker,
            trackers,
            customVocabulary,
            disconnectOnStopRequest,
            disconnectOnStopRequestTimeout,
            noConnectionTimeout
        } = this.options;
        if (config) {
            if (!config.speechRecognition) {
                const speechRecognition = {};
                if (!config.sampleRateHertz) {

                    throw new Error("sampleRateHertz must be provided.");

                } else if (typeof config.sampleRateHertz !== "number") {

                    throw new Error("sampleRateHertz must be a valid number");

                }
                Object.keys(config).forEach((key) => {

                    switch (key) {

                    case "engine":
                    case "encoding":
                    case "sampleRateHertz":
                    case "interimResults":
                        speechRecognition[key] = config[key];
                        delete config[key];
                        break;
                    default:
                        break;
                    }
                });

                if (Object.keys(speechRecognition).length > 0) {
                    config.speechRecognition = speechRecognition;
                }
            }

        }
        logger.debug("Send start request.");
        this.requestStartedResolve = resolve;
        this.onRequestError = reject;
        let configObj = {
            "type": "start_request",
            "insightTypes": insightTypes || [],
            config,
            speaker,
            trackers,
            customVocabulary
        };
        if (disconnectOnStopRequest !== undefined && disconnectOnStopRequestTimeout !== undefined) {
            configObj.disconnectOnStopRequest = disconnectOnStopRequest;
            configObj.disconnectOnStopRequestTimeout = disconnectOnStopRequestTimeout;
        }
        if (noConnectionTimeout !== undefined) {
            configObj.noConnectionTimeout = noConnectionTimeout;
        }
        this.webSocket.send(JSON.stringify(configObj));

    }

    startRequest () {

        return new Promise((resolve, reject) => {
            this.backoff.reset();
            if (this.webSocketStatus === webSocketConnectionStatus.connected) {

                this.sendStart(
                    resolve,
                    reject
                );

            } else {

                logger.info(
                    "WebSocket is connecting. Retry will be attempted.",
                    this.webSocketStatus
                );

                const retry = async () => {
                    if (!this.requestStarted) {

                        logger.info(
                            "Retry attempt: ",
                            this.retryCount
                        );
                        if (this.webSocketStatus ===
                            webSocketConnectionStatus.connected) {

                            this.sendStart(
                                resolve,
                                reject
                            );

                        } else {
                            try {
                                this.backoff.run(retry.bind(this), this);
                            } catch (e) {
                                reject('Too many retries attempted. Try again later.');
                            }

                        }

                    }

                    this.retryCount += 1;

                };

                try {
                    setTimeout(async () => {
                        await retry();
                        await this.backoff.run(retry.bind(this), this);
                    }, 500);
                } catch (e) {
                    reject('Too many retries attempted. Try again later.');
                }

            }

        });

    }

    stopRequest () {
        return new Promise((resolve, reject) => {
            if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                if (!this.requestStarted) {
                    logger.warn(`Invoked stopRequest() on an idle stream for id: ${this.id}`);
                    resolve();

                    return;
                }

                logger.debug("Send stop request.");

                this.requestStoppedResolve = resolve;
                this.onRequestError = reject;
                this.webSocket.send(JSON.stringify({
                    "type": "stop_request"
                }));

            } else {
                // eslint-disable-next-line max-len
                logger.warn("WebSocket connection is not connected. No stop request sent.");
                resolve();
            }

            if (this.options.disconnectOnStopRequest === false) {
                this._cleanForReconnect();
            }
        });

    }

    _cleanForReconnect() {
        this.requestStarted = false;
    }

    sendAudio (data) {
        this.requestStarted && this.webSocket.send(data);
    }

    onSpeechDetected (data) {

        if (this.handlers.onSpeechDetected) {

            setImmediate(() => {

                this.handlers.onSpeechDetected(data);

            });

        }

    }

    onDataReceived (data) {

        if (this.handlers.onDataReceived) {

            setImmediate(() => {

                this.handlers.onDataReceived(data);

            });

        }

    }

    onMessageResponse (messages) {

        if (this.handlers.onMessageResponse) {

            setImmediate(() => {

                this.handlers.onMessageResponse(messages);

            });

        }

    }

    onInsightResponse (messages) {

        if (this.handlers.onInsightResponse) {

            setImmediate(() => {

                this.handlers.onInsightResponse(messages);

            });

        }

    }

    onTrackerResponse (trackers) {

        if (this.handlers.onTrackerResponse) {

            setImmediate(() => {

                this.handlers.onTrackerResponse(trackers);

            });

        }

    }

    onTopicResponse (topics) {

        if (this.handlers.onTopicResponse) {

            setImmediate(() => {

                this.handlers.onTopicResponse(topics);

            });

        }

    }

}
