import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

export function createCharacterSpeechAnchor(): CSS2DObject {
  const element = document.createElement("div");
  element.style.paddingBottom = "var(--sg-spacing-4)";
  const anchor = new CSS2DObject(element);
  anchor.center.set(0.5, 1);

  return anchor;
}
