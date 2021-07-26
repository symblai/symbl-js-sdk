import ClientSDK from './ClientSDK';
import _SpeakerEvent from './event/SpeakerEvent';

declare var window: any;

const sdk = new ClientSDK();
if (typeof window!=="undefined") {
    window.ClientSDK = ClientSDK;
    window.rammerSdk = sdk;
    window.SpeakerEvent = _SpeakerEvent;
}

export {ClientSDK as SDK, sdk, _SpeakerEvent as SpeakerEvent};
