import { describe, expect, test } from "vitest";

import { splitEntryGuideHighlights } from "./entryGuideText";

describe("splitEntryGuideHighlights", () => {
  test("keeps text without markers as one plain segment including its line break", () => {
    expect(splitEntryGuideHighlights("가고 싶은 곳을 클릭해\n해치를 움직여 보세요!")).toEqual([
      { text: "가고 싶은 곳을 클릭해\n해치를 움직여 보세요!", isHighlighted: false },
    ]);
  });

  test("highlights only the words inside [[ ]] and drops the markers", () => {
    expect(splitEntryGuideHighlights("Tip! 건물·동상 같은 [[장소]]로 가면\n어떤 곳인지")).toEqual([
      { text: "Tip! 건물·동상 같은 ", isHighlighted: false },
      { text: "장소", isHighlighted: true },
      { text: "로 가면\n어떤 곳인지", isHighlighted: false },
    ]);
  });

  test("leaves no empty segment when a highlight starts or ends the text", () => {
    expect(splitEntryGuideHighlights("[[강조]]로 시작")).toEqual([
      { text: "강조", isHighlighted: true },
      { text: "로 시작", isHighlighted: false },
    ]);
    expect(splitEntryGuideHighlights("끝은 [[강조]]")).toEqual([
      { text: "끝은 ", isHighlighted: false },
      { text: "강조", isHighlighted: true },
    ]);
  });

  test("splits several and adjacent highlights in order", () => {
    expect(splitEntryGuideHighlights("[[하나]][[둘]] 그리고 [[셋]]")).toEqual([
      { text: "하나", isHighlighted: true },
      { text: "둘", isHighlighted: true },
      { text: " 그리고 ", isHighlighted: false },
      { text: "셋", isHighlighted: true },
    ]);
  });

  test("keeps markup and an unclosed marker as plain text", () => {
    expect(splitEntryGuideHighlights("[[<b>굵게</b>]] 그리고 [[닫히지 않음")).toEqual([
      { text: "<b>굵게</b>", isHighlighted: true },
      { text: " 그리고 [[닫히지 않음", isHighlighted: false },
    ]);
  });
});
