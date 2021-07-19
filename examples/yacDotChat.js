const { sdk } = require('../build/app.bundle');
const uuid = require('uuid').v4;
const realtimeSessionId = uuid();
const getDuration = require('get-mp3-duration');
const fs = require('fs');
const sampleUser = {
    userId: 'arjun.chouhan@rammer.ai',
    name: 'Arjun'
};
try {
    sdk.init({
        appId: '7945695a764962636d4846594e7a4b4e706f544d514e4a597a4f5044516f6135',
        appSecret: '524649664266642d644866746a3533314a742d456450474d676776766a637054426943634b68447144706f5174314a5a32767a5a55646e755a6d426e61434455',
        basePath: 'https://dev-clone.rammer.ai',
        logLevel: 'debug',
    }).then(() => {
        console.log('init should be successful: ');
        sdk.startRealtimeRequest({
                id: realtimeSessionId,
                insightTypes: ['action_item'],
                config: {
                    encoding: 'MP3', // I dont know what this is of my file, dont know if it is optional or not --tried mp3 , LAME3.100
                    confidenceThreshold: 0.8, // this is fine
                    sampleRateHertz: 48000,
                    timezoneOffset: -330, // I know this is an important param for knowing the context , new Date().getTimezoneOffset()
                    languageCode: 'en-US',
                },
                speaker: sampleUser,
                handlers: {
                    onSpeechDetected: data => {
                        console.log('onSpeechDetected', JSON.stringify(data))
                    },
                    onMessageResponse: data => {
                        console.log('onMessageResponse', JSON.stringify(data))
                    },
                    onInsightResponse: data => {
                        console.log('onInsightResponse', JSON.stringify(data))
                    },
                },
            }).then(async connection => {
            console.log('Connection Started for speaker: ', sampleUser);
            const data = fs.readFileSync('./test.mp3');
            const duration = getDuration(data, 'ms') / 1000;
            const dataLength = data.length;

            const byteRate = Math.ceil(dataLength / duration);

            const chunkDurationMs = 1000;

            const bytesToSlice = Math.floor(byteRate * chunkDurationMs / 1000);

            console.log('Audio Duration (seconds): ', duration);
            let dataIndex = 10;

            const intervalRef = setInterval(() => {
                const dataChunk = data.slice(dataIndex, dataIndex + bytesToSlice + 1);
                console.log(dataChunk.length);
                connection.sendAudio(dataChunk);
                dataIndex += bytesToSlice + 1;
            }, chunkDurationMs);

            setTimeout(() => {
                console.log('Stopping connection now');
                clearInterval(intervalRef);
                connection.stop().then(() => {
                    console.log("Connection stopped successfully");
                }, (err) => {
                    console.error("Error in stopping connection: " + err.message, err);
                });
            }, duration * 1000);

        }).catch(error => {
            console.log('startRealtimeRequest ; ', error)
        })
    }).catch(error => {
        console.log('rammer init error :', error)
    })
} catch (error) {
    console.log('main catch block : ', error)
}
