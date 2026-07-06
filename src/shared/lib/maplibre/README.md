# MapLibre Shared Library

## 책임

- raster tile style 생성.
- 지도 엔진에 가까운 공용 어댑터.
- 서울고 도메인을 모르는 지도 유틸.

## 주요 규칙

- React 화면 조합은 feature `presentation/`에 둔다.
- 장소, 코스, 캐릭터 같은 도메인 import는 금지한다.
- 스마트서울맵 EPSG:3857 XYZ 타일 URL은 환경 변수에서 주입한다.
