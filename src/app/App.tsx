import { ExplorationPage } from "@features/exploration";
import { RouletteSelectionPage } from "@features/roulette-selection";
import { RouletteTest1Page } from "@features/roulette-test1";
import { RoulettePage as RouletteTest2Page } from "@features/roulette-test2";
import type { ReactElement } from "react";

export function App(): ReactElement {
  if (window.location.pathname === "/roulette") {
    return <RouletteSelectionPage />;
  }

  if (window.location.pathname === "/roulette-test1") {
    return <RouletteTest1Page />;
  }

  if (window.location.pathname === "/roulette-test2") {
    return <RouletteTest2Page />;
  }

  return <ExplorationPage />;
}
