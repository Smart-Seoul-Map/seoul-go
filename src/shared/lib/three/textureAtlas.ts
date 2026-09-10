import * as THREE from "three";

export type TextureAtlasFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function createAtlasPlaneGeometry(
  frame: TextureAtlasFrame,
  atlasSize: { width: number; height: number },
  width: number
): THREE.PlaneGeometry {
  if (
    width <= 0 ||
    frame.width <= 0 ||
    frame.height <= 0 ||
    frame.x < 0 ||
    frame.y < 0 ||
    frame.x + frame.width > atlasSize.width ||
    frame.y + frame.height > atlasSize.height
  ) {
    throw new Error("Invalid texture atlas frame or display width.");
  }

  const height = (width * frame.height) / frame.width;
  const geometry = new THREE.PlaneGeometry(width, height);
  const uv = geometry.getAttribute("uv");
  // Pixel frames use a top-left origin; Three.js UVs use a bottom-left origin.
  for (let index = 0; index < uv.count; index += 1) {
    uv.setXY(
      index,
      (frame.x + uv.getX(index) * frame.width) / atlasSize.width,
      1 - (frame.y + (1 - uv.getY(index)) * frame.height) / atlasSize.height
    );
  }
  geometry.translate(0, height / 2, 0);

  return geometry;
}
