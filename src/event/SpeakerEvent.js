export default class SpeakerEvent {

    static get types () {

        return {
            "startedSpeaking": "started_speaking",
            "stoppedSpeaking": "stopped_speaking",
            "joined": "joined",
            "left": "left"
        };

    }

    constructor (options = {}) {

        if (!options) {

            throw new Error("SpeakerEvent configuration is required.");

        }

        if (!options.type) {

            throw new Error("'type' is required parameter for speaker event");

        }

        if (!options.user) {

            throw new Error("'user' is required parameter for speaker event");

        }

        if (!options.user.userId) {

            throw new Error("'userId' is required parameter in 'user' for speaker event");

        }

        this.topic = "speaker";
        this._type = options.type;
        this._user = options.user;
        this._timestamp = options.timestamp
            ? new Date(options.timestamp).toISOString()
            : options._timestamp
                ? new Date(options._timestamp).toISOString()
                : new Date().toISOString();

    }


    get type () {

        return this._type;

    }

    set type (value) {

        this._type = value;

    }

    get user () {

        return this._user;

    }

    set user (value) {

        this._user = value;

    }

    get timestamp () {

        return this._timestamp;

    }

    set timestamp (value) {

        this._timestamp = value;

    }

    toJSON () {

        return {
            "topic": this.topic,
            "type": this._type,
            "user": this._user,
            "timestamp": this._timestamp
        };

    }

}
