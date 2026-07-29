export type PlaceCoordinates = {
  lng: number;
  lat: number;
};

export type SmartSeoulThemePlace = {
  id: string;
  sourceContentId: string;
  name: string;
  districtName: string;
  themeId: string;
  themeName: string;
  address: string;
  position: PlaceCoordinates;
};
