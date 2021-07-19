import {w3cwebsocket as W3CWebSocket, client as WebSocketClient} from 'websocket';
import isNode from 'detect-node';
import logger from "../logger/Logger";
import ErrorHandler from "../api/ErrorHandler";

export default class WebSocket {

    constructor(options = {}) {
        if (!options.url) {
            throw new Error('url is required in the options.');
        }

        this.isNode = isNode;

        this.url = options.url;
        this.accessToken = options.accessToken;

        this.options = options;

        this.connect = this.connect.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onError = this.onError.bind(this);
        this.onMessage = this.onMessage.bind(this);
        this.onClose = this.onClose.bind(this);

        this.send = this.send.bind(this);
        this.disconnect = this.disconnect.bind(this);

        this.connect();
    }

    onError(err) {
        this.options['onError'] ? this.options['onError'](err) : () => logger.error(err);
    }

    onMessage(payload) {
        // Incoming results for this connection
        if (this.isNode) {
            const data = payload.type === 'utf8' ? payload.utf8Data : payload.binaryData;
            this.options['onMessage'] ? this.options['onMessage'](data) : () => logger.debug(data);
        } else {
            const data = payload.data;
            this.options['onMessage'] ? this.options['onMessage'](data) : () => logger.debug(data);
        }
    }

    onClose() {
        this.options['onClose'] ? this.options['onClose']() : () => logger.info('Connection Closed.');
    }

    onConnect(connection) {
        this.webSocketConnection = connection;
        if (this.isNode) {
            connection.on('error', this.onError);
            connection.on('message', this.onMessage);
            connection.on('close', this.onClose);
        } else {
            this.webSocket.onerror = this.onError;
            this.webSocket.onmessage = this.onMessage;
            this.webSocket.onclose = this.onClose;
        }
        this.options['onConnect'] ? this.options['onConnect'](connection) : logger.info('Connection established.');
    }

    connect() {
        if (this.isNode) {
            this.webSocket = new WebSocketClient();
            this.webSocket.on('connect', this.onConnect);
            this.webSocket.connect(this.url, null, null, {
                'X-API-KEY': this.accessToken
            });
        } else {
            if (!!window && window.WebSocket) {
                const urlWithToken = `${this.url}?access_token=${this.accessToken}`;
                this.webSocket = new window.WebSocket(urlWithToken, null, null, {
                    'X-API-KEY': this.accessToken
                });
            } else {
                this.webSocket = new W3CWebSocket(this.url, null, null, {
                    'X-API-KEY': this.accessToken
                });
            }
            this.webSocket.binaryType = 'arraybuffer';
            // TODO: Support for token in url
            this.webSocket.onopen = this.onConnect;
        }
    }

    send(data, cb) {
        if (!data) {
            cb && cb({
                message: 'undefined data detected.'
            });
        } else {
            if (this.isNode) {
                this.webSocketConnection.send(data, (err) => {
                    if (cb) cb(err ? ErrorHandler.getError(err) : err);
                });
            } else {
                try {
                    if (this.webSocket.readyState === 1) {
                        this.webSocket.send(data);
                    } else {
                        console.warn('WebSocket Connection not open. Couldn\'t send data.');
                    }
                } catch(e) {
                    console.error('Error while sending the data.', e);
                }
            }
        }
    }

    disconnect() {
        if (this.isNode) {
            this.webSocketConnection.close();
        } else {
            this.webSocket.close();
        }
    }

}
