export const ENTRY_CHARACTER_SPEECH_MESSAGES = {
  intro: "서울에디션25의 특별한 장소를 찾아 탐험을 시작해 볼까?",
  slot: "다트에 필요한 번호를 뽑아보자! 슬롯을 돌려봐!",
} as const;

export type EntryCharacterSpeechKey = keyof typeof ENTRY_CHARACTER_SPEECH_MESSAGES;
