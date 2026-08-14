import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppButton } from "../button";
import { AppToastProvider, useAppToast } from "./AppToastProvider";
import type { AppToastStatus } from "./toastTypes";

// 스토리를 위한 인터랙티브 트리거 컴포넌트
function ToastDemo(props: {
  message: string;
  status?: AppToastStatus;
  durationMs?: number;
  actionLabel?: string;
}) {
  const { showToast, clearToasts } = useAppToast();

  const handleShow = () => {
    showToast({
      message: props.message,
      status: props.status,
      durationMs: props.durationMs,
      actionLabel: props.actionLabel,
      onAction: props.actionLabel
        ? () => {
            alert("토스트 액션 버튼이 클릭되었습니다!");
          }
        : undefined,
    });
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <AppButton variant="primary" onClick={handleShow}>
        토스트 띄우기 ({props.status ?? "info"})
      </AppButton>
      <AppButton variant="outline" onClick={clearToasts}>
        모두 지우기
      </AppButton>
    </div>
  );
}

const meta = {
  title: "Shared/UI/Toast",
  component: ToastDemo,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    componentSubtitle:
      "AppToast는 사용자 액션에 대한 피드백을 화면 하단에 플로팅 형태로 노출하는 알림 컴포넌트입니다.",
  },
  decorators: [
    (Story) => (
      <AppToastProvider>
        <div style={{ minHeight: "180px", display: "flex", alignItems: "center" }}>
          <Story />
        </div>
      </AppToastProvider>
    ),
  ],
  argTypes: {
    message: {
      control: { type: "text" },
      description: "토스트에 표시될 메시지 내용입니다.",
    },
    status: {
      control: { type: "radio" },
      options: ["info", "success", "error"],
      description: "토스트의 상태 유형 (좌측 액센트 보더 색상 결정)",
      table: {
        defaultValue: { summary: "info" },
      },
    },
    durationMs: {
      control: { type: "number" },
      description: "토스트가 자동으로 닫히기까지의 시간(ms)",
      table: {
        defaultValue: { summary: "4000" },
      },
    },
    actionLabel: {
      control: { type: "text" },
      description: "우측에 노출할 액션 버튼 텍스트 (옵션)",
    },
  },
  args: {
    message: "새로운 알림이 도착했습니다.",
    status: "info",
    durationMs: 4000,
  },
} satisfies Meta<typeof ToastDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 기본 정보성 토스트 (Info)
 */
export const Info: Story = {
  args: {
    message: "기본 정보 안내 메시지입니다.",
    status: "info",
  },
};

/**
 * 성공 상태 토스트 (Success)
 */
export const Success: Story = {
  args: {
    message: "코스가 성공적으로 저장되었습니다.",
    status: "success",
  },
};

/**
 * 에러 상태 토스트 (Error)
 */
export const ErrorToast: Story = {
  args: {
    message: "요청 처리 중 오류가 발생했습니다.",
    status: "error",
  },
};

/**
 * 되돌리기(Undo) 등의 액션 버튼이 포함된 토스트
 */
export const WithAction: Story = {
  args: {
    message: "장소가 목록에서 제거되었습니다.",
    status: "info",
    actionLabel: "실행 취소",
  },
};

/**
 * 전체 상태 모음 인터랙션 갤러리
 */
export const StatusGallery: Story = {
  render: () => {
    function Gallery() {
      const { showToast } = useAppToast();
      return (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <AppButton
            variant="secondary"
            onClick={() => showToast({ message: "안내 메시지입니다.", status: "info" })}
          >
            Info 토스트
          </AppButton>
          <AppButton
            variant="strong"
            onClick={() => showToast({ message: "저장이 완료되었습니다.", status: "success" })}
          >
            Success 토스트
          </AppButton>
          <AppButton
            variant="danger"
            onClick={() => showToast({ message: "네트워크 오류가 발생했습니다.", status: "error" })}
          >
            Error 토스트
          </AppButton>
          <AppButton
            variant="outline"
            onClick={() =>
              showToast({
                message: "삭제되었습니다.",
                actionLabel: "실행 취소",
                onAction: () => alert("되돌리기 실행!"),
              })
            }
          >
            Action 토스트
          </AppButton>
        </div>
      );
    }
    return <Gallery />;
  },
};
