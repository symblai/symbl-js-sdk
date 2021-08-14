export default class StopProcessingEvent {

    static topics() {
        return {
            speaker: 'speaker'
        }
    }

    static types() {
        return {
            stopped: 'stopped'
        }
    }

    constructor(options = {}) {

        if (!options) {
            throw new Error('StopProcessing configuration required');
        }

        this._timestamp = options.timestamp;
        this._topic = options.topic;
        this._type = 'stopped';
    }

    set timestamp(val) {
        this._timestamp = val;
    }

    get timestamp() {
        return this._timestamp;
    }

    set type(val) {
        this._type = val;
    }

    get type() {
        return this._type;
    }

    set topic(val) {
        this._topic = val;
    }

    get topic() {
        return this._topic;
    }

    toJSON() {
        return {
            topic: this._topic,
            type: this._type,
            timestamp: this._timestamp
        }
    }
};