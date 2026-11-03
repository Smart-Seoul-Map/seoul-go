import guideStep1Url from "../../../assets/entry-exploration/guide-step1.png";
import guideStep2Url from "../../../assets/entry-exploration/guide-step2.png";
import guideStep3Url from "../../../assets/entry-exploration/guide-step3.png";

import type { ENTRY_GUIDE_MESSAGES } from "./entryGuideMessages";

type EntryGuideStepTextKey = keyof typeof ENTRY_GUIDE_MESSAGES.firstEntryGuide.stepText;

export type EntryGuideStep = {
  id: string;
  image: string;
  title: EntryGuideStepTextKey;
  tip: EntryGuideStepTextKey;
};

// 첫 진입 가이드 단계. 오버레이 틀은 하나이고, 다음 단계는 이미지와 문구 키를 이 배열에 더한다.
export const ENTRY_GUIDE_STEPS: readonly EntryGuideStep[] = [
  { id: "move", image: guideStep1Url, title: "moveTitle", tip: "moveTip" },
  { id: "number", image: guideStep2Url, title: "numberTitle", tip: "numberTip" },
  { id: "dart", image: guideStep3Url, title: "dartTitle", tip: "dartTip" },
];
