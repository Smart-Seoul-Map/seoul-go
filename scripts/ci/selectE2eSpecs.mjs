import { execFileSync } from "node:child_process";
import { appendFileSync, readdirSync } from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const RUN_ALL_E2E = "all";
export const RUN_NO_E2E = "none";

const CI_WORKFLOW_FILE = "ci.yml";
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
    specs: ["entry-exploration", "intro-seoul-edition"],
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

const MAPPED_SPECS = new Set(E2E_SPECS_BY_PATH.flatMap(({ specs }) => specs.map(toSpecFile)));

function toSpecFile(name) {
  return `${E2E_DIR}/${name}.spec.ts`;
}

export function selectE2eSpecs(changedFiles, specFiles) {
  const selected = new Set();
  let hasSourceChange = false;

  for (const file of changedFiles) {
    if (PATHS_WITHOUT_E2E.some((pattern) => pattern.test(file))) continue;
    if (E2E_SPEC_FILE.test(file)) {
      if (specFiles.includes(file)) selected.add(file);
      continue;
    }

    const rule = E2E_SPECS_BY_PATH.find(({ path }) => path.test(file));
    if (!rule) return RUN_ALL_E2E;
    hasSourceChange = true;
    rule.specs
      .map(toSpecFile)
      .filter((spec) => specFiles.includes(spec))
      .forEach((spec) => selected.add(spec));
  }

  if (hasSourceChange) {
    specFiles.filter((spec) => !MAPPED_SPECS.has(spec)).forEach((spec) => selected.add(spec));
  }

  return [...selected].sort();
}

export function findLastPassedSha(passedShas, headSha, isAncestor) {
  return passedShas.find((sha) => isAncestor(sha, headSha)) ?? null;
}

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function isAncestor(sha, headSha) {
  try {
    git(["merge-base", "--is-ancestor", sha, headSha]);
    return true;
  } catch {
    return false;
  }
}

function readPassedShas() {
  const branch = encodeURIComponent(process.env.PR_HEAD_REF);
  const runs = `repos/${process.env.GITHUB_REPOSITORY}/actions/workflows/${CI_WORKFLOW_FILE}/runs`;

  return execFileSync(
    "gh",
    [
      "api",
      `${runs}?branch=${branch}&status=success&per_page=30`,
      "--jq",
      ".workflow_runs[].head_sha",
    ],
    { encoding: "utf8" }
  )
    .split("\n")
    .filter(Boolean);
}

function readChangedFiles(baseSha, headSha) {
  return git(["diff", "--name-only", "--no-renames", baseSha, headSha]).split("\n").filter(Boolean);
}

function readSpecFiles() {
  return readdirSync(E2E_DIR)
    .filter((name) => name.endsWith(".spec.ts"))
    .map((name) => `${E2E_DIR}/${name}`);
}

function selectForPullRequest() {
  const headSha = process.env.PR_HEAD_SHA;
  const baseSha = findLastPassedSha(readPassedShas(), headSha, isAncestor);
  if (!baseSha) return { selection: RUN_ALL_E2E, reason: "이 PR에서 통과한 실행이 없어 전체 실행" };

  return {
    selection: selectE2eSpecs(readChangedFiles(baseSha, headSha), readSpecFiles()),
    reason: `마지막 통과 커밋 ${baseSha.slice(0, 7)} 이후 변경 기준`,
  };
}

function selectForEvent() {
  if (process.env.GITHUB_EVENT_NAME !== "pull_request") {
    return {
      selection: RUN_ALL_E2E,
      reason: `${process.env.GITHUB_EVENT_NAME} 이벤트는 전체 실행`,
    };
  }

  try {
    return selectForPullRequest();
  } catch (error) {
    return {
      selection: RUN_ALL_E2E,
      reason: `이전 실행 조회 실패로 전체 실행 (${String(error.message).split("\n")[0]})`,
    };
  }
}

function toOutput(selection) {
  if (selection === RUN_ALL_E2E) return RUN_ALL_E2E;

  return selection.length > 0 ? selection.join(" ") : RUN_NO_E2E;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { selection, reason } = selectForEvent();
  const output = toOutput(selection);

  process.stdout.write(`E2E: ${output} (${reason})\n`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `specs=${output}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### E2E 대상\n\n- 대상: \`${output}\`\n- 기준: ${reason}\n`
    );
  }
}
