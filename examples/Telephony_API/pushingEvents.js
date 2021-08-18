const { sdk, SpeakerEvent } = require('@symblai/symbl-js');

const APP_ID = '<your App ID>';
const APP_SECRET = '<your App Secret>';
const PHONE_NUMBER = '<your phone number>';

(async () => {
  try {
    await sdk.init({
      appId: APP_ID,
      appSecret: APP_SECRET
    })
    const connection = await sdk.startEndpoint({
        endpoint: {
            type: 'pstn',
            phoneNumber: PHONE_NUMBER
        }
    })
    
    const { connectionId } = connection;
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
    }, 60 * 1000);
  
  } catch (err) {
    console.error('Error in SDK initialization.', err);
  }
})