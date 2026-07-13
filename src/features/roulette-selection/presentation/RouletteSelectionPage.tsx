import { PATH } from "@shared/constants/path";

import "@shared/ui/roulette/rouletteShared.css";
import "./RouletteSelectionPage.css";

export function RouletteSelectionPage() {
  return (
    <main className="roulette-selection-page roulette-shared-page">
      <section className="roulette-selection-layout" aria-label="룰렛 시안 선택">
        <a
          className="roulette-selection-card roulette-selection-card-wheel"
          href={PATH.ROULETTE_WHEEL}
        >
          <span>1안</span>
          <strong>원판 룰렛</strong>
        </a>

        <a className="roulette-selection-card roulette-selection-card-map" href={PATH.ROULETTE_MAP}>
          <span>2안</span>
          <strong>지도 룰렛</strong>
        </a>
      </section>
    </main>
  );
}
