const {sdk} = require('../build/app.bundle');

const mic = require('mic');

const micInstance = mic({
    rate: '16000',
    channels: '1',
    debug: false,
    exitOnSilence: 6
});

const micInputStream = micInstance.getAudioStream();

const users = {
    "john": {
        userId: 'toshish@rammer.ai',
        name: 'John'
    },
    "mary": {
        userId: 'mary@example.com',
        name: 'Mary'
    }
};

const realtimeSessionId = '1234';
sdk.init({
    appId: '71326970356130406d707a6965382e3370',
    appSecret: 'db96e5501ed04ebfa616d885f51e2dad61b829a9f6484741b1ebd8ab9157b8e0',
    basePath: 'https://oob-prod.rammer.ai',
    logLevel: 'debug'
}).then(() => {
    console.log('SDK Initialized.');

    const sendAudioArray = [];

    Object.values(users).forEach((user) => {
        sdk.startRealtimeRequest({
            id: realtimeSessionId,
            insightTypes: ["action_item"],
            config: {
                confidenceThreshold: 0.5,
                timezoneOffset: 480,
                languageCode: "en-US",
            },
            speaker: user,
            handlers: {
                'onSpeechDetected': (data) => {
                    console.log(user.name, 'onSpeechDetected', JSON.stringify(data));
                },
                'onMessageResponse': (data) => {
                    console.log(user.name, 'onMessageResponse', JSON.stringify(data));
                },
                'onInsightResponse': (data) => {
                    console.log(user.name, 'onInsightResponse', JSON.stringify(data));
                }
            }
        }).then(connection => {
            console.log('Connection Started for speaker: ', user);
            sendAudioArray.push(connection.sendAudio);
            setTimeout(() => {
                micInstance.stop();
                connection.stop().then(() => {
                    console.log('Connection stopped for speaker:', user);
                }).catch(console.error);
            }, 30 * 1000);
        }).catch(console.error);
    });

    micInputStream.on('data', (data) => {
        sendAudioArray.forEach(sendAudio => sendAudio(data));
    });


    micInstance.start();

}).catch(err => console.error('Error in initialization.', err));


