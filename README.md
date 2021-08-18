# Symbl Javascript SDK

The Symbl Javascript SDK provides convenient access to the Symbl API from applications written in the Javascript language via Node.js or directly in the browser. It includes a pre-defined set of classes for a simple and clear utilization of APIs.

## Documentation

See the [API docs](https://docs.symbl.ai/docs/).

### Requirements

- Node.js 14+

## Installation

First make sure that Node.js is installed on your system with the following command in Mac/Linux console or Windows command prompt:

```sh
node -v
```

To install the Node.js, just visit the link below:

- Windows/Mac/Linux: https://nodejs.org/en/download/

You don't need this source code unless you want to modify the package. If you just
want to use the Node.js package, then you can install it directly into your project with `npm`:

```sh
npm install @symblai/symbl-js
```

<!-- If you use the npm package, the SDK import will not require a relative path.

```js
const { sdk } = require('@symblai/symbl-js');
``` -->

## Setup

Before you begin using the bundled package from source, you'll need to install NPM packages and build with webpack after cloning the git repository or unzipping downloaded source.

```sh
npm install
npm run build
```

<!-- ## Importing the SDK

CommonJS style (typically used in Node.js)
```js
const { sdk } = require('/path/to/symbl-js');
```

ES6 style (typically used in ECMAScript 2015+ browser-side code)
```js
import { sdk } from '/path/to/symbl-js';
``` -->

## Configuration

The SDK needs to be initialized with your account's credentials (appId & appSecret) which is
available in your [Symbl Platform][api-keys].

You can either provide the credentials by declaring constants or pass them directly when creating the SDK instance.

```js
const APP_ID='<app_id>'
const APP_SECRET='<app_secret>'
```
<!-- Example for 'config.js' file

```js
export = {
  'APP_ID':'<app_id>',
  'APP_SECRET':'<app_secret>'
}
```

Importing the 'config.js' file

```js
// If using CommonJS style
const config = require('/path/to/config')

// If using ES6 style
import { config } from '/path/to/config'
``` -->

<!-- ## Initializing SDK

To initialize with default API endpoints.
```js
sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));
```

If you have custom API domain, use the `basePath` option in `init()`.
```js
sdk.init({
    appId: APP_ID,
    appSecret: APP_SECRET,
    basePath: 'https://yourcustomdomain.rammer.ai'
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err)); 
```-->

## Transcribing live audio input through the microphone

As a simple test of the Streaming API you can simply setup a live microphone and push the audio stream using the `mic` npm package and use the `uuid` package to create a unique meeting ID. 

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

(async () => {
  try {
    // Initialize the SDK
    await sdk.init({
      appId: APP_ID,
      appSecret: APP_SECRET,
      basePath: 'https://api.symbl.ai',
    })

    // Need unique Id
    const id = uuid()

    // Start Real-time Request (Uses Real-time WebSocket API behind the scenes)
    const connection = await sdk.startRealtimeRequest({
      id,
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
    }, 60 * 1000) // Stop connection after 1 minute i.e. 60 secs
  } catch (e) {
    console.error('Error: ', e)
  }
})();
```

If you'd like to see a more in-depth examples for the Streaming API, please take a look at the extended Streaming examples [here][Streaming-Examples].

## Transcribing live audio input through Telephony API

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
                
               symbl });
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