# Course Feature

## 책임

- 발견한 장소 스탬프.
- 코스 순서와 메모.
- localStorage persist 상태.

## 진입점

- `createCourseStore`
- `useCourseStore`

## 주요 규칙

- 순수 도메인 규칙은 `domain/`에 둔다.
- 저장소 구현은 `data/`에 둔다.
- 코스 편집 화면은 후순위 이슈에서 `presentation/`에 추가한다.
