# AppBox

스타일 토큰을 props로 조합하는 기본 레이아웃 요소입니다. 기본 배경, 그림자,
카드 모서리를 강제하지 않습니다. 패널의 열기/닫기 동작은 담당하지 않습니다.

```tsx
<AppBox
  bg="bg.surfacePaper"
  borderColor="stroke.weak"
  borderWidth="strokeWidth.surface"
  borderRadius="radius.4_5"
  boxShadow="shadow.raised"
  padding={{ base: "spacing.3", md: "spacing.6" }}
>
  장소 설명
</AppBox>
```

## API

- 외형: `background`/`bg`, `color`, `borderColor`, `borderWidth`, 각 방향
  `borderTopWidth` 등, `borderRadius`, 각 모서리 `borderTopLeftRadius` 등, `boxShadow`.
- 그라데이션: `backgroundGradient`/`bgGradient` (색상 stop 목록 또는 CSS 변수),
  `backgroundGradientDirection`/`bgGradientDirection`. 배경색을 함께 지정하면 배경색 우선.
- 크기: `width`, `minWidth`, `maxWidth`, `height`, `minHeight`, `maxHeight`.
- 여백: `padding`/`p`, `paddingX`/`px`, `paddingY`/`py`, 각 방향과 `pt/pr/pb/pl`.
- 바깥 여백: `margin`/`m`, `marginX`/`mx`, `marginY`/`my`, 각 방향과 `mt/mr/mb/ml`.
- 음수 여백: `bleed`, `bleedX`, `bleedY`, 각 방향. `asPadding`은 같은 방향의
  현재 내부 여백을 음수로 사용합니다. margin 계열과 동시에 쓰지 않습니다.
- 배치: `display`, `position`, `top/right/bottom/left`, `overflowX/Y`, `zIndex`.
- Flex: `flexGrow`, `flexShrink`, `flexDirection`, `flexWrap`, `justifyContent`,
  `justifySelf`, `alignItems`, `alignContent`, `alignSelf`, `gap`.
- Grid 자식: `gridColumn`, `gridRow`. `gridArea` 전용 prop은 없습니다.
- 기타: `unstable_transform`, `_active={{ bg: "bg.brandPressed" }}`.
- `as`: 기본 div를 다른 HTML 요소/컴포넌트로 변경.
- `asChild`: 단일 자식에 속성, 클래스, 스타일, 이벤트, ref를 합성. 자식 컴포넌트는
  DOM까지 props와 ref를 전달해야 합니다. 자식 이벤트 다음 부모 이벤트가 호출됩니다.
- native HTML 속성, `style`, `className`, React 19의 ref를 지원합니다.

## 토큰

`bg.surfacePaper`는 `var(--sg-color-bg-surface-paper)`, `text.muted`는
`var(--sg-color-text-muted)`, `spacing.4`는 `var(--sg-spacing-4)`로 연결됩니다.
지원 영역은 `bg`, `text`, `stroke`, `strokeWidth`, `spacing`, `radius`, `shadow`,
`gradient`입니다. 소수 단계는 `spacing.1_5`처럼 기존 CSS 변수 표기를 따릅니다.
존재하는 토큰만 사용하세요. Box가 새로운 토큰 값을 자동으로 만들지는 않습니다.
CSS 리터럴과 `var(--sg-...)`도 전달할 수 있지만 제품 스타일은 기존 토큰을 우선합니다.
`full`은 `100%`, 숫자 0은 `0px`입니다. 위아래 padding의 `safeArea`도 지원합니다.
프로젝트에 gradient 토큰은 아직 없으므로 필요한 디자인이 생기면 먼저 정의합니다.

## 반응형과 우선순위

`base: 0`, `sm: 480`, `md: 768`, `lg: 1280`, `xl: 1440`px의 mobile-first CSS입니다.
크기, padding, margin, bleed, display, flexDirection, gap은 breakpoint 객체를 받습니다.
지정하지 않은 단계는 작은 화면의 값을 이어받습니다. 렌더링 중 viewport를 읽거나
resize 리스너를 등록하지 않습니다. 중첩 Box는 부모의 레이아웃 값을 상속하지 않습니다.

`hideFrom="md"`는 md display에 none을 설정합니다. xl display를 명시하면 xl에서 다시
표시할 수 있습니다. 변경 시 CSS 미디어쿼리와 tokens.css의 breakpoint를 함께 맞춥니다
(일반 CSS 변수는 미디어쿼리 조건에서 사용할 수 없습니다).

padding/margin의 긴 이름은 같은 단축 이름보다 우선합니다. 방향별 값 > 축별 값 > 전체 값
순으로 적용됩니다. `style`의 직접 CSS 속성과 화면의 CSS 클래스로 외형을 덮어쓸 수 있습니다.
asChild에서는 자식의 스타일과 일반 속성이 우선하고, ref는 양쪽 모두 연결합니다.

## 구현 범위

공식 Box 공개 API와 반응형/조합 동작을 참고한 독립 구현입니다. 패키지 의존성이나
원본 내부 구현을 복사하지 않았습니다. 토큰 이름과 실제 디자인 값은 우리 프로젝트의
tokens.css를 따르므로 원본 디자인 토큰과 동일한 외형을 보장하는 컴포넌트는 아닙니다.
참고한 API 기준: 공식 저장소 commit `a54913684c28e07d22aa7901767c36797ca5cfbd`의 Box,
스타일 처리기 및 MCP의 Box/Responsive Design 문서. 외부 구현과 전체 브라우저에서의
완전한 동등성을 검증했다는 의미는 아닙니다.
