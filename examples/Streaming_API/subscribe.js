const {
    sdk
} = require("@symblai/symbl-js");

const APP_ID = "<your App ID>";
const APP_SECRET = "<your App Secret>";

/**
 * In production please use the following:
 * const connectionId = require('uuid').v4();
 */
const connectionId = Buffer.from("Symbl.ai is the BEST!").toString("base64");

(async () => {

    try {

        // Initialize the SDK
        await sdk.init({
            "appId": APP_ID,
            "appSecret": APP_SECRET,
            "basePath": "https://api.symbl.ai",
            "logLevel": 1
        });

        sdk.subscribeToRealtime(
            connectionId,
            (data) => {

                const {
                    type
                } = data;
                if (type === "message_response") {

                    const {
                        messages
                    } = data;

                    // You get any messages here
                    messages.forEach((message) => {

                        sdk.logger.log(`Subscribe Message: ${message.payload.content}`);

                    });

                } else if (type === "insight_response") {

                    const {
                        insights
                    } = data;

                    // You get any insights here
                    insights.forEach((insight) => {

                        sdk.logger.log(`Subscribe Insight: ${insight.type} - ${insight.text}`);

                    });

                } else if (type === "topic_response") {

                    const {
                        topics
                    } = data;

                    // You get any topic phrases here
                    topics.forEach((topic) => {

                        sdk.logger.log(`Subscribe Topic detected: ${topic.phrases}`);

                    });

                } else if (type === "message" && data.message.hasOwnProperty("punctuated")) {

                    const {
                        transcript
                    } = data.message.punctuated;

                    // Live punctuated full transcript as opposed to broken into messages
                    sdk.logger.log(`Subscribe Live transcript: ${transcript}`);

                }

                // The raw data response
                sdk.logger.log(
                    `Subscribe Response type: ${data.type}. Object: `,
                    data
                );

            }
        );

    } catch (err) {

        sdk.logger.error(err);

    }

})();
