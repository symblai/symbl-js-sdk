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