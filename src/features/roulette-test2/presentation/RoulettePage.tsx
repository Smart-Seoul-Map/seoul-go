import { RouletteBackLink } from "@shared/ui/roulette";

import { useDistrictSelection } from "../application/useDistrictSelection";
import { districtLayers } from "../config/districtMapLayers";
import { DistrictResultDialog } from "./DistrictResultDialog";
import "./RoulettePage.css";
import { SeoulDistrictMap } from "./SeoulDistrictMap";

export function RoulettePage() {
  const { activeDistrict, closeResult, isSelecting, result, selectDistrict, selectedDistrict } =
    useDistrictSelection(districtLayers);

  return (
    <main className="district-picker-page roulette-shared-page">
      <RouletteBackLink />

      <section className="district-picker-shell" aria-label="자치구 랜덤 선정">
        <SeoulDistrictMap
          activeDistrict={activeDistrict?.name ?? null}
          districts={districtLayers}
          selectedDistrict={selectedDistrict?.name ?? null}
        />

        <div className="district-picker-controls">
          <button
            className="district-picker-button"
            type="button"
            onClick={selectDistrict}
            disabled={isSelecting}
          >
            {isSelecting ? "선정 중" : "자치구 선정"}
          </button>
        </div>

        <p className="district-picker-status" aria-live="polite">
          {isSelecting
            ? `${activeDistrict?.name ?? "자치구"} 선택 중`
            : selectedDistrict
              ? `${selectedDistrict.name} 선정`
              : "대기 중"}
        </p>
      </section>

      {result && <DistrictResultDialog result={result} onClose={closeResult} />}
    </main>
  );
}
