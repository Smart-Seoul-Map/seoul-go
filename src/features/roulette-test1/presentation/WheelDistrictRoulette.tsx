import { Wheel } from "react-custom-roulette";
import type { WheelDataType } from "react-custom-roulette";

import { hiddenPointerProps } from "../config/districtWheel";

type WheelDistrictRouletteProps = {
  data: WheelDataType[];
  mustSpin: boolean;
  onStopSpinning: () => void;
  prizeNumber: number;
};

export function WheelDistrictRoulette({
  data,
  mustSpin,
  onStopSpinning,
  prizeNumber,
}: WheelDistrictRouletteProps) {
  return (
    <div className="wheel-roulette-stage">
      <img
        className="wheel-roulette-pointer"
        src="/roulette-pointer.svg"
        alt=""
        aria-hidden="true"
      />

      <div className="wheel-roulette-wrap">
        <div className="wheel-roulette-frame">
          <Wheel
            mustStartSpinning={mustSpin}
            prizeNumber={prizeNumber}
            data={data}
            onStopSpinning={onStopSpinning}
            outerBorderColor="#ffffff"
            outerBorderWidth={7}
            radiusLineColor="#ffffff"
            radiusLineWidth={2}
            fontFamily="Arial"
            fontSize={13}
            textDistance={66}
            spinDuration={0.32}
            pointerProps={hiddenPointerProps}
            disableInitialAnimation
          />
        </div>
      </div>
    </div>
  );
}
