import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppBox } from ".";

const meta = {
  title: "Shared/UI/AppBox",
  component: AppBox,
  tags: ["autodocs"],
  args: {
    children: "장소 정보",
    bg: "bg.surfacePaper",
    color: "text.default",
    borderColor: "stroke.weak",
    borderWidth: "strokeWidth.surface",
    borderRadius: "radius.7",
    p: "spacing.6",
    width: "var(--sg-panel-width-small)",
    maxWidth: "full",
    style: { fontFamily: "var(--sg-font-namsan)" },
  },
} satisfies Meta<typeof AppBox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Shadow: Story = { args: { borderRadius: "radius.4_5", boxShadow: "shadow.raised" } };
export const Responsive: Story = {
  args: {
    width: { base: "full", md: "var(--sg-panel-width-small)" },
    p: { base: "spacing.3", md: "spacing.6", xl: "spacing.8" },
  },
};
export const Mobile: Story = {
  ...Responsive,
  globals: { viewport: { value: "mobile1", isRotated: false } },
};
export const HideFrom: Story = { args: { hideFrom: "md" } };
export const AsElement: Story = { args: { as: "aside", "aria-label": "장소 정보" } };
export const AsChild: Story = {
  args: { asChild: true, children: <section aria-label="장소 정보">장소 정보</section> },
};
export const Composition: Story = {
  render: () => (
    <AppBox display="flex" flexDirection="column" gap="spacing.4" p="spacing.4" width="full">
      <AppBox
        bg="bg.surfacePaper"
        borderColor="text.brand"
        borderWidth="1"
        borderRadius="radius.3"
        p="spacing.4"
        maxWidth="full"
      >
        서울 지도에 화살을 쏴 볼까요?
      </AppBox>
      <AppBox
        bg="bg.surfacePaper"
        borderColor="text.brand"
        borderWidth="1"
        borderRadius="radius.2"
        p="spacing.3"
        boxShadow="shadow.raised"
        width={{ base: "full", md: "var(--sg-panel-width-small)" }}
      >
        격자번호란? 서울을 일정한 칸으로 나누고 각 칸에 번호를 부여한 탐방 기준이에요.
      </AppBox>
    </AppBox>
  ),
};
