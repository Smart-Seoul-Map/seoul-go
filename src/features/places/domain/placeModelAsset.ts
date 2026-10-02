export type PlaceModelAsset = {
  url: string;
  /** Longest side in local scene units; map projection remains renderer-owned. */
  size: number;
  rotation?: { x: number; y: number; z: number };
};

export type PlaceModelAssets = Readonly<Partial<Record<string, PlaceModelAsset>>>;
