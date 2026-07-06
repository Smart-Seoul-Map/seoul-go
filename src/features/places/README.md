# Places Feature

## 책임

- 승인된 스마트서울맵 테마 ID.
- 장소 API 호출과 응답 정규화.
- 장소 이름, 주소, 운영 시간, 설명, 이미지, 좌표 스키마.

## 진입점

- 추후 `placesApprovedThemes`
- 추후 `placesSmartSeoulApi`

## 주요 규칙

- API secret 보호나 CORS 우회가 필요해지면 Cloudflare Pages Functions를 사용한다.
