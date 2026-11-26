export type EntryEditionModel = {
  url: string;
  size: number;
  rotationY: number;
  editionIndex: number;
};

const DEGREES_TO_RADIANS = Math.PI / 180;
const FRONT_FACING_RADIANS = Math.PI / 4;

export const ENTRY_EDITION_MODELS: Readonly<Record<string, EntryEditionModel>> = {
  "smart-seoul:1786321258890:2026_Gangnam-gu": {
    url: "/models/places/bongeunsa.glb",
    size: 5,
    rotationY: FRONT_FACING_RADIANS - 20 * DEGREES_TO_RADIANS,
    editionIndex: 0,
  },
  "smart-seoul:1786321258890:2025_Dongjak-gu": {
    url: "/models/places/yongyangbongjeojeong_park.glb",
    size: 5.6,
    rotationY: FRONT_FACING_RADIANS + 25 * DEGREES_TO_RADIANS,
    editionIndex: 1,
  },
  "smart-seoul:1786321258890:2025_Yeongdeungpo-gu": {
    url: "/models/places/gangbyeon_seojae.glb",
    size: 6.2,
    rotationY: FRONT_FACING_RADIANS - 12 * DEGREES_TO_RADIANS,
    editionIndex: 2,
  },
  "smart-seoul:1786321258890:2025_Gangdong-gu": {
    url: "/models/places/amsa_dong_site.glb",
    size: 7.5,
    rotationY: FRONT_FACING_RADIANS - 30 * DEGREES_TO_RADIANS,
    editionIndex: 3,
  },
  "smart-seoul:1786321258890:2025_Gwangjin-gu": {
    url: "/models/places/achasan_eoullim_garden.glb",
    size: 7,
    rotationY: -FRONT_FACING_RADIANS + 15 * DEGREES_TO_RADIANS,
    editionIndex: 4,
  },
  "smart-seoul:1786321258890:2025_Jung-gu": {
    url: "/models/places/namsan_baekbeom_square.glb",
    size: 5,
    rotationY: FRONT_FACING_RADIANS + 22 * DEGREES_TO_RADIANS,
    editionIndex: 5,
  },
  "smart-seoul:1786321258890:2025_Seodaemun-gu": {
    url: "/models/places/hongjecheon_artificial_waterfall.glb",
    size: 8.2,
    rotationY: FRONT_FACING_RADIANS + 20 * DEGREES_TO_RADIANS,
    editionIndex: 6,
  },
  "smart-seoul:1786321258890:2025_Gangseo-gu": {
    url: "/models/places/yangcheon_hyanggyo.glb",
    size: 7.9,
    rotationY: FRONT_FACING_RADIANS - 20 * DEGREES_TO_RADIANS,
    editionIndex: 7,
  },
  "smart-seoul:1786321258890:2026_Seodaemun-gu": {
    url: "/models/places/seodaemun_hyeongmuso.glb",
    size: 7.1,
    rotationY: FRONT_FACING_RADIANS + 15 * DEGREES_TO_RADIANS,
    editionIndex: 8,
  },
  "smart-seoul:1786321258890:2026_Nowon-gu": {
    url: "/models/places/hwarangdae.glb",
    size: 6.8,
    rotationY: FRONT_FACING_RADIANS - 15 * DEGREES_TO_RADIANS,
    editionIndex: 9,
  },
};

export const ENTRY_EDITION_ARRIVAL_RADIUS = 3.2;
export const ENTRY_EDITION_PLACE_COUNT = 10;
