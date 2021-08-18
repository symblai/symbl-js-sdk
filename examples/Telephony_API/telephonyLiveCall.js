const { sdk } = require('@symblai/symbl-js')

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';
const EMAIL = '<your Email address>';
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
                    name: 'My Test Meeting', // Set name for meeting
                },
            },
        });

        const { connectionId } = connection;
        console.log('Successfully connected. Connection Id: ', connectionId);

        // Subscribe to connection using connectionId.
        await sdk.subscribeToConnection(connection.connectionId, (data) => {
            const { type } = data;
            if (type === 'transcript_response') {
                const { payload } = data;

                // You get live transcription here.
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

        // Stop call after 60 seconds to automatically.
        setTimeout(async () => {
            const connection = await sdk.stopEndpoint({
                connectionId
            });
            console.log('Stopped the connection');
            console.log('Conversation ID:', connection.conversationId);
        }, 60 * 1000); // Change the 60000 with higher value if you want this to continue for more time.
    } catch (e) {
        console.error('Error: ', e)
    }
})();