// @vitest-environment node
import { expect, test } from "vitest";

import {
  findLastPassedSha,
  RUN_ALL_E2E,
  selectE2eSpecs,
} from "../../scripts/ci/selectE2eSpecs.mjs";

const SPECS = [
  "tests/e2e/app-smoke.spec.ts",
  "tests/e2e/entry-exploration.spec.ts",
  "tests/e2e/intro-seoul-edition.spec.ts",
  "tests/e2e/linked-place-exploration.spec.ts",
  "tests/e2e/place-query-cache.spec.ts",
  "tests/e2e/stamp-course-image.spec.ts",
];
const INTRO_SPECS = [
  "tests/e2e/entry-exploration.spec.ts",
  "tests/e2e/intro-seoul-edition.spec.ts",
];
const UNMAPPED_SPEC = "tests/e2e/app-smoke.spec.ts";

test("runs the intro specs and unmapped specs for entry exploration code and place models", () => {
  expect(
    selectE2eSpecs(
      [
        "src/features/entry-exploration/config/entryEditionModels.ts",
        "public/models/places/achasan_eoullim_garden.glb",
      ],
      SPECS
    )
  ).toEqual([UNMAPPED_SPEC, ...INTRO_SPECS]);
});

test("runs the exploration specs for exploration code and linked place markers", () => {
  expect(
    selectE2eSpecs(
      ["src/features/exploration/presentation/ExplorationPage.tsx", "public/models/markers/a.glb"],
      SPECS
    )
  ).toEqual([
    UNMAPPED_SPEC,
    "tests/e2e/intro-seoul-edition.spec.ts",
    "tests/e2e/linked-place-exploration.spec.ts",
    "tests/e2e/place-query-cache.spec.ts",
    "tests/e2e/stamp-course-image.spec.ts",
  ]);
});

test("runs the course specs for course code", () => {
  expect(selectE2eSpecs(["src/features/course/domain/course.ts"], SPECS)).toEqual([
    UNMAPPED_SPEC,
    "tests/e2e/linked-place-exploration.spec.ts",
    "tests/e2e/stamp-course-image.spec.ts",
  ]);
});

test("merges the specs of every changed area without duplicates", () => {
  expect(
    selectE2eSpecs(["src/features/entry-exploration/a.ts", "src/features/course/b.ts"], SPECS)
  ).toEqual([
    UNMAPPED_SPEC,
    ...INTRO_SPECS,
    "tests/e2e/linked-place-exploration.spec.ts",
    "tests/e2e/stamp-course-image.spec.ts",
  ]);
});

test("runs a newly added spec missing from the path rules whenever source code changes", () => {
  const specs = [...SPECS, "tests/e2e/new-feature.spec.ts"];

  expect(selectE2eSpecs(["src/features/course/a.ts"], specs)).toContain(
    "tests/e2e/new-feature.spec.ts"
  );
});

test("runs only a changed spec when no source code changes", () => {
  expect(selectE2eSpecs(["tests/e2e/entry-exploration.spec.ts"], SPECS)).toEqual([
    "tests/e2e/entry-exploration.spec.ts",
  ]);
  expect(selectE2eSpecs(["tests/e2e/removed.spec.ts"], SPECS)).toEqual([]);
});

test("skips E2E for documents, unit tests, stories and code outside the preview app", () => {
  expect(
    selectE2eSpecs(
      [
        "README.md",
        "docs/agents/git-workflow.md",
        "src/features/entry-exploration/domain/entryIntroLayout.test.ts",
        "src/shared/ui/button/AppButton.stories.tsx",
        "tests/placeImageProxy.test.ts",
        "functions/api/place-image.ts",
        "worker/index.ts",
        "scripts/release/auto-release.js",
        ".github/workflows/release-note.yml",
        ".github/pull_request_template.md",
      ],
      SPECS
    )
  ).toEqual([]);
});

test.each([
  "src/features/places/data/smartSeoulThemeApi.ts",
  "src/app/router/AppRouter.tsx",
  "src/shared/ui/button/AppButton.tsx",
  "src/main.tsx",
  "public/models/characters/haechi.glb",
  "tests/e2e/helpers/introEdition.ts",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.mjs",
  "playwright.config.ts",
  ".github/workflows/ci.yml",
  "scripts/ci/selectE2eSpecs.mjs",
])("runs every spec when %s changes", (file) => {
  expect(selectE2eSpecs(["src/features/course/a.ts", file], SPECS)).toBe(RUN_ALL_E2E);
});

test("uses the newest passed commit that is still in the branch history", () => {
  const history = new Set(["c3", "c1"]);
  const isAncestor = (sha: string) => history.has(sha);

  expect(findLastPassedSha(["amended", "c3", "c1"], "head", isAncestor)).toBe("c3");
});

test("finds no passed commit on the first run or after history was rewritten", () => {
  expect(findLastPassedSha([], "head", () => true)).toBeNull();
  expect(findLastPassedSha(["amended"], "head", () => false)).toBeNull();
});
