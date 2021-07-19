# Client SDK for Rammer's Language Insights

## Table Of Contents
* [Overview](#overview)
* [Installation](#installation)
* [Referencing the SDK](#referencing-the-sdk)
    * [ES5 way](#es5-way)
    * [ES6 way](#es6-way)
* [Initializing the SDK](#initialize-the-client-sdk)
* [Supported Endpoints](#supported-endpoints)
    * [PSTN](#pstn-(public-switched-telephone-networks))
    * [SIP](#sip-(session-initiation-protocol))
* [Connecting To Endpoints](#connecting-to-endpoints)
    * [Starting and Stopping the Connection](#starting-and-stopping-the-connection)
* [Types Of Events](#types-of-events)
    * [Speaker](#speaker)
         * [started_speaking](#started_speaking)
         * [stopped_speaking](#stopped_speaking)
         * [joined](#joined)
         * [left](#left)
* [Pushing Events](#pushing-events)
* [Complete Example](#complete-example)
* [Building Source Locally](#build-the-source-on-local)

### Overview
The SDK allows you to easily use Rammer's Language Insights capabilities. Both ES5 and ES6 are supported.

It exposes the functionality for Rammer to dial-in to the conference. Supported endpoints are given below.
Additionally events can be passed for further processing. The supported types of events are discussed in detail in the section below.

Currently the SDK supports following features -
* Start/Stop the SIP or PSTN endpoint connection
* Specify actions to be performed in the active connection. Currently only `sendSummaryEmail` action is supported.
* Specify session specific data
* Push various `Speaker` events like - `started_speaking`, `stopped_speaking`, `joined`, `left` described in detail below. 

## Installation
These commands will configure the Rammer's npm repository, you will need to do this if you're installing for the first time.
```
npm config set @rammerai:registry http://repo.rammer.ai/repository/public/
npm config set _auth YW5vbnltb3VzOmFub255bW91cw==
```

After above step, execute below to install.
```
npm install @rammerai/language-insights-client-sdk
```

## Referencing the SDK

#### ES5 Way
```javascript 1.5
var sdk = require('@rammerai/language-insights-client-sdk').sdk;
```

#### ES6 Way

```javascript 1.8
import {sdk} from '@rammerai/language-insights-client-sdk';
```

## Initialize the Client SDK
To initialize with default API endpoints.
```javascript 1.8
sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret'
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));
```

If you have custom API domain, use the `basePath` option in `init()`.
```javascript 1.8
sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret',
    basePath: 'https://yourcustomdomain.rammer.ai'
}).then(() => console.log('SDK Initialized.'))
    .catch(err => console.error('Error in initialization.', err));
```

### Supported Endpoints
This SDK supports dialing through PSTN and SIP endpoints:
* #### PSTN (Public Switched Telephone Networks) 
    The below snippet shows the `endpoint` to dial using PSTN
    ```javascript 1.8
        endpoint: {
            type: 'pstn',
            phoneNumber: '14083380682', // Phone number to dial in
            dtmf: '6155774313#' // Any Joining code to be used
        }   
    ```
* #### SIP (Session Initiation Protocol)
    The below snippet shows the `endpoint` to dial using SIP
    ```javascript 1.8
        endpoint: {
            type: 'sip',
            uri: 'sip:555@<your_sip_domain>', // SIP URI to dial in
            audioConfig: { // Optionally any audio configuration
                sampleRate: 16000,
                encoding: 'PCMU',
                sampleSize: '16'
            }
        }
    ```
    The `audioConfig` above is optional.
    
We recommend using SIP as it provides higher audio quality as compared to PSTN. 

With SIP an optional audio configuration can also be provided as shown above.

## Connecting To Endpoints
As shown in the sections above, both PSTN and SIP can be used for dialing-in.

The example below shows how to start and stop the connection to an endpoint.

### Starting and Stopping the Connection
```javascript 1.8
const {sdk} = require('@rammerai/language-insights-client-sdk');

sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret'
}).then(() => {
    sdk.startEndpoint({
        endpoint: {
            type: 'pstn', // This can be pstn or sip
            phoneNumber: '14086380986',
            dtmf: '6155771314#'
        }
    }).then(connection => {
        console.log('Successfully connected.', connection);

        // Scheduling stop endpoint call after 60 seconds for the demonstration purpose
        // In real adoption, sdk.stopEndpoint() should be called when the meeting or call actually ends
        setTimeout(() => {
            sdk.stopEndpoint({
                connectionId: connection.connectionId
            }).then(() => {
                console.log('Stopped the connection');
            }).catch(err => console.error('Error while stopping the connection.', err));
        }, 60000);

    }).catch(err => console.error('Error while starting the connection', err));

}).catch(err => console.error('Error in SDK initialization.', err));
```

### Types Of Events
An event can be defined as a single occurrence of a process. 

Currently the only supported event type is `speaker` which is described below
### Speaker
The `speaker` event is associated with different individual attendees in a conference. An example of speaker event is shown below

```javascript 1.8
const speakerEvent = new SpeakerEvent({
    type: SpeakerEvent.types.startedSpeaking,
    user: {
        userId: 'john@example.com',
        name: 'John'
    }
});
```

In the above example the `user` needs to have `userId` key-value pair to uniquely identify the user.  

It has the following types:
* #### started_speaking
    This event contains the details of the user who started speaking with the timestamp of when he started speaking.
    
    Example:
    ```javascript 1.8
    const speakerEvent = new SpeakerEvent({
        type: SpeakerEvent.types.startedSpeaking,
        user: {
            userId: 'john@example.com',
            name: 'John'
        }
    });        
    ```
* #### stopped_speaking
    This event contains the details of the user who stopped speaking with the timestamp of when he stopped speaking.
    
    Example:
    ```javascript 1.8
   const speakerEvent = new SpeakerEvent({
       type: SpeakerEvent.types.stoppedSpeaking,
       user: {
           userId: 'john@example.com',
           name: 'John'
       }
   }); 
    ```
* #### joined
    This event contains the details of user who just joined the conference call with the timestamp at which they joined.
    
    Example:
    ```javascript 1.8
    const speakerEvent = new SpeakerEvent({
        type: SpeakerEvent.types.joined,
        user: {
            userId: 'john@example.com',
            name: 'John'
        }
    });
    ```
* #### left
    This event contains the details of user who just left the conference call with the timestamp at which they left.
    
    Example:
    ```javascript 1.8
    const speakerEvent = new SpeakerEvent({
        type: SpeakerEvent.types.left,
        user: {
            userId: 'john@example.com',
            name: 'John'
        }
    });
    ```
    
In the above examples the `speakerEvent` can be reused for the same user by changing the event `type`.

## Pushing Events

Events can be pushed to an on-going connection to have them processed. The below snippet 
shows a simple example where a `startedSpeaking` event is pushed on the on-going connection. 

```javascript 1.8
const {sdk, SpeakerEvent} = require('@rammerai/language-insights-client-sdk');

sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret'
}).then(() => {
    sdk.startEndpoint({
        endpoint: {
            type: 'pstn',
            phoneNumber: '14086380986',
            dtmf: '6155771314#'
        }
    }).then(connection => {
        const connectionId = connection.connectionId;
        console.log(`Successfully connected. ConnectionId: ${connectionId}`);
        
        const speakerEvent = new SpeakerEvent();
        speakerEvent.type = SpeakerEvent.types.startedSpeaking;
        speakerEvent.user = {
            userId: 'john@example.com',
            name: 'John'
        };
        speakerEvent.timestamp = new Date().toISOString();
        
        // Use pushEventOnConnection from the sdk instance to push event on connection
        sdk.pushEventOnConnection(connectionId, speakerEvent.toJSON(), (err) => {
            if (err) {
                console.error('Error during push event.', err);
            } else {
                console.log('Event pushed!');
            }
        });

        // Scheduling stop endpoint call after 60 seconds for the demonstration purpose
        // In real adoption, sdk.stopEndpoint() should be called when the meeting or call actually ends
        setTimeout(() => {
            sdk.stopEndpoint({
                connectionId: connection.connectionId
            }).then(() => {
                console.log('Stopped the connection');
            }).catch(err => console.error('Error while stopping the connection.', err));
        }, 60000);

    }).catch(err => console.error('Error while starting the connection', err));

}).catch(err => console.error('Error in SDK initialization.', err));
```

## Complete Example
Below is a quick simulated speaker event example that 
1. Initializes the SDK with custom `basePath`
2. Initiates a connection with an endpoint
3. Sends a speaker event of type `startedSpeaking` for user John
4. Sends a speaker event of type `stoppedSpeaking` for user John
5. Ends the connection with the endpoint 

```javascript 1.8
const {sdk, SpeakerEvent} = require('@rammerai/language-insights-client-sdk');

sdk.init({
    appId: 'yourAppId',
    appSecret: 'yourAppSecret',
    basePath: 'https://yourcustomdomain.rammer.ai'
}).then(() => {
    console.log('SDK Initialized');
    sdk.startEndpoint({
        endpoint: {
            type: 'pstn',
            phoneNumber: '14087407256',
            dtmf: '6327668#'
        }
    }).then(connection => {
        const connectionId = connection.connectionId;
        console.log(`Successfully connected. ConnectionId: ${connectionId}`);

        const speakerEvent = new SpeakerEvent({
            type: SpeakerEvent.types.startedSpeaking,
            user: {
                userId: 'john@example.com',
                name: 'John'
            }
        });

        setTimeout(() => {
            speakerEvent.timestamp = new Date().toISOString();

            sdk.pushEventOnConnection(connectionId, speakerEvent.toJSON(), (err) => {
                if (err) {
                    console.error('Error during push event.', err);
                } else {
                    console.log('Event pushed!');
                }
            });
        }, 2000);

        setTimeout(() => {
            speakerEvent.type = SpeakerEvent.types.stoppedSpeaking;
            speakerEvent.timestamp = new Date().toISOString();

            sdk.pushEventOnConnection(connectionId, speakerEvent.toJSON(), (err) => {
                if (err) {
                    console.error('Error during push event.', err);
                } else {
                    console.log('Event pushed!');
                }
            });
        }, 12000);

        // Scheduling stop endpoint call after 60 seconds
        setTimeout(() => {
            sdk.stopEndpoint({
                connectionId: connection.connectionId
            }).then(() => {
                console.log('Stopped the connection');
            }).catch(err => console.error('Error while stopping the connection.', err));
        }, 90000);

    }).catch(err => console.error('Error while starting the connection', err));

}).catch(err => console.error('Error in SDK initialization.', err));
```

Setting the timestamp for `speakerEvent` is optional but recommended.

## Build the source on local
You shouldn't be required to build the local repository in most of the cases. But if you do, following command will build the source code and create the build file under `build` directory.
```
npm run build
```
