import logo from "./logo.svg";
import "./App.css";

import React from "react";
import { useState } from "react";
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

import { sdk } from "@symblai/symbl-js/build/client.sdk.min.js";

import { v4 } from "uuid";

const AudioContext = window.AudioContext || window.webkitAudioContext;

let stream;
let context, source;

let processor, gainNode, connectionId;

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
                context && context.resume();
                if (stream) {
                    await stream.start(
                        context && context.sampleRate
                            ? {
                                  config: {
                                      sampleRateHertz: context.sampleRate,
                                  },
                              }
                            : {}
                    );
                    window.connectionActive = true;
                    setMuted(false);

                    gainNode.gain.value = 1;
                    setCaption(
                        "You're unmuted. Live captions will appear here..."
                    );
                }
            } else {
                context && context.suspend();
                if (stream) {
                    gainNode.gain.value = 0;
                    await stream.stop();

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
            }

            setMuting(false);
        } else {
            console.log("Already muting");
        }
    };
};

const initSDK = async () => {
    await sdk.init({
        appId: process.env.REACT_APP_APP_ID,
        appSecret: process.env.REACT_APP_APP_SECRET,
        basePath: process.env.REACT_APP_BASE_PATH,
    });
};

const isAppleMicrophone = (device) => {
    return (
        device.label &&
        (device.label.includes("MacBook") ||
            device.label.includes("iPhone") ||
            device.label.includes("iPad"))
    );
};

const getUserMediaStream = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log("All Devices: ", devices);
    let device = devices.filter((device) => isAppleMicrophone(device));
    if (device.length > 0 && window.safari !== undefined) {
        console.log("Detected Safari. Using device: ", device[0]);
        return navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: device[0].deviceId,
            },
            video: false,
        });
    } else {
        try {
            console.log("Not safari");
            const defaultDevice = devices.filter(
                (device) =>
                    device.deviceId === "default" &&
                    device.kind === "audioinput"
            );
            console.log("Default device: ", defaultDevice);
            if (defaultDevice.length > 0) {
                const device = devices.filter(
                    (device) =>
                        device.deviceId !== "default" &&
                        defaultDevice[0].label.includes(device.label) &&
                        device.kind === "audioinput"
                );

                console.log("Default device matches: ", device);

                if (device.length > 0) {
                    console.log(
                        "The device to be used for getting stream: ",
                        device
                    );
                    return navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: device[0].deviceId,
                        },
                        video: false,
                    });
                } else {
                    return navigator.mediaDevices.getUserMedia({
                        audio: true,
                        video: false,
                    });
                }
            } else {
                return navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false,
                });
            }
        } catch (e) {
            console.error(e);
        }
    }
};

const processAudio = async (e) => {
    if (window.connectionActive) {
        const inputData =
            e.inputBuffer.getChannelData(0) ||
            new Float32Array(this.options.bufferSize);

        // console.log(e.inputBuffer);

        const targetBuffer = new Int16Array(inputData.length);
        for (let index = inputData.length; index > 0; index--)
            targetBuffer[index] = 32767 * Math.min(1, inputData[index]);

        stream && stream.sendAudio(targetBuffer);
    }
};

const startAudio = async (muted, muting) => {
    if (!context) {
        context = new AudioContext();

        const audioStream = await getUserMediaStream();
        processor = context.createScriptProcessor(2048, 1, 1);

        source = context.createMediaStreamSource(audioStream);

        gainNode = context.createGain();
        gainNode.gain.value = 0;

        source.connect(gainNode);
        gainNode.connect(processor);
        processor.connect(context.destination);

        processor.onaudioprocess = processAudio;
    }
};

const initiateConnection = async (handlers, sampleRateHertz) => {
    const id = v4();
    console.log(id);

    connectionId = id;

    stream = await sdk.createStream({
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
            sampleRateHertz,
        },
        speaker: {
            userId: process.env.USER_ID || "tanaka@example.com", // Update with valid email or a unique user id
            name: process.env.FULL_NAME || "Tanaka",
        },
        handlers,
    });

    return stream;
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
                await sdk.subscribeToStream(connectionId, (data) => {
//                    console.log(`Subscribe API Data`, data);
                    const { type } = data;

                    if (type === "message_response") {
                        const { messages } = data;

                        // You get any messages here
                        messages.forEach((message) => {
                            sdk.logger.log(
                                `Subscribe Message: ${message.payload.content}`
                            );
                        });
                    } else if (type === "insight_response") {
                        const { insights } = data;

                        // You get any insights here
                        insights.forEach((insight) => {
                            sdk.logger.log(
                                `Subscribe Insight: ${insight.type} - ${insight.text}`
                            );
                        });
                    } else if (type === "topic_response") {
                        const { topics } = data;

                        // You get any topic phrases here
                        topics.forEach((topic) => {
                            sdk.logger.log(
                                `Subscribe Topic detected: ${topic.phrases}`
                            );
                        });
                    } else if (
                        type === "message" &&
                        data.message.hasOwnProperty("punctuated")
                    ) {
                        const { transcript } = data.message.punctuated;

                        // Live punctuated full transcript as opposed to broken into messages
                        sdk.logger.log(
                            `Subscribe Live transcript: ${transcript}`
                        );

                        if (renderViaSubscription) setCaption(transcript);
                    }
                });

                setSubscribing(false);
                setSubscribed(true);
            } else {
                console.log("Already subscribed");
//                setRenderViaSubscription(event.target.checked);
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
                await startAudio(muted, muting);

                await initiateConnection(
                    {
                        onSpeechDetected: (data) => {
                            if (data) {
                                const { punctuated } = data;
                                setCaption(punctuated.transcript);
                            }
                        },

                        onStartedListening: () => {
                            setMuted(false);
                        },
                    },
                    context && context.sampleRate
                );

                setCaption(
                    "You're muted. Click the unmute button to resume captions."
                );
                setStarted(true);
            } else {
                if (stream) {
                    context.close();

                    context = null;
                    gainNode = null;
                    processor = null;

                    await stream.close();

                    stream = null;
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
