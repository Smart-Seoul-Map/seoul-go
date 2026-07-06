import { describe, expect, test } from "vitest";
import { CHARACTER_MODEL_MANIFEST } from "./explorationCharacterModels";

describe("3D 캐릭터 모델 매니페스트", () => {
  test("기본 메쉬 모델 경로가 올바르다", () => {
    expect(CHARACTER_MODEL_MANIFEST.mesh).toMatch(/^\/models\/.+\.glb$/);
  });

  test("애니메이션 모델 파일들을 모두 가진다", () => {
    const anims = CHARACTER_MODEL_MANIFEST.animations;
    expect(anims).toEqual({
      idlePrimary: "/models/chunsik_idle_01_v1.glb",
      idleSecondary: "/models/chunsik_idle_02_v1.glb",
      run: "/models/chunsik_run_v1.glb",
    });
    // 모든 값이 경로 형식인지 확인
    Object.values(anims).forEach((path) => {
      expect(path).toMatch(/^\/models\/.+\.glb$/);
    });
  });
});
