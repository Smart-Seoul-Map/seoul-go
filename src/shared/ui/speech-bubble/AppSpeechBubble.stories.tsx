import type { Meta, StoryObj } from "@storybook/react-vite";

import { AppSpeechBubble } from ".";

const meta = {
  title: "Shared/UI/AppSpeechBubble",
  component: AppSpeechBubble,
  tags: ["autodocs"],
  args: {
    speaker: "해치",
    message: "행운의 한 발을 날려볼까? 아래 화살을 눌러 발사!",
  },
  decorators: [
    (Story) => (
      <div style={{ padding: "var(--sg-spacing-6)", background: "var(--sg-state-info-weak-bg)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppSpeechBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MessageLengths: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "var(--sg-spacing-8)", width: 360, maxWidth: "100%" }}>
      <AppSpeechBubble {...args} message="좋아, 출발!" />
      <AppSpeechBubble {...args} />
      <AppSpeechBubble
        {...args}
        message="서울 곳곳에 숨은 명소를 찾아 도장을 모아 보자. 다 모으면 나만의 코스가 완성돼!"
      />
    </div>
  ),
};
