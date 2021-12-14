import {w3cwebsocket as W3CWebSocket} from 'websocket';
import logger from "../logger/Logger";
import ErrorHandler from "../api/ErrorHandler";

export default class WebSocket {
    url: string;
    accessToken: string;
    options: any;
    webSocket: any;
    webSocketConnection: any;

    constructor(options: any = {}) {
        if (!options.url) {
            throw new Error('url is required in the options.');
        }

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

    onError(err): void {
        this.options['onError'] ? this.options['onError'](err) : () => logger.error(err);
    }

    onMessage(payload): void {
        // Incoming results for this connection
        const data = payload.data;
        this.options['onMessage'] ? this.options['onMessage'](data) : () => logger.debug(data);
    }

    onClose(event): void {
        this.options['onClose'] ? this.options['onClose'](event) : () => logger.info('Connection Closed.');
    }

    onConnect(connection: any): void {
        this.webSocketConnection = connection;
        this.webSocket.onerror = this.onError;
        this.webSocket.onmessage = this.onMessage;
        this.webSocket.onclose = this.onClose;

        this.options['onConnect'] ? this.options['onConnect'](connection) : logger.info('Connection established.');
    }

    connect(): void {
        const urlWithToken = `${this.url}?access_token=${this.accessToken}`
        this.webSocket = new W3CWebSocket(urlWithToken, null, null, {
            'X-API-KEY': this.accessToken
        });

        this.webSocket.binaryType = 'arraybuffer';
        // TODO: Support for token in url
        this.webSocket.onopen = this.onConnect;
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
                    console.warn('WebSocket Connection not open. Couldn\'t send data.');
                    // this.onError({});
                }
            } catch(e) {
                console.error('Error while sending the data.', e);
            }
        }
    }

    disconnect(): void {
        this.webSocket.close();
    }

}
