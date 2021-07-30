## Telephony Example

### `telephonyLiveCall.js`

* Captures a live phone call via a phone number and a specification of what you'd like to collect.

    ```js
    const connection = await sdk.startEndpoint({
        endpoint: {
            type: 'pstn',
            phoneNumber: PHONE_NUMBER,
        },
        insightTypes: ['action_item', 'question'],
        actions: [{
            invokeOn: 'stop',
            name: 'sendSummaryEmail',
            parameters: {
                emails: [
                    EMAIL
                ], // Add valid email addresses to received email
            },
        }, ],
        data: {
            session: {
                name: 'My Test Meeting',
            },
        },
    });
    ```

* Uses the `subscribeToConnection` from the SDK to access the data that is being collected live.
    ```js
    // Subscribe to connection using connectionId.
    await sdk.subscribeToConnection(connection.connectionId, (data) => {
        const { type } = data;
        if (type === 'transcript_response') {
            const { payload } = data;

            // You get live transcription here
            console.log(`Live: ${payload && payload.content}`);

        } else if (type === 'message_response') {
            const { messages } = data;

            // You get processed messages in the transcript here. Real-time but not live.
            messages.forEach(message => {
                console.log(`Message: ${message.payload.content}`);
            });
        } else if (type === 'insight_response') {
            const { insights } = data;
            // You get any insights here!!!
            insights.forEach(insight => {
                console.log(`Insight: ${insight.type} - ${insight.text}`);
            });
        }
    });
    ```

### `pushingEvents.js`

* An event can be defined as a single occurrence of a process. Currently the only supported event type is `speaker`. The `speaker` event is associated with different individual attendees in a conference. An example of speaker event is shown below

    ```js
    const speakerEvent = new SpeakerEvent({
        type: SpeakerEvent.types.startedSpeaking,
        user: {
            userId: 'john@example.com',
            name: 'John'
        }
    });
    ```

    In the above example the `user` needs to have `userId` key-value pair to uniquely identify the user.  It has the following types:
    * ##### `started_speaking`
        This event contains the details of the user who started speaking with the timestamp of when he started speaking.
        
        Example:
        ```js
        const speakerEvent = new SpeakerEvent({
            type: SpeakerEvent.types.startedSpeaking,
            user: {
                userId: 'john@example.com',
                name: 'John'
            }
        });        
        ```
    * ##### `stopped_speaking`
        This event contains the details of the user who stopped speaking with the timestamp of when he stopped speaking.
        
        Example:
        ```js
        const speakerEvent = new SpeakerEvent({
            type: SpeakerEvent.types.stoppedSpeaking,
            user: {
                userId: 'john@example.com',
                name: 'John'
            }
        }); 
        ```
    * ##### `joined`
        This event contains the details of user who just joined the conference call with the timestamp at which they joined.
        
        Example:
        ```js
        const speakerEvent = new SpeakerEvent({
            type: SpeakerEvent.types.joined,
            user: {
                userId: 'john@example.com',
                name: 'John'
            }
        });
        ```
    * ##### `left`
        This event contains the details of user who just left the conference call with the timestamp at which they left.
        
        Example:
        ```js
        const speakerEvent = new SpeakerEvent({
            type: SpeakerEvent.types.left,
            user: {
                userId: 'john@example.com',
                name: 'John'
            }
        });
        ```