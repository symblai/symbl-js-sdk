import WebSocket from '../websocket/WebSocket';
import logger from "../logger/Logger";
import config from '../config';
import {v4 as uuid} from 'uuid';

const webSocketConnectionStatus = {
    notAvailable: 'not_available',
    notConnected: 'not_connected',
    connected: 'connected',
    error: 'error',
    closed: 'closed',
    connecting: 'connecting'
};

export default class RealtimeApi {

    constructor(options = {}, oauth2) {
        let basePath = options.basePath || config.basePath;
        basePath = basePath.replace(/^http/, 'ws');
        const uri = `${basePath}/v1/realtime/insights`;

        if (!oauth2) {
            throw new Error('oauth2 is required for Real-time API.');
        }

        const {id} = options;

        this.id = id ? id : uuid();

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

    onErrorWebSocket(err) {
        this.webSocketStatus = webSocketConnectionStatus.error;
        logger.error(err);
    }

    onMessageWebSocket(result) {
        // console.log(result);
        // Incoming results for this connection
        if (result) {
            const data = JSON.parse(result);
            if (data.type === 'message') {
                const {message: {type}} = data;

                if (type === 'recognition_started') {
                    this.onRequestStart(data.message);
                } else if (type === 'recognition_result') {
                    this.onSpeechDetected(data.message);
                } else if (type === 'recognition_stopped') {
                    // console.log('Recognition stopped received');
                    // this.onRequestStop();
                } else if (type === 'conversation_completed') {
                    this.onRequestStop(data.message);
                } else if (type === 'error') {
                    this.onRequestError(data);
                }
            } else {
                if (data.type === 'message_response') {
                    this.onMessageResponse(data.messages);
                } else if (data.type === 'insight_response') {
                    this.onInsightResponse(data.insights);
                } else if (data.type === 'tracker_response') {
                    this.onTrackerResponse(data.trackers);
                } else if (data.type === 'topic_response') {
                    this.onTopicResponse(data.topics);
                }
            }
            this.onDataReceived(data);
        }
    }

    onCloseWebSocket() {
        logger.debug('WebSocket Closed.');
        this.webSocketStatus = webSocketConnectionStatus.closed;
    }

    onConnectWebSocket() {
        logger.debug('WebSocket Connected.');
        this.webSocketStatus = webSocketConnectionStatus.connected;
    }

    connect() {
        logger.debug('WebSocket Connecting.');
        this.webSocketStatus = webSocketConnectionStatus.connecting;
        this.webSocket = new WebSocket({
            url: this.webSocketUrl,
            accessToken: this.oauth2.activeToken,
            onError: this.onErrorWebSocket,
            onClose: this.onCloseWebSocket,
            onMessage: this.onMessageWebSocket,
            onConnect: this.onConnectWebSocket
        });
    }

    onRequestStart(message) {
        if (this.requestStartedResolve) {
            this.requestStartedResolve(message.data && message.data.conversationId);
            this.requestStartedResolve = undefined;
        }
    }

    onRequestStop(conversationData) {
        if (this.requestStoppedResolve) {
            this.requestStoppedResolve(conversationData);
            this.requestStoppedResolve = undefined;
        }
        this.webSocket.disconnect();
    }

    onRequestError(err) {
        if (this.requestErrorReject) {
            this.requestErrorReject(err);
            this.requestErrorReject = undefined;
        }
    }

    sendStart(resolve, reject) {
        const {insightTypes, config, speaker, trackers, customVocabulary, } = this.options;
        if (config) {
            const speechRecognition = {};
            if (!config.sampleRateHertz) {
                throw new Error("sampleRateHertz must be provided.")
            } else if (typeof config.sampleRateHertz !== 'number') {
                throw new Error("sampleRateHertz must be a valid number")
            }
            Object.keys(config).forEach(key => {
                switch (key) {
                    case 'engine':
                    case 'encoding':
                    case 'sampleRateHertz':
                    case 'interimResults':
                        speechRecognition[key] = config[key];
                        delete config[key];
                        break;
                    default:
                        break;
                }
            });

            if (Object.keys(speechRecognition).length > 0) {
                config['speechRecognition'] = speechRecognition;
            }
        }
        logger.debug('Send start request.');
        this.requestStartedResolve = resolve;
        this.onRequestError = reject;
        this.requestStarted = true;
        this.webSocket.send(JSON.stringify({
            type: 'start_request',
            insightTypes: insightTypes || [],
            config,
            speaker,
            trackers,
            customVocabulary,
        }));
    }

    startRequest() {
        return new Promise((resolve, reject) => {
            if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                this.sendStart(resolve, reject);
            } else {
                logger.info('WebSocket is connecting. Retry will be attempted.', this.webSocketStatus);
                const retry = () => {
                    if (this.retryCount < 3 && !this.requestStarted) {
                        logger.info('Retry attempt: ', this.retryCount);
                        if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                            this.sendStart(resolve, reject);
                            this.retryCount = 0;
                        } else {
                            this.retryCount++;
                            setTimeout(retry.bind(this), 1000 * this.retryCount);
                        }
                    }
                };
                setTimeout(retry.bind(this), 500);
            }
        });
    }

    stopRequest() {
        return new Promise((resolve, reject) => {
            if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                logger.debug('Send stop request.');
                this.requestStoppedResolve = resolve;
                this.onRequestError = reject;
                this.webSocket.send(JSON.stringify({
                    type: 'stop_request',
                }));
            } else {
                logger.warn('WebSocket connection is not connected. No stop request sent.');
                resolve();
            }
        });
    }

    sendAudio(data) {
        this.webSocket.send(data);
    }

    onSpeechDetected(data) {
        if (this.handlers.onSpeechDetected) {
            setImmediate(() => {
                this.handlers.onSpeechDetected(data);
            });
        }
    }

    onDataReceived(data) {
        if (this.handlers.onDataReceived) {
            setImmediate(() => {
                this.handlers.onDataReceived(data);
            });
        }
    }

    onMessageResponse(messages) {
        if (this.handlers.onMessageResponse) {
            setImmediate(() => {
                this.handlers.onMessageResponse(messages);
            });
        }
    }

    onInsightResponse(messages) {
        if (this.handlers.onInsightResponse) {
            setImmediate(() => {
                this.handlers.onInsightResponse(messages);
            });
        }
    }

    onTrackerResponse(trackers) {
        if (this.handlers.onTrackerResponse) {
            setImmediate(() => {
                this.handlers.onTrackerResponse(trackers);
            });
        }
    }

    onTopicResponse(topics) {
        if (this.handlers.onTopicResponse) {
            setImmediate(() => {
                this.handlers.onTopicResponse(topics);
            });
        }
    }

}
