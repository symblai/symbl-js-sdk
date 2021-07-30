## Streaming API Examples

### `streamingLiveMic.js`
* Requires the `mic` and `uuid` packages to be installed from NPM `npm install mic uuid`.

* Captures live microphone audio data by passing the data streaming from the `mic` instance into the Symbl API websocket connection.
```js
    // Creating the mic instance
    const micInstance = mic({
        rate: sampleRateHertz,
        channels: '1',
        debug: false,
        exitOnSilence: 6,
    });

    // Capturing the raw audio stream from the microphone
    const micInputStream = micInstance.getAudioStream()

    // Passing the raw audio stream to the Symbl API websocket connection
    micInputStream.on('data', (data) => {
        connection.sendAudio(data)
    })
```

* Returns data from Symbl API through the connection `handlers` functions.
```js
    handlers: {
        // This will return live speech-to-text transcription of the call.
        onSpeechDetected: (data) => {
            if (data) {
            const { punctuated } = data
            console.log('Live: ', punctuated && punctuated.transcript)
            console.log('');
            }
            // console.log('onSpeechDetected ', JSON.stringify(data, null, 2));
        },
        
        // When processed messages are available, this callback will be called.
        onMessageResponse: (data) => {
            console.log('onMessageResponse', JSON.stringify(data, null, 2))
        },
        
        // When Symbl detects an insight, this callback will be called.
        onInsightResponse: (data) => {
            console.log('onInsightResponse', JSON.stringify(data, null, 2))
        },
        
        // When Symbl detects a topic, this callback will be called.
        onTopicResponse: (data) => {
            console.log('onTopicResponse', JSON.stringify(data, null, 2))
        }
    }
```
