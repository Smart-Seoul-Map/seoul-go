import { useCallback, useEffect, useRef, useState } from "react";

type UseWheelDistrictSelectionOptions = {
  districtCount: number;
  getDistrict: (index: number) => WheelDistrictResult | null;
  topPointerPrizeOffset: number;
};

export type WheelDistrictResult = {
  id: number;
  name: string;
};

const resultRevealDelayMs = 120;

export function useWheelDistrictSelection({
  districtCount,
  getDistrict,
  topPointerPrizeOffset,
}: UseWheelDistrictSelectionOptions) {
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [result, setResult] = useState<WheelDistrictResult | null>(null);
  const resultFrameRef = useRef<number | null>(null);
  const resultTimerRef = useRef<number | null>(null);
  const selectedResultRef = useRef<WheelDistrictResult | null>(null);

  const clearPendingResultReveal = useCallback(() => {
    if (resultFrameRef.current !== null) {
      window.cancelAnimationFrame(resultFrameRef.current);
      resultFrameRef.current = null;
    }

    if (resultTimerRef.current !== null) {
      window.clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }, []);

  const spin = useCallback(() => {
    if (mustSpin || districtCount === 0) {
      return;
    }

    clearPendingResultReveal();

    const nextDistrictIndex = Math.floor(Math.random() * districtCount);
    const nextPrizeNumber = (nextDistrictIndex + topPointerPrizeOffset) % districtCount;

    selectedResultRef.current = getDistrict(nextDistrictIndex);
    setPrizeNumber(nextPrizeNumber);
    setResult(null);
    setMustSpin(true);
  }, [clearPendingResultReveal, districtCount, getDistrict, mustSpin, topPointerPrizeOffset]);

  const finishSpin = useCallback(() => {
    const selectedResult = selectedResultRef.current;

    setMustSpin(false);
    resultFrameRef.current = window.requestAnimationFrame(() => {
      resultFrameRef.current = null;
      resultTimerRef.current = window.setTimeout(() => {
        resultTimerRef.current = null;
        setResult(selectedResult);
      }, resultRevealDelayMs);
    });
  }, []);

  const closeResult = useCallback(() => {
    setResult(null);
  }, []);

  useEffect(
    () => () => {
      clearPendingResultReveal();
    },
    [clearPendingResultReveal]
  );

  return {
    closeResult,
    finishSpin,
    mustSpin,
    prizeNumber,
    result,
    spin,
  };
}
