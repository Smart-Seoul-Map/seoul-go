import type { Meta, StoryObj } from "@storybook/react-vite";

import introBackground from "../../../assets/entry-exploration/intro-background.png";
import { EntryCollectedNumbersPanel } from "./EntryCollectedNumbersPanel";

import "../../../style.css";

const meta = {
  title: "Features/Entry Exploration/Collected Numbers",
  component: EntryCollectedNumbersPanel,
  parameters: { layout: "fullscreen" },
  args: { numbers: [40, 57, 65] },
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

export const ThreeNumbers: Story = {};
export const Empty: Story = { args: { numbers: [] } };
export const TenNumbers: Story = {
  args: { numbers: [40, 57, 65, 36, 71, 50, 44, 61, 38, 69] },
};
