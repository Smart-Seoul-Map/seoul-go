import { useCallback } from "react";

import { RouletteBackLink } from "@shared/ui/roulette";

import { useWheelDistrictSelection } from "../application/useWheelDistrictSelection";
import { topPointerPrizeOffset, wheelData, wheelDistricts } from "../config/districtWheel";
import "./RouletteTest1Page.css";
import { WheelDistrictRoulette } from "./WheelDistrictRoulette";
import { WheelResultDialog } from "./WheelResultDialog";

export function RouletteTest1Page() {
  const getDistrict = useCallback((index: number) => wheelDistricts[index] ?? null, []);
  const { closeResult, finishSpin, mustSpin, prizeNumber, result, spin } =
    useWheelDistrictSelection({
      districtCount: wheelData.length,
      getDistrict,
      topPointerPrizeOffset,
    });

  return (
    <main className="wheel-roulette-page roulette-shared-page">
      <RouletteBackLink />

      <section className="wheel-roulette-layout" aria-label="자치구 랜덤 룰렛">
        <header className="wheel-roulette-header">
          <p className="wheel-roulette-eyebrow">Random District</p>
          <h1>자치구 랜덤 룰렛</h1>
        </header>

        <WheelDistrictRoulette
          data={wheelData}
          mustSpin={mustSpin}
          onStopSpinning={finishSpin}
          prizeNumber={prizeNumber}
        />

        <button className="wheel-spin-button" type="button" onClick={spin} disabled={mustSpin}>
          {mustSpin ? "돌리는 중" : "룰렛 돌리기"}
        </button>
      </section>

      {result && <WheelResultDialog result={result} onClose={closeResult} />}
    </main>
  );
}
