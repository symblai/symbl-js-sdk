/* eslint-disable sort-keys */
/* eslint-disable max-len */
import IEBackoff from "./InverseExpBackoff";
import WebSocket from "../websocket/WebSocket";
import config from "../config";
import logger from "../logger/Logger";
import {
    v4 as uuid
} from "uuid";

const webSocketConnectionStatus = {
    "notAvailable": "not_available",
    "notConnected": "not_connected",
    "connected": "connected",
    "error": "error",
    "closed": "closed",
    "connecting": "connecting"
};

export default class SessionApi {

    oauth2: OAuth2Object;

    id: string;

    connectionOptions: {
        handlers: any,
        reconnectOnError: boolean;
    }

    webSocketUrl: string;

    options: SessionOptions;

    webSocket: WebSocket;

    webSocketStatus: string;

    backoff: IEBackoff;

    onMessage: (arg?: any) => void;

    referenceIds: any[];

    static isOffline = false;

    constructor (options: SessionOptions, oauth2: OAuth2Object) {

        this.connectionOptions = options.options;
        const onMessage = this.connectionOptions.handlers.onMessage;
        const {isStreaming} = options;

        if (!onMessage || typeof onMessage !== "function") {

            throw new Error("onMessage function is required for establishing connection with Session-Manger Websocket.");

        }

        let basePath = options.basePath || config.basePath;

        basePath = basePath.replace(
            /^http/u,
            "ws"
        );

        let session = "session";
        if (isStreaming) {

            session = "v1";

        }

        const uri = `${basePath}/${session}/subscribe`;

        if (!oauth2) {

            throw new Error("oauth2 is required for Session-Manager API.");

        }

        const {id} = options;

        if (!id) {

            throw new Error("id is required for establishing connection.");

        }

        this.backoff = new IEBackoff();

        this.oauth2 = oauth2;
        this.id = id;
        this.onMessage = onMessage;
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
        this.disconnect = this.disconnect.bind(this);
        this.onForceClose = this.onForceClose.bind(this);
    }

    async reConnect() {
        try {
            await this.oauth2.refreshAuthToken();
            this.backoff.reset();

            if (!SessionApi.isOffline) {
                this.referenceIds.push(uuid());
                this.connect();
            } else {
                let maxReconnectionAttempts = 900;
                const reconnectionIntervalRef = setInterval(() => {
                    if (!SessionApi.isOffline) {
                        clearInterval(reconnectionIntervalRef);
                        this.reConnect();
                    } else if (maxReconnectionAttempts > 0) {
                        maxReconnectionAttempts -= 1;
                    } else {
                        clearInterval(reconnectionIntervalRef);
                        const errorMessage = `Max attempts to reconnect exceeded! Not attempting reconnection`;
                        logger.error(errorMessage);
                        if (this.connectionOptions.handlers.onReconnectFail && typeof this.connectionOptions.handlers.onReconnectFail === "function") {
                            this.connectionOptions.handlers.onReconnectFail(new Error(errorMessage));
                        }
                    }
                }, 2000);
            }
        } catch (e) {
            logger.error(`Exception caught while reconnecting: ${e && e.message}`, e);
        }
    }

    onForceClose (referenceId): void {
        this.webSocketStatus = webSocketConnectionStatus.closed;
        logger.info(`Force closed WebSocket due to network issues -- Attempting to reconnect`);

        if (this.connectionOptions.reconnectOnError) {
            if (this.referenceIds.includes(referenceId)) {
                logger.debug("Attempting reconnect after error.");
                this.referenceIds.splice(this.referenceIds.indexOf(referenceId), 1);

                this.reConnect();
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
            console.info(`WebSocket connection closed`, event);

            if (this.connectionOptions.reconnectOnError && (event.wasClean === false || event.code === 1005 || event.code === 3006)) {
                if (this.referenceIds.includes(referenceId)) {
                    logger.debug("Attempting reconnect after error.");
                    this.referenceIds.splice(this.referenceIds.indexOf(referenceId), 1);

                    this.reConnect();
                } else {
                    logger.debug(`Reconnection already handled for socket with connectionId: ${this.id}`);
                }
            } else {
                logger.debug(
                    new Date().toISOString(),
                    "WebSocket Closed."
                );

                if (this.connectionOptions.handlers.onClose && typeof this.connectionOptions.handlers.onClose === "function") {
                    this.connectionOptions.handlers.onClose();
                }
            }
        }
    }

    onConnectWebSocket (): void {

        logger.debug("WebSocket Connected.");
        this.webSocketStatus = webSocketConnectionStatus.connected;

        if (this.connectionOptions.handlers.onSubscribe && typeof this.connectionOptions.handlers.onSubscribe === "function") {
            this.connectionOptions.handlers.onSubscribe();
        }

    }

    onErrorWebSocket (err: string): void {

        this.webSocketStatus = webSocketConnectionStatus.error;
        logger.error(err);

    }

    onMessageWebSocket (result: string): void {

        // Expecting insight data
        if (result) {

            const data = JSON.parse(result);
            logger.debug(
                "Websocket Message: ",
                {data}
            );
            this.onMessage(data);

        }

    }

    _connect (referenceId): Promise<void> {

        return new Promise((resolve, reject) => {
            if (this.webSocketStatus !== webSocketConnectionStatus.connected) {
                logger.debug(`WebSocket Connecting on: ${this.webSocketUrl}`);
                if (this.webSocketStatus !== webSocketConnectionStatus.connecting) {
                    this.webSocketStatus = webSocketConnectionStatus.connecting;
                }
                this.webSocket = new WebSocket({
                    "url": this.webSocketUrl,
                    "accessToken": this.oauth2.activeToken,
                    "onError": this.onErrorWebSocket,
                    "onClose": this.onCloseWebSocket(referenceId),
                    "onMessage": this.onMessageWebSocket,
                    "onConnect": this.onConnectWebSocket,
                    "onConnectSuccess": resolve,
                    "onConnectFailure": reject,
                    "onForceClose": this.onForceClose,
                    "reconnectOnError": this.connectionOptions.reconnectOnError,
                    referenceId
                });
            } else if (this.webSocketStatus === webSocketConnectionStatus.connected) {
                resolve();
            }
        });

    }

    async connect () {
        try {
            await this.backoff.run(this._connect, this, [this.referenceIds[this.referenceIds.length - 1]], true);
        } catch (e) {
            logger.error(`Exception caught while retrying to connect: ${e && e.message}`, e);
        }
    }

    disconnect (): void {

        logger.debug("Disconnecting WebSocket Connection");
        this.webSocket.disconnect();

    }

}
