## Streaming API Examples

* ### `streamingLiveMic.js`
    * Requires the `mic` and `uuid` packages to be installed from NPM `npm install mic uuid`.

    * Captures live microphone audio data by passing the data streaming from the `mic` instance into the Symbl API websocket connection.
    ```
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