# Symbl Javascript SDK

The Symbl Javascript SDK provides convenient access to the Symbl API from applications written in the Javascript language via Node.js or directly in the browser. It includes a pre-defined set of classes for a simple and clear utilization of APIs.

We are working diligently to support every Symbl API. Currently we support the following APIs:

* [Streaming API](https://docs.symbl.ai/docs/streamingapi/introduction)
* [Telephony API](https://docs.symbl.ai/docs/telephony/introduction)
* [Subscribe API](https://docs.symbl.ai/docs/subscribe-api)

## Documentation

See the [API docs](https://docs.symbl.ai/docs/).

### Requirements

- Node.js 10+

## Installation

First make sure that Node.js is installed on your system with the following command in Mac/Linux console or Windows command prompt:

```sh
node -v
```

To install the Node.js, just visit the link below:

- Windows/Mac/Linux: https://nodejs.org/en/download/

You can then install the library directly on your machine using:

```sh
npm install @symblai/symbl-js
```

## Import into your application


Node Import: 

```js
const { sdk } = require('@symblai/symbl-js');
```

ES6 Import:

```js
import {sdk} from "@symblai/symbl-js/build/client.sdk.min";
```


## Configuration

The SDK needs to be initialized with your account's credentials (appId & appSecret) which is
available in your [Symbl Platform][api-keys].

You can either provide the credentials by declaring constants before SDK initilization or pass them directly when creating the SDK instance.

Example:

```js
const { sdk } = require('@symblai/symbl-js');

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';

sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));
```


## Transcribing live audio input through the microphone

As a simple test of the Streaming API you can simply setup a live microphone and push the audio stream using the `mic` npm package and use the `uuid` package to create a unique meeting ID. 

In order to use the `mic` package, you'll need either Sox for Mac/Windows or Alsa tools for Linux installed on your computer.

To check if Sox is installed on Windows or Mac, simply open a console/terminal and type in the command `sox --version`

To install Sox on Windows or Mac download their latest release [here](https://sourceforge.net/projects/sox/files/sox/14.4.2/) and run the installer.

If you have Homebrew on your Mac install it with `brew install sox`

To check if you have Alsa tools installed in Linux and are able to use it, run `arecord temp.wav` in your terminal.

If it is not installed you can use the following commands:

Debian/Ubuntu: `sudo apt-get update && sudo apt-get install alsa-base alsa-utils`

Arch: `sudo pacman -Syu && sudo pacman -S alsa-tools`

Initialize the SDK and connect via the built-in websocket connector. This will output the live transcription to the console.

```js
const { sdk } = require('@symblai/symbl-js');
const uuid = require('uuid').v4;

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';

const mic = require('mic')

const sampleRateHertz = 16000

const micInstance = mic({
  rate: sampleRateHertz,
  channels: '1',
  debug: false,
  exitOnSilence: 6,
});

// Need unique ID and best to use uuid in production
// const connectionId = uuid()
const connectionId = new Buffer(APP_ID).toString('base64'); // for testing

(async () => {
  try {
    // Initialize the SDK
    await sdk.init({
      appId: APP_ID,
      appSecret: APP_SECRET,
      basePath: 'https://api.symbl.ai',
    })

    // Start Real-time Request (Uses Real-time WebSocket API behind the scenes)
    const connection = await sdk.startRealtimeRequest({
      id: connectionId,
      config: {
        meetingTitle: 'My Test Meeting',
        confidenceThreshold: 0.7,
        timezoneOffset: 480, // Offset in minutes from UTC
        languageCode: 'en-US',
        sampleRateHertz
      },
      handlers: {
        /**
         * This will return live speech-to-text transcription of the call.
         * There are other handlers that can be seen in the full example.
         */
        onSpeechDetected: (data) => {
          if (data) {
            const {
              punctuated
            } = data
            console.log('Live: ', punctuated && punctuated.transcript)
          }
        }
      }
    });

    // Logs conversationId which is used to access the conversation afterwards
    console.log('Successfully connected. Conversation ID: ', connection.conversationId);

    const micInputStream = micInstance.getAudioStream()
    /** Raw audio stream */
    micInputStream.on('data', (data) => {
      // Push audio from Microphone to websocket connection
      connection.sendAudio(data)
    })

    micInputStream.on('error', function (err) {
      console.log('Error in Input Stream: ' + err)
    })

    micInputStream.on('startComplete', function () {
      console.log('Started listening to Microphone.')
    })

    micInputStream.on('silence', function () {
      console.log('Got SIGNAL silence')
    })

    micInstance.start()

    setTimeout(async () => {
      // Stop listening to microphone
      micInstance.stop()
      console.log('Stopped listening to Microphone.')
      try {
        // Stop connection
        await connection.stop()
        console.log('Connection Stopped.')
      } catch (e) {
        console.error('Error while stopping the connection.', e)
      }
    }, 120 * 1000) // Stop connection after 2 minute i.e. 120 secs
  } catch (err) {
    console.error('Error: ', err)
  }
})();
```

If you'd like to see a more in-depth examples for the Streaming API, please take a look at the extended Streaming examples [here][Streaming-Examples].

## Subscribe to Streaming API connection

Using the Subscribe API, a read-only connection can be opened that can access the data that does not send audio or count towards minutes used on account. You'll need the `connectionId` from an existing live connection as in the previous live transcription example. If you are not handling the realtime connection and subscribe api connection in the same file, you can access an existing connection's connectionId with `connection.connectionId`.

This example can be run in a separate terminal while the previous example is running.

```js
const { sdk } = require('@symblai/symbl-js');

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';

// Subscribe to connection using connectionId that was defined as `connectionId` in previous example.
// We'll use the same constant Base64 string as before
const connectionId = new Buffer(APP_ID).toString('base64'); // for testing

(async () => {
  try {
    // Initialize the SDK
    await sdk.init({
      appId: APP_ID,
      appSecret: APP_SECRET,
      basePath: 'https://api.symbl.ai',
    })

    sdk.subscribeToStream(connectionId, (data) => {
        const { type } = data;
        if (type === 'message_response') {

            const { messages } = data;

            // You get any messages here
            messages.forEach(message => {
              console.log(`Message: ${message.payload.content}`)
            });

        } else if (type === 'insight_response') {

            const { insights } = data;

            // You get any insights here
            insights.forEach(insight => {
                console.log(`Insight: ${insight.type} - ${insight.text}`);
            });

        } else if (type === 'topic_response') {
            const { topics } = data;
            
            // You get any topic phrases here
            topics.forEach(topic => {
                console.log(`Topic detected: ${topic.phrases}`)
            });

        } else if (type === 'message' && data.message.hasOwnProperty('punctuated')) {

            const { transcript } = data.message.punctuated;

            // Live punctuated full transcript as opposed to broken into messages
            console.log(`Live transcript: ${transcript}`)
        }

        // The raw data response
        console.log(`Response type: ${data.type}. Object: `, data);

    });
  } catch (err) {
    console.error('Error: ', err)
  }
})();
```

## Transcribing live audio input through Telephony API

Symbl’s Telephony API allows you to connect to any conference call system using PSTN or SIP networks. This allows transcription and insights while using systems like Zoom, Twilio, Chime, or the like with minimal setup.

As a simple test of the Telephony API you can call a phone number and see a live transcription of your phone call in the console.

```js
const { sdk } = require('@symblai/symbl-js');

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';
const PHONE_NUMBER = '<your phone number>';

(async () => {
    try {
        // Initialize the SDK
        await sdk.init({
            appId: APP_ID,
            appSecret: APP_SECRET,
            basePath: 'https://api.symbl.ai',
        })

        // Start Real-time Request (Uses Real-time WebSocket API behind the scenes)
        const connection = await sdk.startEndpoint({
            endpoint: {
                type: 'pstn',
                phoneNumber: PHONE_NUMBER,
            },
            insightTypes: ['action_item', 'question'],
            data: {
                session: {
                    name: 'My Test Meeting',
                },
            },
        });

        const { connectionId } = connection;
        console.log('Successfully connected. Connection Id: ', connectionId);

        // Subscribe to connection using connectionId.
        sdk.subscribeToConnection(connectionId, (data) => {
            const { type } = data;
            if (type === 'transcript_response') {
                const { payload } = data;

                // You get live transcription here
                console.log(`Live: ${payload && payload.content}`);

            } else if (type === 'message_response') {
                const { messages } = data;

                // You get any messages here
                messages.forEach(message => {
                  console.log(`Message: ${message.payload.content}`)
                })
            } else if (type === 'insight_response') {
                const { insights } = data;
            }
        });

        // Stop call after 60 seconds to automatically.
        setTimeout(async () => {
            const connection = await sdk.stopEndpoint({
                connectionId
            });
            console.log('Stopped the connection');
            console.log('Conversation ID:', connection.conversationId);
        }, 60 * 1000); // Change the 60 to however many seconds you want.
    } catch (e) {
        console.error('Error: ', e)
    }
})();
```
If you'd like to see a more in-depth examples for the Telephony API, please take a look at the extended Telephony examples [here][Telephony-Examples].

## Need support?

If you are looking for some specific use cases and more in-depth examples do check our [examples][examples] folder.

If you can't find your answers, do let us know at support@symbl.ai or join our slack channel [here][slack-invite].

[api-keys]: https://platform.symbl.ai/#/login
[symbl-docs]: https://docs.symbl.ai/docs/javascript-sdk/introduction
[streaming_api-docs]: https://docs.symbl.ai/docs/streamingapi/introduction
[telephony_api-docs]: https://docs.symbl.ai/docs/telephony/introduction
[async_text-docs]: https://docs.symbl.ai/docs/async-api/overview/text/post-text/
[async_audio-docs]: https://docs.symbl.ai/docs/async-api/overview/audio/post-audio
[examples]: examples
[slack-invite]: https://symbldotai.slack.com/join/shared_invite/zt-4sic2s11-D3x496pll8UHSJ89cm78CA#/
[streaming-examples]: examples/Streaming_API
[telephony-examples]: examples/Telephony_API
