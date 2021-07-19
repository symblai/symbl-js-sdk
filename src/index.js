import ClientSDK from './ClientSDK';
import _SpeakerEvent from './event/SpeakerEvent';
import isNode from 'detect-node';
const sdk = new ClientSDK();
if (!isNode) {
    window.ClientSDK = ClientSDK;
    window.rammerSdk = sdk;
    window.SpeakerEvent = _SpeakerEvent;
}
export {ClientSDK as SDK, sdk, _SpeakerEvent as SpeakerEvent};
