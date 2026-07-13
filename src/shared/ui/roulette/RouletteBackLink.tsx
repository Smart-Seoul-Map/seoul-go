import { PATH } from "@shared/constants/path";

import "./rouletteShared.css";

export function RouletteBackLink() {
  return (
    <a className="roulette-back-link" href={PATH.ROULETTE} aria-label="룰렛 시안 선택으로 돌아가기">
      목록
    </a>
  );
}
