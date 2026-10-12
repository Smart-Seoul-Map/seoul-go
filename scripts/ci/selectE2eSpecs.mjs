import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const RUN_ALL_E2E = "all";
export const RUN_NO_E2E = "none";

const E2E_DIR = "tests/e2e";
const E2E_SPEC_FILE = /^tests\/e2e\/[^/]+\.spec\.ts$/;

const PATHS_WITHOUT_E2E = [
  /\.md$/,
  /^docs\//,
  /\.(test|stories)\.tsx?$/,
  /^\.storybook\//,
  /^functions\//,
  /^worker\//,
  /^scripts\/(?!ci\/)/,
  /^\.github\/(?!workflows\/ci\.yml$)/,
  /^(eslint\.config\.js|\.prettierrc|\.prettierignore|wrangler\.toml)$/,
];

const E2E_SPECS_BY_PATH = [
  {
    path: /^(src\/features\/entry-exploration|public\/models\/places)\//,
    specs: ["entry-exploration", "entry-slot", "intro-seoul-edition"],
  },
  {
    path: /^(src\/features\/exploration|public\/models\/markers)\//,
    specs: [
      "intro-seoul-edition",
      "linked-place-exploration",
      "place-query-cache",
      "stamp-course-image",
    ],
  },
  {
    path: /^src\/features\/course\//,
    specs: ["linked-place-exploration", "stamp-course-image"],
  },
];

export function selectE2eSpecs(changedFiles, specFiles) {
  const selected = new Set();

  for (const file of changedFiles) {
    if (PATHS_WITHOUT_E2E.some((pattern) => pattern.test(file))) continue;
    if (E2E_SPEC_FILE.test(file)) {
      if (specFiles.includes(file)) selected.add(file);
      continue;
    }

    const rule = E2E_SPECS_BY_PATH.find(({ path }) => path.test(file));
    if (!rule) return RUN_ALL_E2E;
    rule.specs
      .map((name) => `${E2E_DIR}/${name}.spec.ts`)
      .filter((spec) => specFiles.includes(spec))
      .forEach((spec) => selected.add(spec));
  }

  return [...selected].sort();
}

function readChangedFiles() {
  return execFileSync("git", ["diff", "--name-only", "--no-renames", "HEAD^1", "HEAD"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
}

function readSpecFiles() {
  return readdirSync(E2E_DIR)
    .filter((name) => name.endsWith(".spec.ts"))
    .map((name) => `${E2E_DIR}/${name}`);
}

function toOutput(selection) {
  if (selection === RUN_ALL_E2E) return RUN_ALL_E2E;

  return selection.length > 0 ? selection.join(" ") : RUN_NO_E2E;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const selection =
    process.env.GITHUB_EVENT_NAME === "pull_request"
      ? selectE2eSpecs(readChangedFiles(), readSpecFiles())
      : RUN_ALL_E2E;
  const output = toOutput(selection);

  process.stdout.write(`E2E: ${output}
`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `specs=${output}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### E2E 대상\n\n\`${output}\`\n`);
  }
}
