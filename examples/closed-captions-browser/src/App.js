import "./App.css";

import React from "react";
import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";

import { Fab } from "@mui/material";

import Switch from "@mui/material/Switch";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";

import Box from "@mui/material/Box";

import { alpha, styled } from '@mui/material/styles';
import { green } from '@mui/material/colors';

import symbl from "@symblai/symbl-web-sdk";

// import symbl from "./build-tsc";

import { v4 } from "uuid";

const AudioContext = window.AudioContext || window.webkitAudioContext;

let stream;

let connectionId;

window.connectionActive = false;

const GreenSwitch = styled(Switch)(({ theme }) => ({
    "& .MuiSwitch-switchBase.Mui-checked": {
        color: green[600],
        "&:hover": {
            backgroundColor: alpha(
                green[600],
                theme.palette.action.hoverOpacity
            ),
        },
    },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
        backgroundColor: green[600],
    },
}));

const handleMicEvent = (setMuted, setMuting, setCaption) => {
    return async (muted, muting) => {
        if (!muting) {
            setMuting(true);

            if (muted) {
                symbl.unmute(stream);
                setMuted(false);
                window.connectionActive = true;
                setCaption(
                    "You're unmuted. Live captions will appear here..."
                );
            } else {
                
                symbl.mute(stream);
                window.connectionActive = false;

                setMuted(true);
                setTimeout(() => {
                    if (!window.connectionActive) {
                        setCaption(
                            "You're muted. Click the unmute button to resume captions."
                        );
                    }
                }, 3000);
            }

            setMuting(false);
        } else {
            console.log("Already muting");
        }
    };
};

const initSDK = async () => {
    await symbl.init({
        appId: process.env.REACT_APP_APP_ID,
        appSecret: process.env.REACT_APP_APP_SECRET,
        basePath: process.env.REACT_APP_BASE_PATH,
    });
};

function App() {
    const [started, setStarted] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [muted, setMuted] = useState(true);
    const [muting, setMuting] = useState(false);
    const [caption, setCaption] = useState(
        "Hit the Play button to connect! Captions will appear here"
    );
    const [subscribed, setSubscribed] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const [renderViaSubscription, setRenderViaSubscription] = useState(false);
    const [useOpus, setUseOpus] = useState(false);

    const initiateConnection = async (handlers) => {
        const id = v4();
        console.log(id);

        connectionId = id;

        stream = await symbl.createStream({
            id,
            disconnectOnStopRequest: false,
            disconnectOnStopRequestTimeout: 300,
            noConnectionTimeout: 900,
            insightTypes: ["action_item", "question"],
            config: {
                meetingTitle: "Mic Test", // Set name for meeting
                confidenceThreshold: 0.7,
                timezoneOffset: 480, // Offset in minutes from UTC
                languageCode: "en-US",
                encoding: useOpus ? 'opus' : 'LINEAR16',
                sampleRateHertz: 48000,
            },
            speaker: {
                userId: process.env.USER_ID || "tanaka@example.com", // Update with valid email or a unique user id
                name: process.env.FULL_NAME || "Tanaka",
            },
            handlers,
        }, true);

        return stream;
    };

    const handleSubscribeClick = async (event) => {
        if (event.target.checked) {
            console.log(`Rendering CC via Subscribe API`);
        } else {
            console.log(`Rendering CC via Audio Stream`);
        }

        if (!connecting && !subscribing && connectionId) {
            setSubscribing(true);

            setRenderViaSubscription(event.target.checked);

            if (!subscribed) {
                await symbl.subscribeToStream(connectionId, (data) => {

                    const { type } = data;

                    if (type === "message_response") {
                        const { messages } = data;

                        // You get any messages here
                        messages.forEach((message) => {
                            symbl.logger.log(
                                `Subscribe Message: ${message.payload.content}`
                            );
                        });
                    } else if (type === "insight_response") {
                        const { insights } = data;

                        // You get any insights here
                        insights.forEach((insight) => {
                            symbl.logger.log(
                                `Subscribe Insight: ${insight.type} - ${insight.text}`
                            );
                        });
                    } else if (type === "topic_response") {
                        const { topics } = data;

                        // You get any topic phrases here
                        topics.forEach((topic) => {
                            symbl.logger.log(
                                `Subscribe Topic detected: ${topic.phrases}`
                            );
                        });
                    } else if (
                        type === "message" &&
                        data.message.hasOwnProperty("punctuated")
                    ) {
                        const { transcript } = data.message.punctuated;

                        // Live punctuated full transcript as opposed to broken into messages
                        symbl.logger.log(
                            `Subscribe Live transcript: ${transcript}`
                        );

                        if (renderViaSubscription) setCaption(transcript);
                    }
                });

                setSubscribing(false);
                setSubscribed(true);
            } else {
                console.log("Already subscribed");
                setSubscribing(false);
            }
        } else {
            console.log("Subscription in progress...");
        }
    };

    const handleStartClick = async () => {
        if (!connecting) {
            setConnecting(true);
            setCaption("Initalizing connection...");

            if (!started) {

                await initiateConnection(
                    {
                        onSpeechDetected: (data) => {
                            if (data) {
                                const { punctuated } = data;
                                if (!renderViaSubscription)
                                    setCaption(punctuated.transcript);
                            }
                        },

                        onStartedListening: () => {
                            setMuted(false);
                        },
                    }
                );

                setCaption(
                    "You're muted. Click the unmute button to resume captions."
                );
                setStarted(true);
            } else {
                if (stream) {
                    await stream.close();
                }

                setStarted(false);
                setMuted(true);
                setRenderViaSubscription(false);

                setCaption(
                    "Hit the Play button to connect! Captions will appear here"
                );
            }

            setConnecting(false);
        } else {
            console.log("Already connecting...");
        }
    };

    const changeMicState = handleMicEvent(setMuted, setMuting, setCaption);

    // useEffect(() => {
    //     if (started) {
    //         symbl.modifyRequest(stream, useOpus ? 'opus' : 'LINEAR16')
    //     }
    // }, [useOpus]);

    return (
        <div className="App">
            <header className="App-header">
                <Stack spacing={2}>
                    <Stack
                        spacing={2}
                        direction="row"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Fab
                            style={{
                                backgroundColor: !started
                                    ? "#283643"
                                    : !muted
                                    ? "#4caf50"
                                    : "#f50057",
                            }}
                            aria-label="mic"
                            disabled={!started || muting}
                            onClick={() => {
                                changeMicState(muted, muting);
                            }}
                        >
                            {muted ? <MicOffIcon /> : <MicIcon />}
                        </Fab>
                        <Fab
                            color="primary"
                            arial-label="Start/Stop Captions"
                            onClick={() => {
                                handleStartClick();
                            }}
                            disabled={connecting}
                        >
                            {started ? <StopIcon /> : <PlayArrowIcon />}
                        </Fab>
                        <FormGroup>
                            <FormControlLabel
                                style={{ color: "#FFFFFF" }}
                                control={<GreenSwitch />}
                                checked={renderViaSubscription}
                                onChange={(e) => {
                                    handleSubscribeClick(e);
                                }}
                                disabled={connecting || !started || subscribing}
                                label={renderViaSubscription ? "Subscribed" : "Not Subscribed"}
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormControlLabel
                                style={{ color: "#FFFFFF" }}
                                control={<GreenSwitch />}
                                checked={useOpus}
                                onChange={(e) => {
                                    setUseOpus(!useOpus);
                                }}
                                disabled={started}
                                label={useOpus ? "Using Opus" : "Not Using Opus"}
                            />
                        </FormGroup>
                    </Stack>
                    <Stack spacing={2} direction="row">
                        <Box
                            component="div"
                            sx={{
                                whiteSpace: "normal",
                                my: 5,
                                bgcolor: "#0b1a29",
                                padding: 2,
                                fontSize: "1.3rem",
                            }}
                        >
                            {caption}
                        </Box>
                    </Stack>
                </Stack>
            </header>
        </div>
    );
}

(async () => {
    await initSDK();
})();

export default App;
