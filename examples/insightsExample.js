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
    if (data.type === 'insight_response') { // check if the response type is for insights
        //Iterate through insights to get the insight type, text and confidence score
        data.insights.forEach(insight => {
            if (insight.type === 'action_item') {
                console.log('Insight Type: ' + insight.type); //can be 'action_item'
                console.log('Insight Text: ' + insight.text);
                console.log('Confidence Score: ' + insight.confidence);
                console.log('From:', insight.from); //Contains the details of user(s) who spoke the insight
            }
        });
    }
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
    appId: '71326970356130406d707a6965382e3370',
    appSecret: 'db96e5501ed04ebfa616d885f51e2dad61b829a9f6484741b1ebd8ab9157b8e0',
    basePath: 'https://anymeeting-qa.rammer.ai',
    logLevel: 'debug'
}).then(() => {
    sdk.startEndpoint({
        endpoint: {
            type: 'sip',
            uri: 'sip:1_firebird_1367062@am-fs-ca-08.anymeeting.com'
        },
        actions: [{
            "invokeOn": "stop",
            "name": "sendSummaryEmail",
            "parameters": {
                "emails": [
                    "toshish@rammer.ai"
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
            scheduleEvent(SpeakerEvent.types.stoppedSpeaking, users.john, 10);
            //
            // scheduleEvent(SpeakerEvent.types.startedSpeaking, users.mary, 10);
            // scheduleEvent(SpeakerEvent.types.stoppedSpeaking, users.mary, 30);
            //
            // scheduleEvent(SpeakerEvent.types.startedSpeaking, users.jennifer, 30);
            // scheduleEvent(SpeakerEvent.types.stoppedSpeaking, users.jennifer, 50);
            //
            // scheduleEvent(SpeakerEvent.types.startedSpeaking, users.tim, 50);
            // scheduleEvent(SpeakerEvent.types.stoppedSpeaking, users.tim, 60);

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