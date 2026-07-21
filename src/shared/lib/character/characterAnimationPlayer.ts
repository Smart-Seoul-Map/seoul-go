import * as THREE from "three";

export function stopCharacterAnimationActions(actions: readonly THREE.AnimationAction[]): void {
  actions.forEach((action) => {
    action.stop();
  });
}

export function playCharacterAnimationClips(
  mixer: THREE.AnimationMixer,
  clips: readonly THREE.AnimationClip[],
  timeScale: number
): THREE.AnimationAction[] {
  return clips.map((clip) => {
    const action = mixer.clipAction(clip).reset().play();

    action.timeScale = timeScale;

    return action;
  });
}
