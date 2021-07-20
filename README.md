# Symbl Javscript SDK

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
npm install symbl-node
```

If you want to use the JS SDK in the browser, look at the Web SDK [here][web-sdk-link].

## Configuration

The SDK needs to be initialized with your account's credentials (appId & appSecret) which is
available in your [Symbl Platform][api-keys].

You can either provide the credentials by writing a configuration file or pass them directly when creating the SDK instance.

```js
const APP_ID='<app_id>'
const APP_SECRET='<app_secret>'
```
Example for 'config.js' file

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
```

## Importing SDK

CommonJS style
```js
var sdk = require('/path/to/symbl-js').sdk;
```

ES6 style
```js
import { sdk } from '/path/to/symbl-js';
```


## Initializing SDK

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
```

<!-- ## A speech to text converter under 5 lines of code

To know more about **Async Audio Api**, click [here][async_audio-docs]. To know more about the Python SDK Audio Package, click [here][extended_readme-audio]

```python
import symbl

# Process audio file
conversation_object = symbl.Audio.process_file(
  # credentials={app_id: <app_id>, app_secret: <app_secret>}, #Optional, Don't add this parameter if you have symbl.conf file in your home directory
  file_path="<file_path>")

# Printing transcription messages
print(conversation_object.get_messages())
```

To know more about conversation object and it's functions, click [here][extended_readme-conversation-object]

## Extracting insights from Textual conversation

To know more about **Async Text Api**, click [here][async_text-docs]. To know more about the Python SDK Text Package, click [here][extended_readme-text]

  ``` python

import symbl

payload = {
  "messages": [
    {
      "payload": {"content": "Hi Anthony. I saw your complaints about bad call reception on your mobile phone. Can I know what issues you are currently facing?"},
      "from": {"userId": "surbhi@example.com","name": "Surbhi Rathore"}
    },
    {
      "payload": {"content": "Hey Surbhi, thanks for reaching out. Whenever I am picking up the call there is a lot of white noise and I literally can’t hear anything."},
      "from": {"userId": "anthony@example.com","name": "Anthony Claudia"}
    },
    {
      "payload": {"content": "Okay. I can schedule a visit from one of our technicians for tomorrow afternoon at 1:00 PM. He can look at your mobile and handle any issue right away"},
      "from": {"userId": "surbhi@example.com","name": "Surbhi Rathore"}
    },
    {
      "payload": {"content": "That will be really helpful. I'll follow up with the technician about some other issues too, tomorrow"},
      "from": {"userId": "anthony@example.com","name": "Anthony Claudia"}
    },
    {
      "payload": {"content": "Sure. We are happy to help. I am scheduling the visit for tomorrow. Thanks for using Abccorp networks. Have a good day."},
      "from": {"userId": "surbhi@example.com","name": "Surbhi Rathore"}
    }
  ]
}

conversation_object = symbl.Text.process(payload=payload)

print(conversation_object.get_messages())
print(conversation_object.get_topics())
print(conversation_object.get_action_items())
print(conversation_object.get_follow_ups())

  ```

## Analysis of your Zoom Call on your email (Symbl will join your zoom call and send you analysis on provided email)

To know more about **telephony api**, click [here][telephony_api-docs]. To know more about the Python SDK Telephony Package, click [here][extended_readme-telephony]

```python

import symbl

phoneNumber = "" # Zoom phone number to be called, check here https://us02web.zoom.us/zoomconference
meetingId = "" # Your zoom meetingId
password = "" # Your zoom meeting passcode
emailId = ""

connection_object = symbl.Telephony.start_pstn(
      # credentials={app_id: <app_id>, app_secret: <app_secret>}, #Optional, Don't add this parameter if you have symbl.conf file in your home directory or working directory
      phone_number=phoneNumber,
      dtmf = ",,{}#,,{}#".format(meetingId, password),
      actions = [
        {
          "invokeOn": "stop",
          "name": "sendSummaryEmail",
          "parameters": {
            "emails": [
              emailId
            ],
          },
        },
      ]
    )

print(connection_object)

```

## Live audio transcript using your system's microphone

To know more about **streaming api**, click [here][streaming_api-docs]. To know more about the Python SDK Streaming Package, click [here][extended_readme-streaming]

```python
import symbl

connection_object = symbl.Streaming.start_connection()

connection_object.subscribe({'message_response': lambda response: print('got this response from callback', response)})

connection_object.send_audio_from_mic()
```

## Extended Readme

You can see all the functions provided by SDK in the **extended [readme.md](https://github.com/symblai/symbl-python/blob/main/symbl/readme.md) file**.

You can go through some examples for understanding the use of all functionality [Explore more example](https://github.com/symblai/symbl-python/tree/main/example)

## Possible Errors

1. PortAudio Errors on Mac Systems:-

   If you're getting PortAudio Error which looks like this
    > sounddevice.PortAudioError: Error opening InputStream: Internal PortAudio error [PaErrorCode -9986]
  
   Please consider updating the PortAudio library in your system. Running the following command can help.
    > brew install portaudio -->

## Need support

If you are looking for some specific use cases do check our [examples][examples] folder.

If you can't find your answers, do let us know at support@symbl.ai or join our slack channel [here][slack-invite].

[api-keys]: https://platform.symbl.ai/#/login
[symbl-docs]: https://docs.symbl.ai/docs/
[streaming_api-docs]: https://docs.symbl.ai/docs/streamingapi/introduction
[telephony_api-docs]: https://docs.symbl.ai/docs/telephony/introduction
[async_text-docs]: https://docs.symbl.ai/docs/async-api/overview/text/post-text/
[async_audio-docs]: https://docs.symbl.ai/docs/async-api/overview/audio/post-audio
[extended-readme]: https://github.com/symblai/symbl-python/blob/main/symbl/readme.md
[extended_readme-conversation-object]: https://github.com/symblai/symbl-python/blob/main/symbl/readme.md#conversation-object
[extended_readme-streaming]: https://github.com/symblai/symbl-python/blob/main/symbl/readme.md#streaming-class
[extended_readme-telephony]: https://github.com/symblai/symbl-python/blob/main/symbl/readme.md#telephony-class
[extended_readme-text]: <https://github.com/symblai/symbl-python/blob/main/symbl/readme.md#text-class>
[extended_readme-audio]: https://github.com/symblai/symbl-python/blob/main/symbl/readme.md#audio-class
[examples]: https://github.com/symblai/symbl-js/tree/main/examples
[unicodeerror]: https://stackoverflow.com/questions/37400974/unicode-error-unicodeescape-codec-cant-decode-bytes-in-position-2-3-trunca
[slack-invite]: https://symbldotai.slack.com/join/shared_invite/zt-4sic2s11-D3x496pll8UHSJ89cm78CA#/
[web-sdk-link]: https://symbl.ai