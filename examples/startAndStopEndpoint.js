const {sdk, SpeakerEvent} = require('../build/app.bundle');

const getScheduleEvent = (sdk, connectionId) => {
    return (eventType, user, time) => {
        setTimeout(() => {
            const speakerEvent = new SpeakerEvent({
                type: eventType,
                user
            });
            speakerEvent.timestamp = new Date().toISOString();

            console.log(`Pushing event [${speakerEvent.timestamp}] ${speakerEvent.type} : ${speakerEvent.user.name}`);

            sdk.pushEventOnConnection(connectionId, speakerEvent.toJSON(), (err) => {
                if (err) {
                    console.error('Error during push event.', err);
                } else {
                    console.log('Event pushed!');
                }
            });
        }, time * 1000);
    };
};


const users = {
    "john": {
        userId: 'john@example.com',
        name: 'John'
    },
    "mary": {
        userId: 'mary@example.com',
        name: 'Mary'
    },
    "tim": {
        userId: 'tim@example.com',
        name: 'Tim'
    },
    "jennifer": {
        userId: 'jennifer@example.com',
        name: 'Jennifer'
    }
};

sdk.init({
    appId: '__appId__',
    appSecret: '____appSecret__',
    basePath: 'https://somedomain.rammer.ai'
}).then(() => {
    sdk.startEndpoint({
        endpoint: {
            // providerName: 'GlobalMeet',
            type: 'sip',
            uri: 'sip:124@domain.com'
        },
        actions: [{
            "invokeOn": "stop",
            "name": "sendSummaryEmail",
            "parameters": {
                "emails": [
                    "john@rammer.ai"
                ]
            }
        }],
        data: {
            session: {
                name: 'Ship-wide nanomachines, to the center.'
            }
        }
    }).then(connection => {
        const connectionId = connection.connectionId;
        console.log('Successfully connected.', connectionId);

        const scheduleEvent = getScheduleEvent(sdk, connectionId);

        setTimeout(() => {

            // This is just for interactive purposes to show the elapsed time.

            scheduleEvent(SpeakerEvent.types.startedSpeaking, users.john, 0);
            scheduleEvent(SpeakerEvent.types.stoppedSpeaking, users.john, 4);

            scheduleEvent(SpeakerEvent.types.startedSpeaking, users.mary, 4);
            scheduleEvent(SpeakerEvent.types.stoppedSpeaking, users.mary, 9);

            // Scheduling stop endpoint call after 60 seconds
            setTimeout(() => {
                console.log('stopping connection ' + connection.connectionId);
                sdk.stopEndpoint({
                    connectionId
                }).then(() => {
                    console.log('Stopped the connection');
                }).catch(err => console.error('Error while stopping the connection.', err));
            }, 10000);
        }, 1000);

    }).catch(err => console.error('Error while starting the connection', err));

}).catch(err => console.error('Error in SDK initialization.', err));