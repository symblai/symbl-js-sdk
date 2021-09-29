import {sdk, SDK, SpeakerEvent} from "../src/index"

test('sdk Exists', () => {
  expect(typeof sdk !== "undefined");
});

test('ClientSDK Exists', () => {
  expect(typeof SDK !== "undefined");
});

test('SpeakerEvent Exists', () => {
  expect(typeof SpeakerEvent !== "undefined");
});

