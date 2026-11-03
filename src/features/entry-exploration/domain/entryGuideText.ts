export type EntryGuideTextSegment = {
  text: string;
  isHighlighted: boolean;
};

// split에 캡처 그룹을 주면 [[ ]] 안쪽 글자가 홀수 번째 조각으로 남는다.
const HIGHLIGHT_PATTERN = /\[\[(.+?)\]\]/s;

// 가이드 문구에서 [[ ]]로 감싼 부분만 강조 조각으로 나눈다. 화면은 조각을 요소로 그려 HTML을 해석하지 않는다.
export function splitEntryGuideHighlights(text: string): EntryGuideTextSegment[] {
  return text
    .split(HIGHLIGHT_PATTERN)
    .map((part, index) => ({ text: part, isHighlighted: index % 2 === 1 }))
    .filter((segment) => segment.text !== "");
}
