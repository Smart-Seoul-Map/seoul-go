import { describe, expect, test } from "vitest";

import { createStampCourseImageFileName } from "./stampCourseImageFileName";

describe("createStampCourseImageFileName", () => {
  test("builds a dated png file name", () => {
    expect(createStampCourseImageFileName(new Date(2026, 8, 7))).toBe(
      "seoul-go-stamp-course-20260907.png"
    );
  });
});
