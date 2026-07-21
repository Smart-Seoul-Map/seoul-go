export type SeoulDistrict = {
  readonly id: number;
  readonly name: string;
  readonly officePosition: {
    readonly lng: number;
    readonly lat: number;
  };
};

export const SEOUL_DISTRICTS = [
  { id: 1, name: "\uAC15\uB0A8\uAD6C", officePosition: { lng: 127.047375, lat: 37.517507 } },
  { id: 2, name: "\uC11C\uCD08\uAD6C", officePosition: { lng: 127.0327, lat: 37.4836 } },
  { id: 3, name: "\uC885\uB85C\uAD6C", officePosition: { lng: 126.979612, lat: 37.574771 } },
  { id: 4, name: "\uC911\uAD6C", officePosition: { lng: 126.997589, lat: 37.56378 } },
  { id: 5, name: "\uC1A1\uD30C\uAD6C", officePosition: { lng: 127.105905, lat: 37.514453 } },
  { id: 6, name: "\uC601\uB4F1\uD3EC\uAD6C", officePosition: { lng: 126.895953, lat: 37.526263 } },
  { id: 7, name: "\uB9C8\uD3EC\uAD6C", officePosition: { lng: 126.901943, lat: 37.566242 } },
  { id: 8, name: "\uC6A9\uC0B0\uAD6C", officePosition: { lng: 126.990703, lat: 37.532326 } },
  { id: 9, name: "\uAC15\uC11C\uAD6C", officePosition: { lng: 126.849574, lat: 37.55091 } },
  { id: 10, name: "\uC11C\uB300\uBB38\uAD6C", officePosition: { lng: 126.9367, lat: 37.5793 } },
  { id: 11, name: "\uC131\uB3D9\uAD6C", officePosition: { lng: 127.036964, lat: 37.563422 } },
  { id: 12, name: "\uAD11\uC9C4\uAD6C", officePosition: { lng: 127.082208, lat: 37.538374 } },
  { id: 13, name: "\uAD00\uC545\uAD6C", officePosition: { lng: 126.951521, lat: 37.478261 } },
  { id: 14, name: "\uAD6C\uB85C\uAD6C", officePosition: { lng: 126.887639, lat: 37.49547 } },
  { id: 15, name: "\uB3D9\uC791\uAD6C", officePosition: { lng: 126.940269, lat: 37.504237 } },
  { id: 16, name: "\uC131\uBD81\uAD6C", officePosition: { lng: 127.016743, lat: 37.589366 } },
  { id: 17, name: "\uB178\uC6D0\uAD6C", officePosition: { lng: 127.0568, lat: 37.65368 } },
  { id: 18, name: "\uB3D9\uB300\uBB38\uAD6C", officePosition: { lng: 127.039833, lat: 37.574202 } },
  { id: 19, name: "\uAC15\uB3D9\uAD6C", officePosition: { lng: 127.123764, lat: 37.530085 } },
  { id: 20, name: "\uC591\uCC9C\uAD6C", officePosition: { lng: 126.866302, lat: 37.517105 } },
  { id: 21, name: "\uC740\uD3C9\uAD6C", officePosition: { lng: 126.929338, lat: 37.602176 } },
  { id: 22, name: "\uC911\uB791\uAD6C", officePosition: { lng: 127.092945, lat: 37.606588 } },
  { id: 23, name: "\uB3C4\uBD09\uAD6C", officePosition: { lng: 127.047065, lat: 37.668692 } },
  { id: 24, name: "\uAC15\uBD81\uAD6C", officePosition: { lng: 127.029229, lat: 37.63484 } },
  { id: 25, name: "\uAE08\uCC9C\uAD6C", officePosition: { lng: 126.895401, lat: 37.456767 } },
] as const satisfies readonly SeoulDistrict[];

export function getSeoulDistrictById(id: number): SeoulDistrict | null {
  return SEOUL_DISTRICTS.find((district) => district.id === id) ?? null;
}

export function getSeoulDistrictByName(name: string): SeoulDistrict | null {
  return SEOUL_DISTRICTS.find((district) => district.name === name) ?? null;
}
