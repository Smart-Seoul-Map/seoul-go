# AppResponsivePanel

화면 너비가 `--sg-breakpoint-md` 이상이면 좌우 패널, 미만이면 바텀시트로 표시한다. 화면 크기가 바뀌어도 본문과 입력 상태를 유지한다.

```tsx
import { AppButton } from "@shared/ui/button";
import { AppResponsivePanel } from "@shared/ui/responsive-panel";

<AppResponsivePanel.Root
  sidePanelRootProps={{ direction: "left", size: "small" }}
  bottomSheetRootProps={{ handleOnly: true, snapPoints: [0.5, 0.9] }}
>
  <AppResponsivePanel.Trigger asChild>
    <AppButton>상세 정보</AppButton>
  </AppResponsivePanel.Trigger>
  <AppResponsivePanel.Content title="장소 상세" showHandle>
    <AppResponsivePanel.Body>본문</AppResponsivePanel.Body>
    <AppResponsivePanel.Footer>
      <AppResponsivePanel.CloseButton>닫기</AppResponsivePanel.CloseButton>
    </AppResponsivePanel.Footer>
  </AppResponsivePanel.Content>
</AppResponsivePanel.Root>;
```

## 상태와 접근성

- `open`, `onOpenChange`로 제어하거나 `defaultOpen`으로 내부 상태를 사용한다.
- `onOpenChange(open, { reason })`는 trigger, closeButton, escapeKeyDown, interactOutside, drag를 구분한다.
- `modal` 기본값은 true다. 배경의 포커스/스크롤을 막고 패널 내부로 포커스를 제한하며 닫힌 뒤 이전 요소로 복원한다. false면 배경과 함께 조작할 수 있다.
- `dismissible` 기본값은 true다. false면 Escape, 배경 클릭, 드래그 닫기가 제한된다. 명시적 CloseButton과 외부 상태 변경은 가능하다.
- `title`은 필수다. `hideTitle`로 화면에서 숨겨도 접근성 이름을 유지한다.
- `Trigger asChild`의 자식은 HTML 속성 및 이벤트를 실제 버튼으로 전달해야 한다. AppButton과 네이티브 button을 지원한다.
- `skipAnimation` 및 운영체제의 모션 줄이기 설정을 지원한다.

## 화면별 옵션

- `sidePanelRootProps`: presentation(attached/floating, 기본 attached), direction(left/right, 기본 right), size(small/medium/large, 기본 medium), modal, dismissible.
- `presentation: "floating"`은 데스크톱 외형만 변경한다. 화면 가장자리 여백, 내용 높이, 테두리, 모서리와 그림자를 적용하고 긴 본문은 화면 안에서 스크롤한다. 모달, 포커스, 닫기 규칙은 변경하지 않는다. 모바일에서는 이 옵션과 관계없이 기존 바텀시트를 사용한다.
- 떠 있는 패널 외형은 `--sg-panel-floating-*` 토큰으로 조정한다. `useResponsivePanelPresentation()`은 외형과 관계없이 데스크톱에서 `side-panel`, 모바일에서 `bottom-sheet`를 반환한다.
- 기본 너비는 480/720/960px이며 Content의 width/maxWidth로 덮어쓸 수 있다.
- `bottomSheetRootProps`: modal, dismissible, headerAlign(left/center), handleOnly, skipAnimation, snapPoints, activeSnapPoint, setActiveSnapPoint, fadeFromIndex, closeThreshold, onDrag, onRelease, closeOnEscape, closeOnInteractOutside, lazyMount, unmountOnExit.
- 스냅 포인트는 작은 순서로 전달한다. `"300px"`은 픽셀, `0.5`는 뷰포트 높이의 절반이다. 최대 높이는 `--sg-panel-sheet-max-height`에 제한된다.
- 스냅 포인트에는 `showHandle`을 함께 사용한다. 핸들 클릭으로 다음 높이로 이동하고 마지막 높이에서는 첫 높이로 돌아온다.
- 드래그는 세로 이동 의도를 확인한 뒤 시작하고, 가장 가까운 스냅에 정착한다. 최저 높이에 `closeThreshold`를 곱한 높이보다 아래로 내리면 닫는다. `closeThreshold`는 0~1 비율이며 기본값은 0.5다.
- `closeOnEscape`, `closeOnInteractOutside`는 모바일 바텀시트의 닫힘 입력을 개별로 끌 수 있다. 기본값은 true다.
- `lazyMount`는 처음 열릴 때까지 내용을 만들지 않고, `unmountOnExit`는 닫힌 뒤 DOM에서 제거한다. 둘 다 기본값은 true다.
- 본문이 이미 스크롤된 상태 또는 입력 요소에서 시작한 제스처는 드래그로 가로채지 않는다. handleOnly는 showHandle과 함께 사용할 때 핸들에서만 드래그한다.
- `Body`의 maxHeight, className, style로 내부 스크롤 영역을 조정하고 `Footer`에는 자유롭게 액션을 조립한다.

공통 색상/크기/모션 값은 `src/shared/styles/tokens.css`의 `--sg-panel-*` 토큰으로 관리한다. 장소 전용 콘텐츠는 `features/places/presentation`에 둔다.
