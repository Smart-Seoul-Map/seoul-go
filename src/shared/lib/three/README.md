# 아틀라스 오브젝트 재사용

아틀라스는 여러 그림을 담은 PNG와 각 그림의 픽셀 영역을 기록한 JSON의 조합이다.
공통 코드는 JSON 영역으로 UV를 계산하고, 원본 비율을 유지하는 Three.js 평면을 만든다.
한 생성 그룹 안의 오브젝트는 텍스처와 재질을 공유한다. 같은 그림을 여러 위치에 배치할 수도 있다.

## 책임 구분

| 코드                                                                         | 책임                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| `src/shared/lib/three/textureAtlas.ts`                                       | 픽셀 영역을 UV로 변환하고 하단 중앙이 원점인 평면 생성   |
| `src/shared/lib/three/atlasScenery.ts`                                       | 텍스처 로딩, 오브젝트 배치, GPU 자원 정리                |
| `src/shared/lib/three/useAtlasScenery.ts`                                    | React에서 부모 씬에 그룹 추가 및 제거                    |
| `src/features/entry-exploration/config/entryExplorationAtlasObjects.ts`      | 인트로 오브젝트 종류, 폭, 상대 위치                      |
| `src/features/entry-exploration/application/entryExplorationAtlasScenery.ts` | 인트로 설정을 공통 형식으로 변환하고 한옥·타워 동선 배치 |

공통 코드는 특정 에셋, 카메라 각도, 도착 판정, 자치구·지하철을 알지 않는다.
다른 페이지에서는 자기 에셋과 배치 설정을 전달한다. 인트로 에셋의 실제 파일은
`src/assets/entry-exploration/intro-atlas.png`와 `intro-atlas.json`이다.

## React에서 사용

아래 `atlas.png`와 `atlas.json`은 사용하는 화면의 에셋 경로로 바꾼다.
JSON 형식은 `{ size: { width, height }, frames: { house: { x, y, width, height } } }`이다.

```tsx
import { useMemo } from "react";
import type { Object3D, Quaternion } from "three";

import type { AtlasSceneryOptions } from "@shared/lib/three/atlasScenery";
import { useAtlasScenery } from "@shared/lib/three/useAtlasScenery";

import atlasUrl from "./atlas.png";
import manifest from "./atlas.json";

const placements = [
  {
    key: "house",
    name: "grid-house-1",
    width: 4,
    position: { x: 0, y: 0.06, z: 5 },
  },
] as const;

type Props = {
  scene: Object3D | null;
  facing: Quaternion;
};

export function GridScenery({ scene, facing }: Props) {
  const options = useMemo(
    () => ({ atlasUrl, manifest, placements, facing }) satisfies AtlasSceneryOptions<"house">,
    [facing]
  );

  useAtlasScenery(scene, options);

  return null;
}
```

- `scene`: 이미 생성한 Three.js Scene 또는 Group. 준비 전에는 `null`을 전달한다.
  생성이 끝나면 state/props로 전달해 다시 렌더링한다. `ref.current`만 변경하면 훅이 실행되지 않는다.
- `key`: JSON `frames`의 키. `name`은 씬에서 찾을 오브젝트 이름이며 그룹 안에서 고유하게 정한다.
- `width`: 화면 픽셀이 아닌 Three.js 월드 단위. 높이는 이미지 종횡비에 따라 정해진다.
- `position`: 부모 그룹 기준 좌표. 이미지의 하단 중앙을 이 위치에 놓는다.
- `facing`: 평면의 회전. 고정 카메라에서는 `camera.quaternion.clone()`을 준비 시점에 사용할 수 있다.
  카메라 이동을 자동으로 추적하는 billboard는 아니다.
- `options`: 모듈 상수 또는 `useMemo`로 참조를 유지한다. 참조가 바뀌면 기존 그룹을 정리하고 재생성한다.
  내부 배열이나 Quaternion을 직접 수정해도 재생성되지는 않는다.
- 부모 변경, 옵션 변경, 언마운트 시 훅이 그룹을 제거하고 geometry/material/texture를 해제한다.
  호출부에서 같은 자원을 다시 해제하지 않는다.
- 로딩 실패 시 그룹을 숨긴다. 오류 표시가 필요하면 안정된 `onLoadError` 콜백을 옵션에 전달한다.

## 기존 씬 초기화 코드에서 사용

인트로처럼 하나의 effect 안에서 씬을 만들고 애니메이션 루프와 정리까지 관리한다면,
그 effect 내부에서는 React 훅 대신 공통 생성 함수를 사용한다.

```ts
import { createAtlasScenery } from "@shared/lib/three/atlasScenery";

const scenery = createAtlasScenery(options);
scene.add(scenery.object);

// 필요한 경우 개별 오브젝트 위치를 변경한다.
scenery.object.getObjectByName("grid-house-1")?.position.set(2, 0.06, 8);

// 씬 종료 시 호출한다. 부모에서 제거하는 동작도 포함한다.
scenery.dispose();
```

`useAtlasScenery`도 내부에서 이 생성 함수를 사용한다. 같은 씬에 같은 배치를 함수와 훅으로
동시에 추가하면 중복 표시되므로 둘 중 해당 화면의 생명주기에 맞는 방법을 선택한다.
훅은 renderer, camera, 애니메이션 루프를 생성하거나 소유하지 않는다.

## 인트로 페이지 책임 분리

- `useEntryExplorationIntro`: 씬 준비 여부, 시작 동작, 시작 오버레이 표시 상태.
- `useEntryExplorationPlacePanel`: 장소별 방문 컨트롤러, 활성 장소, 패널 상태와 닫기 연결.
- `EntryExplorationPage`: 위 훅과 기존 씬·자치구·지하철 훅을 연결하고 화면과 라우팅을 조합.

페이지가 장소별 반경과 다른 장소의 닫힘 이벤트 처리까지 알 필요가 없도록 관련 코드를 모았다.
`AppBox`와 HTML 태그의 혼용은 역할 분리 기준이 아니므로 태그마다 래퍼를 만들지 않았다.

## 확인 방법

관련 자동 검증은 아래 명령으로 실행한다.

```bash
pnpm run test:run -- src/shared/lib/three/atlasScenery.test.ts src/shared/lib/three/useAtlasScenery.test.tsx src/features/entry-exploration/application/entryExplorationAtlasScenery.test.ts src/features/entry-exploration/presentation/EntryExplorationPage.test.tsx
```

수동으로는 탐방 시작, 기존 오브젝트 배치, 한옥·타워 도착 패널, 화면을 나갔다 돌아왔을 때
오브젝트 중복 여부를 확인한다. 실제 WebGL 렌더링과 전체 E2E는 단위 테스트와 별도로 확인한다.
