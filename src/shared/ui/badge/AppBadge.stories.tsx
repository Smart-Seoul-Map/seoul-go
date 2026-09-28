import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppBadge, type AppBadgeTone, type AppBadgeVariant } from "./AppBadge";

const meta = {
  title: "Shared/UI/AppBadge",
  component: AppBadge,
  tags: ["autodocs"],
  args: { children: "정보", size: "md", tone: "neutral", variant: "surface" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "number-sm", "number-md", "number-lg"],
    },
    tone: { control: "select", options: ["neutral", "brand", "info", "warning", "positive"] },
    variant: { control: "select", options: ["surface", "solid", "weak", "outline"] },
    textPolicy: { control: "select", options: ["truncate", "singleLine", "twoLines"] },
    width: { control: "select", options: ["content", "fill"] },
  },
} satisfies Meta<typeof AppBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const tones: AppBadgeTone[] = ["neutral", "brand", "info", "warning", "positive"];
const variants: AppBadgeVariant[] = ["surface", "solid", "weak", "outline"];

export const TonesAndVariants: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12 }}>
      {tones.map((tone) => (
        <div key={tone} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {variants.map((variant) => (
            <AppBadge key={variant} tone={tone} variant={variant} size="sm">
              {tone}
            </AppBadge>
          ))}
        </div>
      ))}
    </div>
  ),
};

export const ProductExamples: Story = {
  render: () => (
    <div style={{ display: "grid", justifyItems: "start", gap: 16, maxWidth: "100%" }}>
      <AppBadge size="lg" variant="solid">
        용산구
      </AppBadge>
      <AppBadge size="lg" variant="surface">
        서울에디션25 1/2
      </AppBadge>
      <div style={{ display: "flex", gap: 12 }}>
        <AppBadge size="number-lg" tone="info" variant="outline" textPolicy="singleLine">
          2025
        </AppBadge>
        <AppBadge size="number-lg" tone="brand" variant="outline" textPolicy="singleLine">
          2026
        </AppBadge>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <AppBadge size="number-sm" tone="brand" variant="solid" textPolicy="singleLine">
          2026
        </AppBadge>
        <AppBadge size="number-md" tone="info" variant="solid" textPolicy="singleLine">
          2025
        </AppBadge>
      </div>
      <div style={{ width: 72 }}>
        <AppBadge size="xs" variant="outline" width="fill" textPolicy="twoLines">
          서대문형무소 역사관
        </AppBadge>
      </div>
      <AppBadge size="sm" variant="outline">
        오늘의 시작점
      </AppBadge>
    </div>
  ),
};

export const TextPolicies: Story = {
  render: () => (
    <div style={{ display: "grid", gap: 12, width: 96 }}>
      <AppBadge size="xs" variant="outline" width="fill">
        서대문형무소 역사관
      </AppBadge>
      <AppBadge size="xs" variant="outline" width="fill" textPolicy="twoLines">
        서대문형무소 역사관
      </AppBadge>
      <AppBadge size="xs" variant="outline" width="fill" textPolicy="twoLines">
        LongPlaceNameWithoutSpaces
      </AppBadge>
      <AppBadge size="number-lg" tone="brand" variant="outline" textPolicy="singleLine">
        2026
      </AppBadge>
    </div>
  ),
};
