import * as THREE from "three";

export function readEntryExplorationTokenColor(tokenName: string): number {
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();

  return (value ? new THREE.Color(value) : new THREE.Color()).getHex();
}
