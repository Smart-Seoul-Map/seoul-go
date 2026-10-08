export type EntryEditionModel = {
  url: string;
  size: number;
  rotationY: number;
};

// API place IDs are independent of the designer's temporary file sequence.
export const ENTRY_EDITION_MODELS: Readonly<Record<string, EntryEditionModel>> = {
  "smart-seoul:1786321258890:25_edition25_24": {
    url: "/models/places/namsan_baekbeom_square.glb",
    size: 5.5,
    rotationY: Math.PI / 4,
  },
  "smart-seoul:1786321258890:25_edition25_12": {
    url: "/models/places/yongyangbongjeojeong_park.glb",
    size: 6,
    rotationY: Math.PI / 4,
  },
  "smart-seoul:1786321258890:25_edition25_20": {
    url: "/models/places/gangbyeon_seojae.glb",
    size: 5,
    rotationY: Math.PI / 4,
  },
  "smart-seoul:1786321258890:25_edition25_2": {
    url: "/models/places/amsa_dong_site.glb",
    size: 6,
    rotationY: Math.PI / 4,
  },
};

export const ENTRY_EDITION_ARRIVAL_RADIUS = 3.2;
export const ENTRY_EDITION_PLACE_COUNT = 10;
