interface RealtimeUser {
    userId: string;
    name: string;
    id: string;
}

interface RawSpeechPayload {
    words: {
        word: string;
        startTime: {
            seconds: string;
            nanos: string;
        };
        endTime: {
            seconds: string;
            nanos: string;
        };
    };
    transcript: string;
    confidence: number;
}

interface RealtimeSpeechData {
    type: string;
    isFinal: boolean;
    payload: {
        raw: {
            alternatives: RawSpeechPayload[];
        };
    };
    punctuated: {
        transcript: string;
    };
    user: RealtimeUser;
}

interface RealtimeMessageData {
    from: RealtimeUser;
    payload: {
        content: string;
        contentType: string;
    };
    id: string;
    channel: {
        id: string;
    };
    metadata: {
        disablePunctuation: boolean;
        timezoneOffset: number;
        originalContent: string;
        words: string;
        originalMessageId: string;
    };
    dismissed: boolean;
    duration: {
        startTime: string;
        endTime: string;
    };
}

interface RealtimeInsightData {
    id: string;
    confidence: number;
    messageReference: {
        id: string;
    };
    hints: {
        key: string;
        value: string;
    }[];
    type: string;
    assignee: RealtimeUser;
    dueBy: {
        value: string;
    };
    tags: {
        type: string;
        text: string;
        beginOffset: number;
        value: {
            value: any;
        };
    }[];
    dismissed: boolean;
    payload: {
        content: string;
        contentType: string;
    };
    from: RealtimeUser;
}

interface RealtimeTopicData {
    id: string;
    messageRefereces: {
        id: string;
        relation: string;
    }[];
    phrases: string;
    rootWords: {
        text: string;
    }[];
    socre: number;
    type: string;
}

interface RealtimeHandlers {
    onSpeechDetected?: (speechData: RealtimeSpeechData[]) => void;
    onMessageResponse?: (messageData: RealtimeMessageData[]) => void;
    onInsightResponse?: (insightData: RealtimeInsightData[]) => void;
    onTopicResponse?: (topicData: RealtimeTopicData[]) => void;
    onDataReceived?: (data: unknown) => void;
}

interface RealtimeOptionsConfig {
    meetingTitle?: string;
    confidenceThreshold?: number;
    timezoneOffset?: number;
    languageCode?: string;
    sampleRateHertz?: number;
    basePath?: string;
    id?: string;
    handlers?: RealtimeHandlers;
}

interface SymblRealtimeConfig {
    id: string;
    insightTypes?: Array<string>;
    config?: RealtimeOptionsConfig;
    speaker?: RealtimeUser;
    handlers?: RealtimeHandlers;
}

interface SymblRealtimeConnection {
    conversationId: string;
    sendAudio: (audioData: unknown) => void;
    stop: () => void;
}

interface SessionOptions {
    options: {
        reconnectOnError: boolean;
        handlers: {
            onSubscribe: (arg?: any) => void;
            onReconnectFail?: (arg?: any) => void;
            onClose?: (arg?: any) => void;
        }
    }
    id: string;
    basePath?: string;
    isStreaming: boolean;
}