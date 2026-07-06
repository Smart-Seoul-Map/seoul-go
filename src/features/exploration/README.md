# Exploration Feature

## 책임

- 지도 위 탐색 화면.
- 시작 반경과 확장 단계.
- 캐릭터 이동과 장소 도착 판정.
- GLB 캐릭터 모델 설정.

## 진입점

- `ExplorationPage`
- `ExplorationMap`

## 주요 규칙

- `domain/`은 지도나 React에 의존하지 않는다.
- 캐릭터 이동은 매 프레임 React state로 관리하지 않는다.
- 규칙 변경 시 같은 폴더의 Vitest 테스트를 먼저 갱신한다.
