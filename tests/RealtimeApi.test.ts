import RealtimeApi from "../src/api/RealtimeApi";

test('onDataReceivedHandler is called', async () => {
    const connectionConfig = {
      insightTypes: ['action_item', 'question'],
      config: {
        meetingTitle: 'My Test Meeting',
        confidenceThreshold: 0.7,
        timezoneOffset: 480, // Offset in minutes from UTC
        languageCode: 'en-US',
        sampleRateHertz: 44100
      },
      speaker: {
        // Optional, if not specified, will simply not send an email in the end.
        userId: '', // Update with valid email
        name: ''
      },
      basePath: 'https://api.symbl.ai',
      handlers: {
        /**
         * This will return any time a websocket message is received.
         */
        onDataReceived(data) {
            console.log('data', data);
        }
      }
    };


    const rt = new RealtimeApi(connectionConfig, true);

    const spy1 = jest.spyOn(rt, 'onDataReceived');
    const spy2 = jest.spyOn(rt.handlers, 'onDataReceived');
    const data = {
        success: true
    };
    rt.onMessageWebSocket(JSON.stringify(data));
    expect(spy1).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 1)); // set delay
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledWith(data);

});

test('onDataReceivedHandler is NOT called', async () => {
    const connectionConfig = {
      insightTypes: ['action_item', 'question'],
      config: {
        meetingTitle: 'My Test Meeting',
        confidenceThreshold: 0.7,
        timezoneOffset: 480, // Offset in minutes from UTC
        languageCode: 'en-US',
        sampleRateHertz: 44100
      },
      speaker: {
        // Optional, if not specified, will simply not send an email in the end.
        userId: '', // Update with valid email
        name: ''
      },
      basePath: 'https://api.symbl.ai',
      handlers: {
      }
    };


    const rt = new RealtimeApi(connectionConfig, true);

    const spy1 = jest.spyOn(rt, 'onDataReceived');
    const data = {
        success: true
    };
    rt.onMessageWebSocket(JSON.stringify(data));
    expect(spy1).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 1)); // set delay
    expect(rt.handlers.onDataReceived).toBe(undefined);

});