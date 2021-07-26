import WebSocket from '../websocket/WebSocket';
import logger from "../logger/Logger";
import config from '../config';

const webSocketConnectionStatus = {
    notAvailable: 'not_available',
    notConnected: 'not_connected',
    connected: 'connected',
    error: 'error',
    closed: 'closed',
    connecting: 'connecting'
};

export default class SessionApi {

    constructor(options = {}, oauth2) {
        let callback = options.callback;

        if (!callback || typeof callback !== 'function') {
            throw new Error('callback function is required for establishing connection with Session-Manger Websocket.');
        }

        let basePath = options.basePath || config.basePath;
        if (basePath.startsWith('https')) {
            basePath = basePath.replace('https', 'wss')
        } else if (basePath.startsWith('http')) {
            basePath = basePath.replace('https', 'wss')
        }
        const uri = `${basePath}/session/subscribe`;

        if (!oauth2) {
            throw new Error('oauth2 is required for Session-Manager API.');
        }

        const {id} = options;

        if (!id) {
            throw new Error('id is required for establishing connection.');
        }

        this.oauth2 = oauth2;
        this.id = id;
        this.callback = callback;
        this.webSocketUrl = `${uri}/${this.id}`;
        this.options = options;

        this.connect = this.connect.bind(this);
        this.onConnectWebSocket = this.onConnectWebSocket.bind(this);
        this.onErrorWebSocket = this.onErrorWebSocket.bind(this);
        this.onMessageWebSocket = this.onMessageWebSocket.bind(this);
        this.onCloseWebSocket = this.onCloseWebSocket.bind(this);
        this.disconnect = this.disconnect.bind(this);
    }

    onCloseWebSocket() {
        logger.debug(new Date().toISOString(), 'WebSocket Closed.');
        this.webSocketStatus = webSocketConnectionStatus.closed;
    }

    onConnectWebSocket() {
        logger.debug('WebSocket Connected.');
        this.webSocketStatus = webSocketConnectionStatus.connected;
    }

    onErrorWebSocket(err) {
        this.webSocketStatus = webSocketConnectionStatus.error;
        logger.error(err);
    }

    onMessageWebSocket(result) {
        //Expecting insight data
        if (result) {
            const data = JSON.parse(result);
            logger.debug('Websocket Message: ', {data});
            this.callback(data);
        }
    }

    connect() {
        logger.debug('WebSocket Connecting on: ' + this.webSocketUrl);
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

    disconnect() {
        logger.debug('Disconnecting WebSocket Connection');
        this.webSocket.disconnect();
    }
}
