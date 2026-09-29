export type SlotDigits = readonly [number, number];
export type SlotReelAngles = readonly [number, number, number];

type SlotReelSpin = { from: number; to: number; durationMs: number };
export type EntrySlotSpin = {
  digits: SlotDigits;
  reels: readonly SlotReelSpin[];
  startedAt: number;
};

const FULL_TURN = Math.PI * 2;
const REEL_DURATIONS_MS = [1600, 1800, 2000] as const;
const REEL_TURNS = [4, 5, 6] as const;
const CRUISE_RATIO = 0.3;
export const SLOT_STOP_FEEDBACK_MS = 180;

function getReelProgress(progress: number): number {
  const time = Math.max(0, Math.min(1, progress));
  const brakeRatio = 1 - CRUISE_RATIO;
  const distance = CRUISE_RATIO + brakeRatio / 2;
  if (time <= CRUISE_RATIO) return time / distance;
  const braking = (time - CRUISE_RATIO) / brakeRatio;
  // Integrate a constant speed followed by linear braking, keeping velocity continuous.
  return (CRUISE_RATIO + brakeRatio * (braking - braking ** 2 / 2)) / distance;
}

export function getEntrySlotStopOffset(spin: EntrySlotSpin, time: number): number {
  return spin.reels.reduce((offset, reel) => {
    const elapsed = time - spin.startedAt - reel.durationMs;
    if (elapsed <= 0 || elapsed >= SLOT_STOP_FEEDBACK_MS) return offset;
    const progress = elapsed / SLOT_STOP_FEEDBACK_MS;
    return offset + Math.sin(progress * Math.PI * 4) * (1 - progress) ** 2;
  }, 0);
}

export function getSlotDigitAngle(digit: number): number {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    throw new RangeError("Slot digits must be integers between 0 and 9.");
  }

  // slot_v1: local Z, 10 equal stops; 0 faces the window at +90 degrees.
  return (((90 + digit * 36) % 360) * Math.PI) / 180;
}

export function pickSlotDigits(random: () => number = Math.random): SlotDigits {
  return [Math.floor(random() * 10), Math.floor(random() * 10)];
}

export function createEntrySlotSpin({
  digits,
  from,
  startedAt,
}: {
  digits: SlotDigits;
  from: SlotReelAngles;
  startedAt: number;
}): EntrySlotSpin {
  const stops = [getSlotDigitAngle(digits[0]), 0, getSlotDigitAngle(digits[1])];

  return {
    digits,
    startedAt,
    reels: from.map((angle, index) => ({
      from: angle,
      to:
        angle +
        REEL_TURNS[index] * FULL_TURN +
        ((stops[index] - (angle % FULL_TURN) + FULL_TURN) % FULL_TURN),
      durationMs: REEL_DURATIONS_MS[index],
    })),
  };
}

export function getEntrySlotSpinFrame(spin: EntrySlotSpin, time: number) {
  const elapsed = Math.max(0, time - spin.startedAt);
  const angles = spin.reels.map(
    ({ from, to, durationMs }) => from + (to - from) * getReelProgress(elapsed / durationMs)
  );
  const done = spin.reels.every((reel) => elapsed >= reel.durationMs);

  return {
    angles: [angles[0], angles[1], angles[2]] satisfies SlotReelAngles,
    done,
    result: done ? spin.digits.join("") : null,
  };
}
