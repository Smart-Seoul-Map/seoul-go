import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { ExplorationMapCallout } from "./ExplorationMapCallout";

afterEach(cleanup);

function renderCallout(props: { expandKey?: string; isCharacterMoving?: boolean } = {}) {
  return render(<ExplorationMapCallout role="status" description="안내 문구" {...props} />);
}

test("starts expanded and toggles from the callout button", () => {
  renderCallout();
  expect(screen.getByRole("status")).toHaveTextContent("안내 문구");

  fireEvent.click(screen.getByRole("button", { name: "안내 접기" }));
  expect(screen.getByRole("button", { name: "안내 펼치기" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );

  fireEvent.click(screen.getByRole("button", { name: "안내 펼치기" }));
  expect(screen.getByRole("button", { name: "안내 접기" })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
});

test("collapses when the character starts moving and expands again for a new notice", () => {
  const view = renderCallout({ expandKey: "a" });

  view.rerender(
    <ExplorationMapCallout role="status" description="안내 문구" expandKey="a" isCharacterMoving />
  );
  expect(screen.getByRole("button", { name: "안내 펼치기" })).toBeInTheDocument();

  view.rerender(<ExplorationMapCallout role="status" description="안내 문구" expandKey="a" />);
  expect(screen.getByRole("button", { name: "안내 펼치기" })).toBeInTheDocument();

  view.rerender(<ExplorationMapCallout role="status" description="안내 문구" expandKey="b" />);
  expect(screen.getByRole("button", { name: "안내 접기" })).toBeInTheDocument();
});
