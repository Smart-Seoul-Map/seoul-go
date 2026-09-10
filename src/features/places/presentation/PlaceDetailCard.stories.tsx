import type { Meta, StoryObj } from "@storybook/react-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import { AppButton } from "@shared/ui/button";
import { PlaceDetailCard } from "./PlaceDetailCard";
import { PlaceDetailPanel } from "./PlaceDetailPanel";

const meta = {
  title: "Features/Places/PlaceDetailCard",
  component: PlaceDetailCard,
  tags: ["autodocs"],
  args: {
    title: "N서울타워",
    subtitle: "탐방중 이런 정보를 만나요!",
    description:
      "남산 위에서 서울을 한눈에 내려다볼 수 있는 대표 전망 명소. 낮에는 서울 도심과 산세를, 밤에는 화려한 야경을 즐길 수 있어요.",
    address: "서울 용산구 남산공원길 105",
  },
  parameters: { layout: "centered", viewport: { options: MINIMAL_VIEWPORTS } },
} satisfies Meta<typeof PlaceDetailCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongContent: Story = {
  args: {
    title: "서울의 풍경을 한눈에 만나는 N서울타워",
    description: `${meta.args.description} ${meta.args.description}`,
    address: "서울특별시 용산구 남산공원길 105, N서울타워 전망대 방문 안내 데스크",
  },
};
export const ResponsivePanel: Story = {
  render: (args) => (
    <PlaceDetailPanel
      place={args}
      trigger={<AppButton variant="primary">장소 상세 보기</AppButton>}
    />
  ),
};
export const MobilePanel: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: (args) => <PlaceDetailPanel place={args} defaultOpen />,
};
