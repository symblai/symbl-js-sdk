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
    constructor (options = {}, oauth2) {

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

        this.connect = this.connect.bind(this);
        this.onConnectWebSocket = this.onConnectWebSocket.bind(this);
        this.onErrorWebSocket = this.onErrorWebSocket.bind(this);
        this.onMessageWebSocket = this.onMessageWebSocket.bind(this);
        this.onCloseWebSocket = this.onCloseWebSocket.bind(this);

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

        this.oauth2 = oauth2;
        this.handlers = this.options.handlers || {};

        this.retryCount = 0;
        this.requestStarted = false;

    }

    onErrorWebSocket (err) {

        this.webSocketStatus = webSocketConnectionStatus.error;
        logger.error(err);

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
                    this.onRequestStart(data.message);
                    break;
                case "recognition_result":
                    this.onSpeechDetected(data.message);
                    break;
                case "recognition_stopped":

                    /*
                     * console.log('Recognition stopped received');
                     * this.onRequestStop();
                     */

                    break;
                case "conversation_completed":
                    this.onRequestStop(data.message);
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
                    this.onTrackerResponse(data.trackers);
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

    onCloseWebSocket () {

        logger.debug("WebSocket Closed.");
        this.webSocketStatus = webSocketConnectionStatus.closed;

    }

    onConnectWebSocket () {

        logger.debug("WebSocket Connected.");
        this.webSocketStatus = webSocketConnectionStatus.connected;

    }

    connect () {

        logger.debug("WebSocket Connecting.");
        this.webSocketStatus = webSocketConnectionStatus.connecting;
        this.webSocket = new WebSocket({
            "accessToken": this.oauth2.activeToken,
            "onClose": this.onCloseWebSocket,
            "onConnect": this.onConnectWebSocket,
            "onError": this.onErrorWebSocket,
            "onMessage": this.onMessageWebSocket,
            "url": this.webSocketUrl
        });

    }

    onRequestStart (message) {

        if (this.requestStartedResolve) {

            this.requestStartedResolve(message.data &&
                message.data.conversationId);
            this.requestStartedResolve = null;

        }

    }

    onRequestStop (conversationData) {

        if (this.requestStoppedResolve) {

            this.requestStoppedResolve(conversationData);
            this.requestStoppedResolve = null;

        }
        if (this.disconnectOnStopRequest !== false) {
            this.webSocket.disconnect();
        }

    }

    onRequestError (err) {

        if (this.requestErrorReject) {

            this.requestErrorReject(err);
            this.requestErrorReject = null;

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
        this.requestStarted = true;
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
                const retry = () => {

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

                            this.backoff.run(retry.bind(this));

                        }

                    }

                    this.retryCount += 1;

                };

                this.backoff.run(retry.bind(this));

            }

        });

    }

    stopRequest () {

        return new Promise((resolve, reject) => {

            if (this.webSocketStatus === webSocketConnectionStatus.connected) {

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

        });

    }

    sendAudio (data) {

        this.webSocket.send(data);

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
