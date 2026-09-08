import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import { AppButton } from "../button";
import { AppResponsivePanel } from ".";
import type { AppResponsivePanelRootProps } from "./panelTypes";

function PanelExample(props: Omit<AppResponsivePanelRootProps, "children">) {
  return (
    <AppResponsivePanel.Root {...props}>
      <AppResponsivePanel.Trigger asChild>
        <AppButton variant="primary">상세 정보 열기</AppButton>
      </AppResponsivePanel.Trigger>
      <AppResponsivePanel.Content
        title="장소 상세"
        description="선택한 장소를 확인하세요."
        showHandle
      >
        <AppResponsivePanel.Body>
          <label style={{ display: "grid", gap: "var(--sg-spacing-2)" }}>
            메모
            <input aria-label="메모" placeholder="방문 메모" />
          </label>
        </AppResponsivePanel.Body>
        <AppResponsivePanel.Footer>
          <AppResponsivePanel.CloseButton
            className="AppButton"
            data-variant="primary"
            data-size="md"
          >
            확인
          </AppResponsivePanel.CloseButton>
        </AppResponsivePanel.Footer>
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  );
}

const meta = {
  title: "Shared/UI/AppResponsivePanel",
  component: PanelExample,
  tags: ["autodocs"],
  parameters: { layout: "centered", viewport: { options: MINIMAL_VIEWPORTS } },
  args: { modal: true, dismissible: true, defaultOpen: false, skipAnimation: false },
  argTypes: {
    modal: { control: "boolean" },
    dismissible: { control: "boolean" },
    skipAnimation: { control: "boolean" },
    sidePanelRootProps: { control: "object" },
    bottomSheetRootProps: { control: "object" },
  },
} satisfies Meta<typeof PanelExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Left: Story = { args: { sidePanelRootProps: { direction: "left", size: "small" } } };
export const Large: Story = { args: { sidePanelRootProps: { size: "large" } } };
export const NonModal: Story = { args: { modal: false } };
export const NonDismissible: Story = { args: { dismissible: false } };
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  args: { defaultOpen: true, bottomSheetRootProps: { handleOnly: true } },
};
export const SnapPoints: Story = {
  args: { bottomSheetRootProps: { snapPoints: ["200px", "400px", 0.9], fadeFromIndex: 1 } },
};
export const LongContent: Story = {
  render: () => (
    <AppResponsivePanel.Root>
      <AppResponsivePanel.Trigger asChild>
        <AppButton>긴 내용 열기</AppButton>
      </AppResponsivePanel.Trigger>
      <AppResponsivePanel.Content title="방문 기록" showHandle>
        <AppResponsivePanel.Body>
          {Array.from({ length: 30 }, (_, index) => (
            <p key={index}>방문 기록 {index + 1}</p>
          ))}
        </AppResponsivePanel.Body>
        <AppResponsivePanel.Footer>
          <AppResponsivePanel.CloseButton
            className="AppButton"
            data-size="md"
            data-variant="primary"
          >
            닫기
          </AppResponsivePanel.CloseButton>
        </AppResponsivePanel.Footer>
      </AppResponsivePanel.Content>
    </AppResponsivePanel.Root>
  ),
};
export const Controlled: Story = {
  render: function ControlledPanel() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <AppButton onClick={() => setOpen(true)}>외부 상태로 열기</AppButton>
        <PanelExample open={open} onOpenChange={setOpen} />
      </>
    );
  },
};
