import {w3cwebsocket as W3CWebSocket} from 'websocket';
import logger from "../logger/Logger";
import ErrorHandler from "../api/ErrorHandler";

const PING = "__PING__";
const PONG = "__PONG__";
const PONG_TIMEOUT_MS = 4500;
const PING_INTERVAL_MS = 5000;

export default class WebSocket {
    url: string;
    accessToken: string;
    options: any;
    webSocket: any;
    webSocketConnection: any;
    isConnected: boolean;
    pongTimeoutRef: any;
    pingIntervalRef: any;
    logEntries: any[];

    constructor(options: any = {}) {
        if (!options.url) {
            throw new Error('url is required in the options.');
        }

        this.url = options.url;
        this.accessToken = options.accessToken;

        this.options = options;
        this.isConnected = false;
        this.pongTimeoutRef = null;
        this.pingIntervalRef = null;
        this.logEntries = [];

        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onError = this.onError.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);

        this.send = this.send.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.pongTimeout = this.pongTimeout.bind(this);
        this.ping = this.ping.bind(this);

        this.clearPongTimeout = this.clearPongTimeout.bind(this);
        this.clearPingInterval = this.clearPingInterval.bind(this);
        this.logRecurring = this.logRecurring.bind(this);

        this.connect();
    }

    ping(): void {
        if (this.webSocket.readyState === 1) {
            this.send(PING, null);
            this.pongTimeoutRef = setTimeout(() => {
                this.pongTimeout();
            }, PONG_TIMEOUT_MS);
        }
    }

    pongTimeout(): void {
        logger.warn(`PONG failed to receive in ${PONG_TIMEOUT_MS}ms, closing WebSocket connection`);
        this.clearPongTimeout();

        this.options.onForceClose && this.options.onForceClose(this.options.referenceId);

        this.webSocket.close(3006, "Connection closure due to failure in receiving pong within configured threshold");
    }

    clearPongTimeout(): void {
        if (this.pongTimeoutRef) {
            clearTimeout(this.pongTimeoutRef);
        }
    }

    clearPingInterval(): void {
        if (this.pingIntervalRef) {
            clearInterval(this.pingIntervalRef);
        }
    }

    onError(err): void {
        if (!this.isConnected) {
            logger.error(`Failed to establish the initial handshake: ${err && err.message}`, err);
            return;
        }

        this.clearPingInterval();
        this.clearPongTimeout();

        this.options['onError'] ? this.options['onError'](err) : () => logger.error(err);
    }

    onMessage(payload): void {
        // Incoming results for this connection
        const data = payload.data;
        if (data === PONG) {
            this.clearPongTimeout();
            return;
        }

        this.options['onMessage'] ? this.options['onMessage'](data) : () => logger.debug(data);
    }

    onClose(event): void {
        if (!this.isConnected && event && event.code === 1006) {
            event.handshakeFailed = true;
        }

        this.clearPingInterval();
        this.clearPongTimeout();

        this.options['onClose'] ? this.options['onClose'](event) : () => logger.info('Connection Closed.');
    }

    onConnect(connection: any): void {
        this.isConnected = true;
        this.webSocketConnection = connection;

        if (this.options.reconnectOnError) {
            this.pingIntervalRef = setInterval(() => {
                this.ping();
            }, PING_INTERVAL_MS);
        }

        this.options['onConnectSuccess'] ? this.options['onConnectSuccess'](connection) : logger.info('Connection established successfully');
        this.options['onConnect'] ? this.options['onConnect'](connection) : logger.info('Connection established.');
    }

    connect(): void {
        const urlWithToken = `${this.url}?access_token=${this.accessToken}`
        this.webSocket = new W3CWebSocket(urlWithToken, null, null, {
            'X-API-KEY': this.accessToken
        });

        this.webSocket.binaryType = 'arraybuffer';
        // TODO: Support for token in url
        this.webSocket.onerror = this.onError;
        this.webSocket.onmessage = this.onMessage;
        this.webSocket.onclose = this.onClose;
        this.webSocket.onopen = this.onConnect;
    }

    logRecurring (message, severity = "info") {
        if (!this.logEntries[message]) {
            this.logEntries[message] = message;

            switch (severity) {
            case "warn":
                logger.warn(message);
                break;
            case "error":
                logger.error(message);
                break;
            case "debug":
                logger.debug(message);
                break;
            case "info":
            default:
                logger.info(message);
                break;
            }

            setTimeout(() => {
                delete this.logEntries[message];
            }, 5000);
        }
    }

    send(data, cb): void {
        if (!data) {
            cb && cb({
                message: 'undefined data detected.'
            });
        } else {
            try {
                if (this.webSocket.readyState === 1) {
                    this.webSocket.send(data);
                } else {
                    this.logRecurring("WebSocket Connection not open. Couldn't send data.", "warn");
                }
            } catch(e) {
                logger.error('Error while sending the data.', e);
            }
        }
    }

    disconnect(): void {
        this.clearPingInterval();
        this.clearPongTimeout();

        this.webSocket.close(1000);
    }

}
