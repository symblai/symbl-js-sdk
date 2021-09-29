const {sdk, SpeakerEvent} = require("@symblai/symbl-js");

const appId = "";
const appSecret = "";
const phoneNumber = ""; // US Zoom Numbers are "+16465588656", or "+14086380968".
const meetingName = "Zoom Test Meeting";
const emailAddress = "user@example.com";

const ZOOM_MEETING_ID = "ZOOM_MEETING_ID";
const ZOOM_PARTICIPANT_ID = "";
const ZOOM_MEETING_PASSCODE = "";

let dtmfSequence = `${ZOOM_MEETING_ID}#`;

if (ZOOM_PARTICIPANT_ID) {
  dtmfSequence += `,,${ZOOM_PARTICIPANT_ID}#`;
} else {
  dtmfSequence += `,,#`;
}

if (ZOOM_MEETING_PASSCODE) {
  dtmfSequence += `,,${ZOOM_MEETING_PASSCODE}#`;
}


sdk.init({
  appId: appId,
  appSecret: appSecret,
  basePath: "https://api.symbl.ai",
}).then(async() => {
  console.log('SDK initialized.');
  try {

    sdk.startEndpoint({
      endpoint: {
        type: "pstn",
        phoneNumber: phoneNumber,
        dtmf: dtmfSequence,
      },
      actions: [
        {
          invokeOn: "stop",
          name: "sendSummaryEmail",
          parameters: {
            emails: [
              emailAddress
            ],
          },
        },
      ],
      data: {
        session: {
          name: meetingName,
        },
      },
    }).then((connection) => {
      const connectionId = connection.connectionId;
      console.log("Successfully connected.", connectionId);
      console.log('Conversation ID', connection.conversationId);
      console.log('Full Conection Object', connection);
      console.log("Calling into Zoom now, please wait about 30-60 seconds.");
    })
    .catch((err) => {
       console.error("Error while starting the connection", err);
    });
  } catch (e) {
    console.error(e);
  }
}).catch(err => console.error('Error in SDK initialization.', err));