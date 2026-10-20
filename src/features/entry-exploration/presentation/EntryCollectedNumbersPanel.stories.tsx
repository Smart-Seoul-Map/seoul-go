import type { Meta, StoryObj } from "@storybook/react-vite";

import introBackground from "../../../assets/entry-exploration/intro-background.webp";
import type { EntryNumberRewardRow } from "../domain/entryNumberReward";
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";

import "../../../style.css";

function createPlaceRows(
  placeId: string,
  placeName: string,
  east: number,
  north: number
): EntryNumberRewardRow[] {
  return [
    { key: `${placeId}:east`, placeName, number: east },
    { key: `${placeId}:north`, placeName, number: north },
  ];
}

const TWO_PLACE_ROWS = [
  ...createPlaceRows("place-1", "홍제천", 50, 53),
  ...createPlaceRows("place-2", "아차산 어울림정원", 64, 51),
];

const meta = {
  title: "Features/Entry Exploration/Collected Numbers",
  component: EntryCollectedNumbersPanel,
  parameters: { layout: "fullscreen" },
  args: { rows: TWO_PLACE_ROWS },
  decorators: [
    (Story) => (
      <div
        className="entry-exploration-page"
        style={{
          height: "100dvh",
          minHeight: 0,
          backgroundImage: `url(${introBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EntryCollectedNumbersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoPlaces: Story = {};
export const Empty: Story = { args: { rows: [] } };
export const ManyPlaces: Story = {
  args: {
    rows: [
      ...TWO_PLACE_ROWS,
      ...createPlaceRows("place-3", "같은 번호를 받은 아주 긴 이름의 서울에디션 장소", 52, 52),
      ...createPlaceRows("place-4", "해방촌신흥시장", 54, 49),
    ],
  },
};
