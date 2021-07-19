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

const insightsCallback = (data) => {
    console.log('Type: ' + data.type); // For insights this will be 'insight_response'
    console.log('Insights:', data.insights);

    //Iterate through insights to get the insight type, text and confidence score
    data.insights.forEach(insight => {
        console.log('Insight Type: ' + insight.type); //can be 'action_item' or 'question'
        console.log('Insight Text: ' + insight.text);
        console.log('Confidence Score: ' + insight.confidence);
        console.log('From:', insight.from); //Contains the details of user(s) who spoke the insight
    });
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
    appSecret: '__appSecret__',
    basePath: 'https://somedomain.rammer.ai'
}).then(() => {
    sdk.startEndpoint({
        endpoint: {
            // providerName: 'GlobalMeet',
            type: 'sip',
            uri: 'sip:124@domain.com'
        },
        validationToken: '5963c0d619a30a2e00de36b8',
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
    }, insightsCallback).then(connection => {
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