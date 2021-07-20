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
const APP_ID=<app_id>
const APP_SECRET=<app_secret>
```
Example for 'config.js' file

```js
export = {
  'APP_ID':<app_id>,
  'APP_SECRET':<app_secret>
}
```

Importing the 'config.js' file

```js
// If using commonJS style
const config = require('/path/to/config')

// If using ES6 style
import config from '/path/to/config'
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