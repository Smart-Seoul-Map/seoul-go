export type EntryEditionModel = {
  url: string;
  size: number;
  rotationY: number;
  editionIndex: number;
};

const DEGREES_TO_RADIANS = Math.PI / 180;
const FRONT_FACING_RADIANS = Math.PI / 4;

// API place IDs are independent of the designer's temporary file sequence.
export const ENTRY_EDITION_MODELS: Readonly<Record<string, EntryEditionModel>> = {
  "smart-seoul:1786321258890:26_edition25_1": {
    url: "/models/places/bongeunsa.glb",
    size: 5,
    rotationY: FRONT_FACING_RADIANS - 20 * DEGREES_TO_RADIANS,
    editionIndex: 0,
  },
  "smart-seoul:1786321258890:25_edition25_12": {
    url: "/models/places/yongyangbongjeojeong_park.glb",
    size: 5.6,
    rotationY: FRONT_FACING_RADIANS + 25 * DEGREES_TO_RADIANS,
    editionIndex: 1,
  },
  "smart-seoul:1786321258890:25_edition25_20": {
    url: "/models/places/gangbyeon_seojae.glb",
    size: 6.2,
    rotationY: FRONT_FACING_RADIANS - 12 * DEGREES_TO_RADIANS,
    editionIndex: 2,
  },
  "smart-seoul:1786321258890:25_edition25_2": {
    url: "/models/places/amsa_dong_site.glb",
    size: 7.5,
    rotationY: FRONT_FACING_RADIANS - 30 * DEGREES_TO_RADIANS,
    editionIndex: 3,
  },
  "smart-seoul:1786321258890:25_edition25_6": {
    url: "/models/places/achasan_eoullim_garden.glb",
    size: 7,
    rotationY: -FRONT_FACING_RADIANS + 15 * DEGREES_TO_RADIANS,
    editionIndex: 4,
  },
  "smart-seoul:1786321258890:25_edition25_24": {
    url: "/models/places/namsan_baekbeom_square.glb",
    size: 5,
    rotationY: FRONT_FACING_RADIANS + 22 * DEGREES_TO_RADIANS,
    editionIndex: 5,
  },
};

export const ENTRY_EDITION_ARRIVAL_RADIUS = 3.2;
export const ENTRY_EDITION_PLACE_COUNT = 10;
