import {EndpointConnectRequest, ConnectionToEndpointApi} from '@symblai/api-client';
import ErrorHandler from './ErrorHandler';
import Connection, {status} from '../connection/Connection';
import Cache from '../cache/Cache';
import {ApiClient} from "@symblai/api-client/src/index";
import config from '../config';
import logger from "../logger/Logger";

export default class EndpointApi {

    static validateActions(actions) {
        if (actions && Array.isArray(actions)) {
            const invalidActions = actions.filter(action => !action.invokeOn || !action.name);
            if (invalidActions.length > 0) {
                throw new Error(JSON.stringify({
                    message: `Invalid actions detected. Count: ${invalidActions.length}`,
                    invalidActions
                }, null, 2));
            }
        } else {
            throw new Error('actions should be an array.');
        }
    }

    constructor(options = {}, apiClient) {
        if (!apiClient) {
            this.apiClient = new ApiClient();
            this.apiClient.basePath = options.basePath || config.basePath;
        } else {
            this.apiClient = apiClient;
        }
        this.connectionToEndpointApi = new ConnectionToEndpointApi(this.apiClient);
        this.cache = new Cache();
    }

    startEndpoint(config) {
        if (!config) {
            throw new Error('endpoint configuration is required.');
        }

        const {endpoint, actions, intents, data, validationToken, endpointWebhookUrl, headers, pushSpeakerEvents, languages} = config;

        if (!endpoint.type) {
            throw new Error('endpoint type is required.');
        }

        if (endpoint.type.toLowerCase() === 'pstn') {
            if (!endpoint.phoneNumber) {
                throw new Error(`phoneNumber is required when type = 'pstn'.`);
            }

        } else if (endpoint.type.toLowerCase() === 'sip') {
            if (!endpoint.uri) {
                throw new Error(`uri is required when type = 'sip'.`);
            }
            if(!endpoint.providerName)
                endpoint.providerName = 'AnyMeeting';
            if(!endpoint.transportConfig)
                endpoint.transportConfig = `transport=UDP;providerName=${endpoint.providerName};audioTransport=RTP`;
        } else {
            throw new Error(`endpoint.type = '${endpoint.type}' is not valid. Supported types are ['pstn' , 'sip']`);
        }

        return new Promise((resolve, reject) => {
            this.connectToEndpoint('start', endpoint, actions, intents, data, null, validationToken, endpointWebhookUrl, headers, languages)
                .then((_data) => {
                    const {connectionId, resultWebSocketUrl, eventUrl, conversationId} = _data;
                    if (connectionId) {
                        const connection = new Connection({
                            connectionId: connectionId,
                            webSocketUrl: resultWebSocketUrl,
                            conversationId: conversationId,
                            eventUrl: eventUrl,
                            apiClient: this.apiClient,
                            status: status.active,
                            pushSpeakerEvents: pushSpeakerEvents
                        });
                        this.cache.set(connectionId, connection);
                        resolve(connection);
                    } else {
                        reject({
                            message: 'No connectionId detected in successful response.'
                        });
                    }
                }).catch((err) => {
                reject(ErrorHandler.getError(err));
            });
        });
    }

    stopEndpoint(config) {
        if (!config) {
            throw new Error('endpoint configuration is required.');
        }
        const {endpoint, actions, data, connectionId} = config;

        return new Promise((resolve, reject) => {
            this.connectToEndpoint('stop', endpoint, actions, null, data, connectionId)
                .then((_data) => {
                    const {connectionId, summaryInfo, conversationId} = _data;
                    if (connectionId) {
                        if (this.cache.contains(connectionId)) {
                            const connection = this.cache.get(connectionId);
                            connection.summaryInfo = summaryInfo;
                            connection.conversationId = conversationId;
                            connection.status = status.closed;
                            resolve(connection);
                        } else {
                            resolve({
                                summaryInfo,
                                conversationId,
                                connectionId
                            });
                        }
                    } else {
                        reject({
                            message: 'No connectionId detected in successful response.'
                        });
                    }
                }).catch((err) => {
                    reject(err);
            });
        });
    }

    connectToEndpoint(operation, endpoint, actions, intents, data, connectionId, validationToken, endpointWebhookUrl, headers, languages) {
        if (!operation) {
            throw new Error('operation is required.');
        }

        if (actions) {
            EndpointApi.validateActions(actions)
        }

        let request;
        if(connectionId) {
            request = {
                connectionId,
                operation,
                endpoint,
                validationToken,
                actions,
                data
            };
        } else {
            request = {
                operation,
                endpoint,
                actions,
                validationToken,
                endpointWebhookUrl,
                intents,
                headers,
                data,
                languages
            }
        }

        const endpointConnectRequest = EndpointConnectRequest.constructFromObject(request);
        return new Promise((resolve, reject) => {
            try {
                this.connectionToEndpointApi.connectToEndpoint(endpointConnectRequest, (error, data, response) => {
                    if (error) {
                        reject(ErrorHandler.getError(error));
                    } else if (data) {
                        resolve(data);
                    } else {
                        reject(ErrorHandler.getError());
                    }
                });
            } catch (e) {
                logger.trace(e);
            }
        })
    }


}
