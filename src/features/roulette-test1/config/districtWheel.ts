import type { CSSProperties } from "react";
import type { WheelDataType } from "react-custom-roulette";

import districtRecords from "../../../data/randomDistricts.json";

type DistrictRecord = {
  id: number;
  district: string;
  x: number;
  y: number;
};

const palette = ["#ffffff", "#c7d8fb", "#5f84e9", "#244fd1"];
const textPalette = ["#244fd1", "#244fd1", "#ffffff", "#ffffff"];
const hiddenPointerStyle: CSSProperties = { display: "none" };

export const topPointerPrizeOffset = 3;
export const hiddenPointerProps = { style: hiddenPointerStyle };
export const wheelDistricts = (districtRecords as DistrictRecord[]).map(
  (record) => record.district
);

export const wheelData: WheelDataType[] = wheelDistricts.map((district, index) => ({
  option: district,
  style: {
    backgroundColor: palette[index % palette.length],
    textColor: textPalette[index % textPalette.length],
    fontWeight: 800,
  },
}));
