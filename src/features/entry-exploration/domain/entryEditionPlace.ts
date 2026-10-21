export type EntryEditionPlace = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  address: string;
  selectionYear?: number;
  position: { lat: number; lng: number };
};

export type EntryExplorationPlaceId = string;
