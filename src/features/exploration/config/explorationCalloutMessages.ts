export const EXPLORATION_CALLOUT_MESSAGES = {
  initial: {
    message: "서울 시민이 뽑은 장소가 표시됩니다.",
    description: "가까운 장소부터 자유롭게 탐방해 보세요.",
  },
  linked: {
    message: "근처에 함께 가볼 만한 장소를 찾았어요.",
    reference: (placeName: string): string => `${placeName} 기준 · 반경 1km`,
  },
} as const;
