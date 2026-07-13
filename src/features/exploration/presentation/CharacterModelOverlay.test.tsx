import { render, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  CHARACTER_MODEL_MANIFEST,
  type CharacterModelKey,
} from "../config/explorationCharacterModels";
import { CharacterModelOverlay } from "./CharacterModelOverlay";

const threeMock = vi.hoisted(() => ({
  createClonedScene: vi.fn(),
  cloneSkeleton: vi.fn(),
  disposeGeometry: vi.fn(),
  load: vi.fn(),
  renderers: vi.fn(),
  animationActions: [] as Array<{
    play: () => unknown;
    reset: () => unknown;
    stop: () => void;
    timeScale: number;
  }>,
  sceneAdds: [] as unknown[],
  sourceScene: undefined as unknown,
}));

vi.mock("three", () => {
  class Object3D {
    position = { set: vi.fn() };
    rotation = { y: 0 };
    scale = { setScalar: vi.fn() };
    add = vi.fn((value: unknown) => {
      threeMock.sceneAdds.push(value);
    });
    traverse = vi.fn();
  }

  class Mesh extends Object3D {
    geometry = { dispose: threeMock.disposeGeometry };
    traverse = vi.fn((callback: (value: unknown) => void) => {
      callback(this);
    });
  }

  threeMock.createClonedScene.mockImplementation(() => new Mesh());

  return {
    AnimationMixer: class {
      clipAction = vi.fn(() => {
        const action = {
          play: vi.fn().mockReturnThis(),
          reset: vi.fn().mockReturnThis(),
          stop: vi.fn(),
          timeScale: 1,
        };

        threeMock.animationActions.push(action);

        return action;
      });
      update = vi.fn();
    },
    Box3: class {
      setFromObject = vi.fn().mockReturnThis();
      getSize = vi.fn((size: { x: number; y: number; z: number }) => {
        size.x = 1;
        size.y = 1;
        size.z = 1;
      });
    },
    DirectionalLight: class extends Object3D {},
    HemisphereLight: class extends Object3D {},
    Mesh,
    PerspectiveCamera: class extends Object3D {
      aspect = 1;
      lookAt = vi.fn();
      updateProjectionMatrix = vi.fn();
    },
    Scene: class extends Object3D {},
    Vector3: class {
      x = 0;
      y = 0;
      z = 0;
    },
    WebGLRenderer: class {
      domElement = document.createElement("canvas");
      constructor(options: unknown) {
        threeMock.renderers(options);
      }
      dispose = vi.fn();
      forceContextLoss = vi.fn();
      render = vi.fn();
      setClearColor = vi.fn();
      setPixelRatio = vi.fn();
      setSize = vi.fn();
    },
  };
});

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    load = threeMock.load;
  },
}));

vi.mock("three/examples/jsm/utils/SkeletonUtils.js", () => ({
  clone: threeMock.cloneSkeleton,
}));

function renderCharacter(modelKey: CharacterModelKey, headingRadians = 0): ReactElement {
  return <CharacterModelOverlay headingRadians={headingRadians} modelKey={modelKey} />;
}

describe("CharacterModelOverlay", () => {
  beforeEach(() => {
    vi.stubGlobal("WebGLRenderingContext", class {});
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1)
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    threeMock.createClonedScene.mockClear();
    threeMock.cloneSkeleton.mockReset();
    threeMock.cloneSkeleton.mockImplementation((scene: { clone: () => unknown }) => scene.clone());
    threeMock.disposeGeometry.mockReset();
    threeMock.load.mockReset();
    threeMock.renderers.mockReset();
    threeMock.animationActions = [];
    threeMock.sceneAdds = [];
    threeMock.load.mockImplementation((url: string, onLoad: (value: unknown) => void) => {
      if (url === CHARACTER_MODEL_MANIFEST.mesh) {
        const clonedScene = threeMock.createClonedScene();
        const scene = {
          clone: vi.fn().mockReturnValue(clonedScene),
          position: { set: vi.fn() },
          rotation: { y: 0 },
          scale: { setScalar: vi.fn() },
          traverse: vi.fn(),
        };

        threeMock.sourceScene = scene;
        onLoad({ scene });
        return;
      }

      onLoad({ animations: [{ name: url }] });
    });
  });

  test("keeps one renderer and uses the original GLB scene for animation scale compatibility", async () => {
    const { rerender } = render(renderCharacter("idlePrimary"));

    rerender(renderCharacter("run"));

    expect(threeMock.renderers).toHaveBeenCalledTimes(1);
    expect(
      threeMock.load.mock.calls.filter(([url]) => url === CHARACTER_MODEL_MANIFEST.mesh)
    ).toHaveLength(1);
    await waitFor(() => {
      expect(threeMock.sceneAdds).toContain(threeMock.sourceScene);
    });
    expect(threeMock.cloneSkeleton).not.toHaveBeenCalled();
  });

  test("does not dispose cached GLB geometry on unmount", async () => {
    const { unmount } = render(renderCharacter("idlePrimary"));

    await waitFor(() => {
      expect(threeMock.sceneAdds.length).toBeGreaterThanOrEqual(3);
    });
    unmount();

    expect(threeMock.disposeGeometry).not.toHaveBeenCalled();
  });

  test("rotates the loaded character model when movement heading changes", async () => {
    const { rerender } = render(renderCharacter("idlePrimary", 0));

    await waitFor(() => {
      expect(threeMock.sceneAdds).toContain(threeMock.sourceScene);
    });

    rerender(renderCharacter("run", Math.PI / 2));

    expect((threeMock.sourceScene as { rotation: { y: number } }).rotation.y).toBe(-Math.PI / 2);
    expect(
      threeMock.load.mock.calls.filter(([url]) => url === CHARACTER_MODEL_MANIFEST.mesh)
    ).toHaveLength(0);
  });

  test("plays the run animation faster than idle without changing movement speed", async () => {
    const { rerender } = render(renderCharacter("idlePrimary"));

    await waitFor(() => {
      expect(threeMock.animationActions.at(-1)?.timeScale).toBe(1);
    });

    rerender(renderCharacter("run"));

    await waitFor(() => {
      expect(threeMock.animationActions.at(-1)?.timeScale).toBeGreaterThan(1);
    });
  });
});
