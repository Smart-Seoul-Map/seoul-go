import { useCallback, useEffect, useRef, useState } from "react";

type SelectableDistrict = {
  id: number;
  name: string;
};

const totalSelectionSteps = 36;
const initialDelayMs = 28;
const maxDelayMs = 172;
const resultRevealDelayMs = 180;

export function useDistrictSelection(districts: readonly SelectableDistrict[]) {
  const [activeDistrict, setActiveDistrict] = useState<SelectableDistrict | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectableDistrict | null>(null);
  const [result, setResult] = useState<SelectableDistrict | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const selectDistrict = useCallback(() => {
    if (isSelecting || districts.length === 0) {
      return;
    }

    clearTimer();
    setResult(null);
    setSelectedDistrict(null);
    setIsSelecting(true);

    const finalIndex = Math.floor(Math.random() * districts.length);
    const startIndex =
      (finalIndex - totalSelectionSteps + districts.length * totalSelectionSteps) %
      districts.length;
    let step = 0;

    const runStep = () => {
      const isFinalStep = step >= totalSelectionSteps;
      const currentIndex = isFinalStep ? finalIndex : (startIndex + step) % districts.length;
      const currentDistrict = districts[currentIndex] ?? null;

      setActiveDistrict(currentDistrict);

      if (isFinalStep) {
        setSelectedDistrict(currentDistrict);
        setIsSelecting(false);
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          setResult(currentDistrict);
        }, resultRevealDelayMs);
        return;
      }

      step += 1;
      const progress = step / totalSelectionSteps;
      const nextDelay =
        initialDelayMs + Math.round((maxDelayMs - initialDelayMs) * progress * progress);

      timerRef.current = window.setTimeout(runStep, nextDelay);
    };

    runStep();
  }, [clearTimer, districts, isSelecting]);

  const closeResult = useCallback(() => {
    setResult(null);
  }, []);

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer]
  );

  return {
    activeDistrict,
    closeResult,
    isSelecting,
    result,
    selectDistrict,
    selectedDistrict,
  };
}
