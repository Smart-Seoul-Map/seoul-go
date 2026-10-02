import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  LinkedPlacesContent,
  LinkedPlacesPanel,
  type LinkedPlacesContentProps,
  type LinkedNearbyPlace,
} from "./LinkedPlacesPanel";
import type { LinkedPlaceReference } from "../domain/linkedPlaceReference";

const references: LinkedPlaceReference[] = [
  {
    id: "edition-2025",
    name: "해방촌 신흥시장",
    selectionYear: 2025,
    imageUrl: "/images/place-markers/blue_closed_box.png",
    position: { lat: 37.545, lng: 126.985 },
    addedAt: "2026-01-01",
  },
  {
    id: "edition-2026",
    name: "리움미술관",
    selectionYear: 2026,
    imageUrl: "/images/place-markers/red_closed_box.png",
    position: { lat: 37.538, lng: 126.999 },
    addedAt: "2026-01-02",
  },
  {
    id: "edition-2027",
    name: "긴 장소 이름도 확인할 수 있는 서울에디션",
    selectionYear: 2027,
    position: { lat: 37.54, lng: 127 },
    addedAt: "2026-01-03",
  },
];
const places: LinkedNearbyPlace[] = Array.from({ length: 12 }, (_, index) => ({
  id: `nearby-${index}`,
  sourceContentId: `nearby-${index}`,
  name: `연계 장소 ${index + 1}`,
  description: "",
  themeId: "100032",
  themeName: "서울 미래유산",
  imageUrl: "",
  address: "",
  districtName: "용산구",
  position: { lat: 37.54, lng: 126.99 },
}));

const meta = {
  title: "Exploration/LinkedPlaces",
  component: LinkedPlacesContent,
  tags: ["autodocs"],
  args: {
    references,
    selected: references[0],
    places,
    isLoading: false,
    isError: false,
    onSelect: () => {},
    onRetry: () => {},
  },
  parameters: {
    docs: {
      description: {
        component:
          "코스에 담긴 서울에디션을 기준으로 반경 1km 장소를 확인합니다. 이 예제의 보물상자 이미지는 기존 로컬 자산이며 실제 장소 사진은 아닙니다.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "min(440px, calc(100vw - 32px))",
          background: "var(--sg-color-bg-surface-paper)",
          padding: 16,
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LinkedPlacesContent>;
export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveContent(args: LinkedPlacesContentProps) {
  const [id, setId] = useState(args.references[0]?.id);
  const selected = args.references.find((place) => place.id === id) ?? null;
  return (
    <LinkedPlacesContent
      {...args}
      selected={selected}
      onSelect={setId}
      places={id === references[1].id ? places.slice(0, 5) : args.places}
    />
  );
}
export const Default: Story = { render: (args) => <InteractiveContent {...args} /> };
export const Loading: Story = { args: { places: [], isLoading: true } };
export const Error: Story = { args: { places: [], isError: true } };
export const Empty: Story = { args: { places: [] } };
export const NoReference: Story = { args: { references: [], selected: null, places: [] } };
export const ResponsivePanel: Story = {
  render: (args) => <LinkedPlacesPanel {...args} onClose={() => {}} />,
};
