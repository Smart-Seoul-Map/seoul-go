export type PlaceCoordinates = {
  lng: number;
  lat: number;
};

export type SmartSeoulThemePlace = {
  id: string;
  sourceContentId: string;
  name: string;
  description: string;
  selectionYear?: number;
  districtName: string;
  themeId: string;
  themeName: string;
  address: string;
  imageUrl: string;
  position: PlaceCoordinates;
};
