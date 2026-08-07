/* eslint-disable */
import { Octokit } from "@octokit/rest";
import { Client } from "@notionhq/client";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function run() {
  const [repoOwner, repoName] = process.env.GITHUB_REPOSITORY.split("/");

  const targetBranch = process.env.TARGET_BRANCH || "main";
  const baseBranch = process.env.BASE_BRANCH || "dev";

  // 1. targetBranch의 가장 최근 커밋 조회 (이전 main 배포 시점 확인용)
  const mainCommits = await octokit.rest.repos.listCommits({
    owner: repoOwner,
    repo: repoName,
    sha: targetBranch,
    per_page: 2,
  });

  const lastMainDeployDate =
    mainCommits.data[1]?.commit.committer.date ||
    new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // 2. baseBranch에 닫힌 PR 목록 조회
  const prs = await octokit.paginate(octokit.rest.pulls.list, {
    owner: repoOwner,
    repo: repoName,
    state: "closed",
    base: baseBranch,
    sort: "updated",
    direction: "desc",
  });

  // 3. 지난 main 배포 시점 이후 ~ 현재 사이에 dev로 머지된 PR만 필터링
  const newMergedPRs = prs.filter((pr) => pr.merged_at && pr.merged_at > lastMainDeployDate);

  if (newMergedPRs.length === 0) {
    console.log("새롭게 추가된 PR이 없습니다.");
    return;
  }

  const prTextList = newMergedPRs
    .map(
      (pr) =>
        `- PR #${pr.number}: ${pr.title} (작성자: ${pr.user.login})\n  내용: ${pr.body ? pr.body.slice(0, 500) : "설명 없음"}`
    )
    .join("\n\n");

  const today = new Date().toISOString().split("T")[0];
  const releaseId = `v0.2.0-${today}`;

  // 4. 노션 DB에 신규 릴리즈 노트 생성
  await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      release_id: { title: [{ text: { content: releaseId } }] },
      deployed_at: { date: { start: today } },
      status: { select: { name: "draft" } },
      pr_count: { number: newMergedPRs.length },
      pr_list_text: { rich_text: [{ text: { content: prTextList.slice(0, 2000) } }] },
      validation_status: { select: { name: "unchecked" } },
    },
    children: [
      {
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [
            { type: "text", text: { content: "📋 이번 릴리즈 신규 포함 PR Raw 데이터" } },
          ],
        },
      },
      {
        object: "block",
        type: "code",
        code: {
          rich_text: [{ type: "text", text: { content: prTextList } }],
          language: "markdown",
        },
      },
    ],
  });

  console.log(
    `✅ 이번 릴리즈 신규 PR ${newMergedPRs.length}개 수집 및 노션 전송 완료: ${releaseId}`
  );
}

run().catch(console.error);
