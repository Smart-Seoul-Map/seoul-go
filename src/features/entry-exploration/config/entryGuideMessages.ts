// 인트로 가이드 문구(해치 대사·토스트·첫 진입 가이드·번호 안내)를 한곳에 모은다. 다국어를 붙일 때 이 파일을 사전으로 옮긴다.
export const ENTRY_GUIDE_MESSAGES = {
  speech: {
    intro: "서울에디션25의 특별한 장소를 찾아 탐방을 시작해 볼까?",
    firstNumber: (numbers: readonly number[]): string =>
      `${numbers.map((number) => `${number}번`).join(", ")}을 얻었어! 이제 지도에서 이 번호 줄에 다트를 던질 수 있어.`,
  },
  toast: {
    numberRequired: "장소를 방문해 번호를 모으면, 그 번호 줄에 다트를 던질 수 있어요",
    numberReward: "번호를 추가했어요",
    numberRewardAction: "다트게임하기",
  },
  // 첫 진입 가이드 오버레이. 줄바꿈은 \n, 강조는 [[ ]], {pointerAction}은 기기에 따라 클릭·터치로 바꾼다.
  firstEntryGuide: {
    next: "다음",
    confirm: "확인",
    pointerAction: { mouse: "클릭", touch: "터치" },
    stepText: {
      moveTitle: "지도를 {pointerAction}해 이동하고\n장소를 확인해 보세요!",
      moveTip: "Tip! [[근처 추천 장소]]에서 1km 안의\n테마 장소를 바로 볼 수 있어요!",
      numberTitle: "장소를 확인하면\n번호를 두 개 받아요!",
      numberTip: "Tip! 번호는 격자지도의 줄 번호예요.\n[[모은 줄]]에만 다트를 던질 수 있어요!",
      dartTitle: "번호 줄에 다트를 던져\n자치구를 추첨해 보세요!",
      dartTip: "Tip! 다트가 꽂힌 칸의 [[자치구]]가 확정되면\n그곳에서 탐색을 시작해요!",
    },
  },
  // 내 번호의 "!"로 여는 번호 안내 팝업. 격자번호가 무엇인지 설명한다.
  numberGuide: {
    title: "번호 안내",
    heroAlt: "서울을 1km의 작은 격자로 나누고, 가로 세로를 지정하기 위해 사용하는 번호예요.",
    heroCaption: "격자마다 서로 다른 번호를 부여해요.",
    clueLead: "장소를 방문해 얻은 번호는",
    cluePrefix: "서울탐방GO에서 ",
    clueAccent: "탐방할 위치를 찾는 단서",
    clueSuffix: "예요!",
    nationalPointTitle: "실제 국가지점번호도 알아볼까요?",
    nationalPointDescription:
      "국토를 10m 간격의 격자로 구분해 위치를 표시하는 국가 주소정보체계예요.",
  },
} as const;
