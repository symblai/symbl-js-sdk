import WebSocket from '../websocket/WebSocket';
import moment from 'moment';
import logger from "../logger/Logger";
import PQueue from "p-queue";

const webSocketConnectionStatus = {
    notAvailable: 'not_available',
    notConnected: 'not_connected',
    isConnecting: 'is_connecting',
    connected: 'connected',
    error: 'error',
    closed: 'closed'
};

export default class EventApi {

    constructor(connection, apiClient, options = {}) {
        if (!connection.webSocketUrl || !connection.eventUrl) {
            throw new Error('At least one of webSocketUrl and eventUrl is required in connection.');
        }

        if (!apiClient) {
            throw new Error('apiClient is required for EventApi');
        }
        this.webSocketUrl = connection.webSocketUrl;
        this.eventUrl = connection.eventUrl;
        this.options = options;

        this.connection = connection;

        this.eventsQueue = new PQueue({concurrency: 1});
        this.eventCount = 0;
        this.eventsQueue.on('active', () => {
            logger.trace(`Working on event #${++this.eventCount}, Size: ${this.eventsQueue.size}, Pending: ${this.eventsQueue.pending}`);
        });

        this.connectWebSocket = this.connectWebSocket.bind(this);
        this.onConnectWebSocket = this.onConnectWebSocket.bind(this);
        this.onErrorWebSocket = this.onErrorWebSocket.bind(this);
        this.onMessageWebSocket = this.onMessageWebSocket.bind(this);
        this.onCloseWebSocket = this.onCloseWebSocket.bind(this);
        this.publishResults = this.publishResults.bind(this);

        this.apiClient = apiClient;
        this.maxWaitTimeForWebSocketConnectionEstablishmentInSeconds = 60;
        this.webSocketConnectionEstablishmentPollInterval = 250;

        if (this.webSocketUrl) {
            this.webSocketStatus = webSocketConnectionStatus.notConnected;
            this.options.pushSpeakerEvents && this.connectWebSocket(this.webSocketUrl);
        } else if (this.eventUrl) {
            this.webSocketStatus = webSocketConnectionStatus.notAvailable;
            // TODO: REST client for webhook
        }
    }

    onErrorWebSocket(err) {
        this.webSocketStatus = webSocketConnectionStatus.error;

        logger.error(err);
        // TODO: Switch to WebHook mode while connection recovers

    }

    static getWebSocketConnectionStatuses() {
        return webSocketConnectionStatus;
    }

    onMessageWebSocket(result) {
        // Incoming results for this connection
        this.publishResults(result);
    }

    onCloseWebSocket() {
        this.webSocketStatus = webSocketConnectionStatus.closed;
    }

    onConnectWebSocket() {
        this.webSocketStatus = webSocketConnectionStatus.connected;
    }

    connectWebSocket(webSocketUrl) {
        this.webSocketStatus = webSocketConnectionStatus.isConnecting;
        logger.trace(`Establishing Events WebSocket Connection`);
        this.webSocket = new WebSocket({
            url: webSocketUrl,
            accessToken: this.apiClient.authentications.jwt.apiKey,
            onError: this.onErrorWebSocket,
            onClose: this.onCloseWebSocket,
            onMessage: this.onMessageWebSocket,
            onConnect: this.onConnectWebSocket
        });
    }

    async enqueueEvent(event) {
        if(!event.timestamp) {
            event.timestamp = moment().toISOString();
        }
        await this.eventsQueue.add(() => this.sendEvent(event));
    }

    sendEvent(event) {
        if (this.webSocketStatus === webSocketConnectionStatus.notConnected || this.webSocketStatus === webSocketConnectionStatus.isConnecting) {
            return new Promise((resolve, reject) => {
                let maxWaitCount = this.maxWaitTimeForWebSocketConnectionEstablishmentInSeconds * 1000 / this.webSocketConnectionEstablishmentPollInterval;
                let intervalReference = setInterval(() => {
                    if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                        clearInterval(intervalReference);
                        intervalReference = null;
                        const eventToSend = JSON.stringify(event);
                        logger.trace(`Sending event on Events WebSocket after WebSocket connection status changed to ${webSocketConnectionStatus.connected}`, eventToSend);
                        this.webSocket.send(eventToSend);
                        resolve();
                    }

                    if (maxWaitCount <= 0) {
                        const errorMessage = `Events WebSocket connection was in ${this.webSocketStatus} state after ${this.maxWaitTimeForWebSocketConnectionEstablishmentInSeconds} seconds.`;
                        clearInterval(intervalReference);
                        logger.error(errorMessage);
                        reject(errorMessage);
                    }

                    --maxWaitCount;
                }, this.webSocketConnectionEstablishmentPollInterval);
            });
        } else if (this.webSocketStatus === webSocketConnectionStatus.connected) {
            const eventToSend = JSON.stringify(event);
            logger.trace('Sending event on Events WebSocket connection', eventToSend);
            this.webSocket.send(eventToSend);
            return Promise.resolve();
        } else if (this.webSocketStatus === webSocketConnectionStatus.error) {
            const errorMessage = 'Cannot send events as WebSocket connection was closed with error';
            logger.error(errorMessage);
            return Promise.reject(errorMessage);
        } else {
            const errorMessage = 'Cannot send events as WebSocket connection was already closed or not established';
            logger.error(errorMessage);
            return Promise.reject(errorMessage);
        }
    }

    pushEvent(event, cb) {
        if (this.webSocketStatus === webSocketConnectionStatus.notConnected) {
            this.connectWebSocket(this.webSocketUrl);
        }

        if (this.webSocketStatus === webSocketConnectionStatus.connected ||
            this.webSocketStatus === webSocketConnectionStatus.isConnecting ||
            this.webSocketStatus === webSocketConnectionStatus.notConnected) {
            // TODO: Handle when data is not getting flushed to socket or error has occurred
            this.enqueueEvent(event);
        } else if (this.webSocketStatus === webSocketConnectionStatus.notAvailable ||
                    this.webSocketStatus === webSocketConnectionStatus.error) {
            // TODO: push on event WebHook

        } else {
            if (cb) {
                cb({
                    message: 'Connection is already closed.'
                });
            }
        }
    }

    publishResults(result) {
        this.connection.publish(result);
    }
}
