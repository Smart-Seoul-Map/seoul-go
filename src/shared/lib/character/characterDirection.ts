export type CharacterDirection = {
  x: number;
  y: number;
};

export const IDLE_CHARACTER_DIRECTION: CharacterDirection = { x: 0, y: 0 };

export function clampCharacterDirection(direction: CharacterDirection): CharacterDirection {
  const magnitude = Math.hypot(direction.x, direction.y);

  if (magnitude <= 1) {
    return direction;
  }

  return normalizeCharacterDirection(direction);
}

export function normalizeCharacterDirection(direction: CharacterDirection): CharacterDirection {
  const magnitude = Math.hypot(direction.x, direction.y);

  if (magnitude === 0) {
    return IDLE_CHARACTER_DIRECTION;
  }

  return {
    x: direction.x / magnitude,
    y: direction.y / magnitude,
  };
}
