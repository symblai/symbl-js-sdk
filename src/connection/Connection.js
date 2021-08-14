import EventApi from "../event/EventApi";
import logger from "../logger/Logger";

export const status = {
    active: 'active',
    inactive: 'inactive',
    interrupted: 'interrupted',
    closed: 'closed'
};

export default class Connection {

    constructor(options = {}) {
        if (!options.connectionId) {
            throw new Error('connectionId is required');
        }
        this._connectionId = options.connectionId;
        this._webSocketUrl = options.webSocketUrl;
        this._eventUrl = options.eventUrl;
        this._status = options.status || status.inactive;
        this._summaryInfo = options.summaryInfo || null;
        this._conversationId = options.conversationId || null;
        this._subscribers = {};
        this._pushSpeakerEvents = options.pushSpeakerEvents || false;
        try {
            this._eventApi = new EventApi(this, options.apiClient, {pushSpeakerEvents: this._pushSpeakerEvents});
        } catch(e) {
            logger.trace(e);
        }
    }

    get connectionId() {
        return this._connectionId;
    }

    set connectionId(value) {
        this._connectionId = value;
    }

    get webSocketUrl() {
        return this._webSocketUrl;
    }

    set webSocketUrl(value) {
        this._webSocketUrl = value;
    }

    get eventUrl() {
        return this._eventUrl;
    }

    set eventUrl(value) {
        this._eventUrl = value;
    }

    get status() {
        return this._status;
    }

    set status(value) {
        this._status = value;
    }

    get summaryInfo() {
        return this._summaryInfo;
    }

    set summaryInfo(value) {
        this._summaryInfo = value;
    }

    get conversationId() {
        return this._conversationId;
    }

    set conversationId(value) {
        this._conversationId = value;
    }

    get eventApi() {
        return this._eventApi;
    }

    pushEvent(event, cb) {
        this._eventApi.pushEvent(event, cb);
    }

    publish(value) {
        if (value && this._subscribers.length > 0) {
            this._subscribers.keys().forEach(name => this._subscribers[name](value));
        }
    }

    subscribe(name, callback) {
        let _name = name;
        let _callback = callback;
        if (arguments.length === 1) {
            _callback = name;
            _name = 'default';
        }
        if (callback && typeof callback === 'function') {
            this._subscribers[name] = callback;
        }
    }

    unsubscribe(name) {
        if (name) {
            delete this._subscribers[name];
        } else {
            delete this._subscribers['default'];
        }
    }
}
