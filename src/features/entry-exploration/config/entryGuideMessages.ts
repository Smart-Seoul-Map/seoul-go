// 인트로 가이드 문구(해치 대사·토스트·번호 안내)를 한곳에 모은다. 다국어를 붙일 때 이 파일을 사전으로 옮긴다.
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
  numberGuide: {
    title: "번호 안내",
    previous: "이전",
    next: "다음",
    finish: "시작하기",
    steps: [
      {
        title: "장소 방문하기",
        description:
          "지도를 눌러 해치를 움직여 보세요. 서울에디션 장소에 다가가면 장소 정보가 열려요.",
      },
      {
        title: "번호 획득",
        description: "장소 정보를 닫으면 그 장소가 있는 칸의 가로·세로 번호 2개를 얻어요.",
      },
      {
        title: "다트로 자치구 정하기",
        description:
          "모은 번호가 붙은 가로·세로 줄에만 다트를 던질 수 있어요. 다트가 꽂힌 칸의 자치구에서 탐방을 시작해요.",
      },
    ],
    heroAlt: "서울을 1km의 작은 격자로 나누고, 가로 세로를 지정하기 위해 사용하는 번호예요.",
    heroCaption: "격자마다 서로 다른 번호를 부여해요.",
    clueLead: "장소를 방문해 얻은 번호는",
    cluePrefix: "서울탐방GO에서 ",
    clueAccent: "탐방할 위치를 찾는 단서",
    clueSuffix: "예요!",
    nationalPointTitle: "실제 국가지점번호도 알아볼까요?",
    nationalPointDescription:
      "국토를 10m 간격의 격자로 구분해 위치를 표시하는 국가 주소정보체계예요.",
    lineTip: "장소를 더 방문할수록 다트를 던질 수 있는 줄이 늘어나요.",
  },
} as const;
