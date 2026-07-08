import "@shared/ui/roulette/rouletteShared.css";
import "./RouletteSelectionPage.css";

export function RouletteSelectionPage() {
  return (
    <main className="roulette-selection-page roulette-shared-page">
      <section className="roulette-selection-layout" aria-label="룰렛 시안 선택">
        <a className="roulette-selection-card roulette-selection-card-wheel" href="/roulette-test1">
          <span>1안</span>
          <strong>원판 룰렛</strong>
        </a>

        <a className="roulette-selection-card roulette-selection-card-map" href="/roulette-test2">
          <span>2안</span>
          <strong>지도 룰렛</strong>
        </a>
      </section>
    </main>
  );
}
