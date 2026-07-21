import * as THREE from "three";
import { describe, expect, test, vi } from "vitest";

import {
  playCharacterAnimationClips,
  stopCharacterAnimationActions,
} from "./characterAnimationPlayer";

describe("characterAnimationPlayer", () => {
  test("stops active animation actions", () => {
    const stop = vi.fn();

    stopCharacterAnimationActions([{ stop } as unknown as THREE.AnimationAction]);

    expect(stop).toHaveBeenCalledOnce();
  });

  test("plays clips and applies animation time scale", () => {
    const action = {
      play: vi.fn().mockReturnThis(),
      reset: vi.fn().mockReturnThis(),
      timeScale: 1,
    };
    const mixer = {
      clipAction: vi.fn(() => action),
    } as unknown as THREE.AnimationMixer;
    const clip = { name: "run" } as THREE.AnimationClip;

    const actions = playCharacterAnimationClips(mixer, [clip], 1.6);

    expect(mixer.clipAction).toHaveBeenCalledWith(clip);
    expect(action.reset).toHaveBeenCalledOnce();
    expect(action.play).toHaveBeenCalledOnce();
    expect(actions).toEqual([action]);
    expect(action.timeScale).toBe(1.6);
  });
});
