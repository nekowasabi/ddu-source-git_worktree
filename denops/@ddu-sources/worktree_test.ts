import { assertEquals } from "jsr:@std/assert@^1.0.0";

function parseWorktreeList(output: string): Array<{ path: string; commit: string; branch?: string }> {
  const lines = output.trim().split("\n");
  const worktrees: Array<{ path: string; commit: string; branch?: string }> = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;

    const path = parts[0];
    const commit = parts[1];
    let branch: string | undefined;

    if (parts.length >= 3) {
      branch = parts.slice(2).join(" ").replace(/^\[|\]$/g, "");
    }

    worktrees.push({ path, commit, branch });
  }

  return worktrees;
}

Deno.test("parseWorktreeList - basic", () => {
  const output = "/path/to/main  HEAD\n/path/to/feature  abc1234 [feature-branch]";
  const result = parseWorktreeList(output);
  assertEquals(result.length, 2);
  assertEquals(result[0].path, "/path/to/main");
  assertEquals(result[0].commit, "HEAD");
  assertEquals(result[0].branch, undefined);
  assertEquals(result[1].path, "/path/to/feature");
  assertEquals(result[1].commit, "abc1234");
  assertEquals(result[1].branch, "feature-branch");
});

Deno.test("parseWorktreeList - detached HEAD", () => {
  const output = "/path/to/detached  abc1234 (detached HEAD)";
  const result = parseWorktreeList(output);
  assertEquals(result.length, 1);
  assertEquals(result[0].path, "/path/to/detached");
  assertEquals(result[0].commit, "abc1234");
  assertEquals(result[0].branch, "(detached HEAD)");
});
