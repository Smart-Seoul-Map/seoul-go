import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppBadge } from "../badge";
import { AppButton } from "../button";
import { AppTabs, AppTabsRoot, type AppTabsRootProps } from ".";

const meta = {
  title: "Shared/UI/AppTabs",
  component: AppTabsRoot,
  tags: ["autodocs"],
  args: { variant: "outline", size: "md", orientation: "horizontal", defaultValue: "2025" },
  argTypes: {
    variant: { control: "select", options: ["outline", "card"] },
    size: { control: "select", options: ["md", "lg"] },
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(420px, calc(100vw - 48px))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppTabsRoot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <AppTabs.Root {...args}>
      <AppTabs.List aria-label="선정 연도">
        <AppTabs.Trigger value="2025">2025</AppTabs.Trigger>
        <AppTabs.Trigger value="2026">2026</AppTabs.Trigger>
        <AppTabs.Trigger value="2027" disabled>
          2027
        </AppTabs.Trigger>
      </AppTabs.List>
      <AppTabs.Content value="2025">2025년 장소 목록</AppTabs.Content>
      <AppTabs.Content value="2026">2026년 장소 목록</AppTabs.Content>
      <AppTabs.Content value="2027">2027년 장소 목록</AppTabs.Content>
    </AppTabs.Root>
  ),
};

// Existing local marker assets keep this composition example independent of the API.
const places = [
  {
    id: "place-a",
    year: "2025",
    name: "해방촌 신흥시장",
    image: "/images/place-markers/blue_closed_box.png",
  },
  {
    id: "place-b",
    year: "2026",
    name: "리움미술관",
    image: "/images/place-markers/red_closed_box.png",
  },
  {
    id: "place-c",
    year: "2026",
    name: "서대문형무소 역사관",
    image: "/images/place-markers/purple_closed_box.png",
  },
];

export const PlaceCards: Story = {
  args: { variant: "card", defaultValue: "place-a" },
  parameters: {
    docs: {
      description: {
        story:
          "이미지·연도·이름을 조합한 예제입니다. 이미지는 기존 보물상자 자산을 사용하며 실제 장소 사진이 아닙니다.",
      },
    },
  },
  render: (args) => (
    <AppTabs.Root {...args}>
      <AppTabs.List aria-label="기준 장소">
        {places.map((place) => (
          <AppTabs.Trigger key={place.id} value={place.id} style={{ width: 240, minHeight: 108 }}>
            <img
              src={place.image}
              alt=""
              width={56}
              height={64}
              style={{ objectFit: "contain", flex: "none" }}
            />
            <span
              style={{
                display: "grid",
                justifyItems: "start",
                gap: "var(--sg-spacing-2)",
                minWidth: 0,
              }}
            >
              <AppBadge
                size="number-sm"
                tone={place.year === "2025" ? "info" : "brand"}
                variant="solid"
              >
                {place.year}
              </AppBadge>
              <span>{place.name}</span>
            </span>
          </AppTabs.Trigger>
        ))}
      </AppTabs.List>
      {places.map((place) => (
        <AppTabs.Content key={place.id} value={place.id}>
          {place.name} 기준 장소 목록
        </AppTabs.Content>
      ))}
    </AppTabs.Root>
  ),
};

function ControlledExample(args: AppTabsRootProps) {
  const [value, setValue] = useState("first");

  return (
    <>
      <AppButton onClick={() => setValue("second")}>두 번째 탭 선택</AppButton>
      <AppTabs.Root {...args} value={value} onValueChange={setValue}>
        <AppTabs.List aria-label="선택 예제">
          <AppTabs.Trigger value="first">첫 번째</AppTabs.Trigger>
          <AppTabs.Trigger value="second">두 번째</AppTabs.Trigger>
        </AppTabs.List>
        <AppTabs.Content value="first">첫 번째 내용</AppTabs.Content>
        <AppTabs.Content value="second">두 번째 내용</AppTabs.Content>
      </AppTabs.Root>
    </>
  );
}

export const Controlled: Story = { render: (args) => <ControlledExample {...args} /> };

export const Overflow: Story = {
  render: (args) => (
    <AppTabs.Root {...args}>
      <AppTabs.List aria-label="연도 목록">
        {Array.from({ length: 10 }, (_, index) => String(2025 + index)).map((year) => (
          <AppTabs.Trigger key={year} value={year}>
            {year}
          </AppTabs.Trigger>
        ))}
      </AppTabs.List>
      {Array.from({ length: 10 }, (_, index) => String(2025 + index)).map((year) => (
        <AppTabs.Content key={year} value={year}>
          {year}년 장소 목록
        </AppTabs.Content>
      ))}
    </AppTabs.Root>
  ),
};
