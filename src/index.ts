import ClientSDK from "./ClientSDK";
import {Logger} from "./logger/Logger";
import _SpeakerEvent from "./event/SpeakerEvent";

/* eslint-disable */
declare const window: any;

const sdk = new ClientSDK();
/* eslint-enable */
if (typeof window !== "undefined") {

    window.ClientSDK = ClientSDK;
    window.rammerSdk = sdk;
    window.SpeakerEvent = _SpeakerEvent;
    window.Logger = Logger;

}

export {ClientSDK as SDK, sdk, _SpeakerEvent as SpeakerEvent};
