import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppButton } from "../button";
import { AppCallout } from ".";

const meta = {
  title: "Shared/UI/AppCallout",
  component: AppCallout,
  tags: ["autodocs"],
  args: {
    title: "안내",
    description: "근처에 함께 가볼 만한 장소를 찾았어요.",
    tone: "informative",
    role: "note",
  },
  argTypes: {
    tone: { control: "select", options: ["neutral", "informative"] },
    role: { control: "select", options: ["note", "status", "alert"] },
    prefixIcon: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(380px, calc(100vw - 48px))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppCallout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DescriptionOnly: Story = {
  args: {
    title: undefined,
    tone: "neutral",
    description: "선택한 장소 주변의 탐방 정보를 확인할 수 있어요.",
  },
};

// A decorative filled symbol demonstrates the icon slot without an icon dependency.
function InformationSymbol() {
  return (
    <span
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        borderRadius: "var(--sg-radius-full)",
        background: "var(--callout-icon-bg)",
        color: "var(--callout-icon-fg)",
        boxShadow: "inset 0 0 0 1px var(--callout-icon-stroke)",
        fontWeight: "var(--sg-font-weight-bold)",
      }}
    >
      i
    </span>
  );
}

export const WithIcon: Story = { args: { prefixIcon: <InformationSymbol /> } };

export const Tones: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--sg-spacing-3)" }}>
      <AppCallout {...args} tone="neutral" />
      <AppCallout {...args} tone="informative" />
    </div>
  ),
};

export const NarrowAndLongText: Story = {
  render: (args) => (
    <div style={{ width: 240, maxWidth: "100%" }}>
      <AppCallout
        {...args}
        prefixIcon={<InformationSymbol />}
        description="선택한 장소 주변의 정보를 확인하고 다른 장소를 선택해 탐방을 이어갈 수 있어요. LongPlaceNameWithoutSpacesForWrapping"
      />
    </div>
  ),
};

function UpdatedMessageExample() {
  const [hasResults, setHasResults] = useState(false);

  return (
    <div style={{ display: "grid", gap: "var(--sg-spacing-3)" }}>
      <AppCallout
        role="status"
        tone="informative"
        title="안내"
        description={hasResults ? "근처 장소 5개를 찾았어요." : "주변 장소를 확인하고 있어요."}
      />
      <AppButton onClick={() => setHasResults((previous) => !previous)}>메시지 변경</AppButton>
    </div>
  );
}

export const UpdatedMessage: Story = { render: () => <UpdatedMessageExample /> };
