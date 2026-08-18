import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppButton } from "./AppButton";

const meta = {
  title: "Shared/UI/AppButton",
  component: AppButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    componentSubtitle:
      "AppButton 컴포넌트는 사용자의 상호작용 동작을 트리거하는 프로젝트의 공용 액션 버튼입니다.",
  },
  // meta 레벨에 기본 args를 선언해두면 하위 스토리에서 children 누락 에러가 발생하지 않습니다.
  args: {
    children: "버튼",
    variant: "secondary",
    size: "md",
    type: "button",
    disabled: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "360px", display: "flex", justifyContent: "center" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    children: {
      control: { type: "text" },
      description: "버튼 내부에 표시될 텍스트 또는 ReactNode 엘리먼트입니다.",
    },
    variant: {
      control: {
        type: "radio",
      },
      options: ["primary", "secondary", "strong", "danger", "outline", "ghost"],
      description: "버튼의 스타일 변형(배경색, 텍스트 색상)을 지정합니다.",
      table: {
        defaultValue: { summary: "secondary" },
      },
    },
    size: {
      control: {
        type: "radio",
      },
      options: ["xs", "sm", "md", "lg"],
      description: "버튼의 최소 높이 및 크기를 지정합니다.",
      table: {
        defaultValue: { summary: "md" },
      },
    },
    type: {
      control: {
        type: "select",
      },
      options: ["button", "submit", "reset"],
      description: "HTML 버튼의 기본 type 속성을 지정합니다.",
      table: {
        defaultValue: { summary: "button" },
      },
    },
    disabled: {
      control: "boolean",
      description: "버튼의 비활성화 여부를 지정합니다.",
      table: {
        defaultValue: { summary: "false" },
      },
    },
    onClick: {
      action: "clicked",
      description: "버튼 클릭 시 호출되는 이벤트 핸들러입니다.",
    },
  },
} satisfies Meta<typeof AppButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 기본 기본값 스토리 (Secondary, md 크기)
 */
export const Default: Story = {
  args: {
    children: "확인",
    variant: "secondary",
    size: "md",
    type: "button",
    disabled: false,
  },
};

/**
 * 주요 작업에 사용되는 Primary 스타일
 */
export const Primary: Story = {
  args: {
    children: "주요 액션",
    variant: "primary",
    size: "md",
  },
};

/**
 * 강조 액션에 사용되는 Strong 스타일
 */
export const Strong: Story = {
  args: {
    children: "강조 버튼",
    variant: "strong",
    size: "md",
  },
};

/**
 * 삭제/경고성 작업에 사용되는 Danger 스타일
 */
export const Danger: Story = {
  args: {
    children: "삭제하기",
    variant: "danger",
    size: "md",
  },
};

/**
 * 외곽선 기반의 Outline 스타일
 */
export const Outline: Story = {
  args: {
    children: "외곽선 버튼",
    variant: "outline",
    size: "md",
  },
};

/**
 * 배경이 투명한 Ghost 스타일
 */
export const Ghost: Story = {
  args: {
    children: "고스트 버튼",
    variant: "ghost",
    size: "md",
  },
};

/**
 * 비활성화(Disabled) 상태
 */
export const Disabled: Story = {
  args: {
    children: "비활성화 버튼",
    variant: "primary",
    size: "md",
    disabled: true,
  },
};

/**
 * 크기별(Sizes) 모음
 */
export const Sizes: Story = {
  args: {
    children: "버튼 크기 모음",
    variant: "primary",
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <AppButton {...args} size="xs">
        XS
      </AppButton>
      <AppButton {...args} size="sm">
        SM
      </AppButton>
      <AppButton {...args} size="md">
        MD
      </AppButton>
      <AppButton {...args} size="lg">
        LG
      </AppButton>
    </div>
  ),
};
