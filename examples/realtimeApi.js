const { sdk } = require('../build/app.bundle');
const { exec } = require('child_process');

const mic = require('mic');

const isMac = require('os').type() == 'Darwin';
const isWindows = require('os').type().indexOf('Windows') > -1;

const APP_ID = "47427768525353535765504f536961616d535a4b6d743556535a665855486f56";
const APP_SECRET = "724e383877443456727551566f7357436c4657734b65724f74553442313837717a5964737747386170444434775250756f306371645679335f34424e33654451";

let audioDevice = 'plughw:1,0'
let audioRate = 16000

if (!isMac && !isWindows) {
   let audioDevices = [];
   audioDevice = "hw:1,0"
   exec('arecord --list-devices | grep card', (err, stdout) => {
        if (err) return console.log(err)
        console.log(stdout);
    })
} 

const micInstance = mic({
    rate: audioRate,
    channels: '0',
    debug: false,
    exitOnSilence: 5
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

const realtimeSessionId = '15263748';
sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET,
    basePath: 'https://api.symbl.ai',
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


