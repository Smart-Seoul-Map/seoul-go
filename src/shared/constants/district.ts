export type SeoulDistrict = {
  readonly id: number;
  readonly name: string;
  readonly officePosition: {
    readonly lng: number;
    readonly lat: number;
  };
};

export const SEOUL_DISTRICTS = [
  { id: 1, name: "강남구", officePosition: { lng: 127.047375, lat: 37.517507 } },
  { id: 2, name: "서초구", officePosition: { lng: 127.0327, lat: 37.4836 } },
  { id: 3, name: "종로구", officePosition: { lng: 126.979612, lat: 37.574771 } },
  { id: 4, name: "중구", officePosition: { lng: 126.997589, lat: 37.56378 } },
  { id: 5, name: "송파구", officePosition: { lng: 127.105905, lat: 37.514453 } },
  { id: 6, name: "영등포구", officePosition: { lng: 126.895953, lat: 37.526263 } },
  { id: 7, name: "마포구", officePosition: { lng: 126.901943, lat: 37.566242 } },
  { id: 8, name: "용산구", officePosition: { lng: 126.990703, lat: 37.532326 } },
  { id: 9, name: "강서구", officePosition: { lng: 126.849574, lat: 37.55091 } },
  { id: 10, name: "서대문구", officePosition: { lng: 126.9367, lat: 37.5793 } },
  { id: 11, name: "성동구", officePosition: { lng: 127.036964, lat: 37.563422 } },
  { id: 12, name: "광진구", officePosition: { lng: 127.082208, lat: 37.538374 } },
  { id: 13, name: "관악구", officePosition: { lng: 126.951521, lat: 37.478261 } },
  { id: 14, name: "구로구", officePosition: { lng: 126.887639, lat: 37.49547 } },
  { id: 15, name: "동작구", officePosition: { lng: 126.940269, lat: 37.504237 } },
  { id: 16, name: "성북구", officePosition: { lng: 127.016743, lat: 37.589366 } },
  { id: 17, name: "노원구", officePosition: { lng: 127.0568, lat: 37.65368 } },
  { id: 18, name: "동대문구", officePosition: { lng: 127.039833, lat: 37.574202 } },
  { id: 19, name: "강동구", officePosition: { lng: 127.123764, lat: 37.530085 } },
  { id: 20, name: "양천구", officePosition: { lng: 126.866302, lat: 37.517105 } },
  { id: 21, name: "은평구", officePosition: { lng: 126.929338, lat: 37.602176 } },
  { id: 22, name: "중랑구", officePosition: { lng: 127.092945, lat: 37.606588 } },
  { id: 23, name: "도봉구", officePosition: { lng: 127.047065, lat: 37.668692 } },
  { id: 24, name: "강북구", officePosition: { lng: 127.029229, lat: 37.63484 } },
  { id: 25, name: "금천구", officePosition: { lng: 126.895401, lat: 37.456767 } },
] as const satisfies readonly SeoulDistrict[];

export function getSeoulDistrictById(id: number): SeoulDistrict | null {
  return SEOUL_DISTRICTS.find((district) => district.id === id) ?? null;
}

export function getSeoulDistrictByName(name: string): SeoulDistrict | null {
  return SEOUL_DISTRICTS.find((district) => district.name === name) ?? null;
}
