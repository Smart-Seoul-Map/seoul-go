export const ENTRY_CHARACTER_SPEECH_MESSAGES = {
  intro: "서울에디션25의 특별한 장소를 찾아 탐방을 시작해 볼까?",
} as const;

export type EntryCharacterSpeechKey = keyof typeof ENTRY_CHARACTER_SPEECH_MESSAGES;
