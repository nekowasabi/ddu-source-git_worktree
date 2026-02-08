import {
  BaseSource,
  type GatherArguments,
} from "https://deno.land/x/ddu_vim@v5.0.0/base/source.ts";
import type { ActionData } from "https://deno.land/x/ddu_kind_file@v0.8.0/file.ts";
import {
  type ActionArguments,
  ActionFlags,
  type Item,
} from "https://deno.land/x/ddu_vim@v5.0.0/types.ts";

export type WorktreeData = {
  path: string;
  commit: string;
  branch?: string;
};

type Params = Record<PropertyKey, never>;

function parseWorktreeList(output: string): Array<{
  path: string;
  commit: string;
  branch?: string;
}> {
  const lines = output.trim().split("\n");
  const worktrees: Array<{ path: string; commit: string; branch?: string }> =
    [];

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

async function runGitCommand(
  args: string[],
  cwd?: string,
): Promise<string> {
  const command = new Deno.Command("git", {
    args,
    cwd,
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout, success, stderr } = await command.output();

  if (!success) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  return new TextDecoder().decode(stdout);
}

export class Source extends BaseSource<Params> {
  override kind = "file";

  gather({
    sourceOptions,
  }: GatherArguments<Params>): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        try {
          const cwd = String(sourceOptions.path) || Deno.cwd();

          const output = await runGitCommand(["worktree", "list"], cwd);
          const worktrees = parseWorktreeList(output);

          const items: Item<ActionData>[] = worktrees.map((wt) => {
            const display = wt.branch
              ? `${wt.branch} - ${wt.path}`
              : `${wt.commit} - ${wt.path}`;

            return {
              word: display,
              display,
              action: {
                path: wt.path,
              },
              data: {
                path: wt.path,
                commit: wt.commit,
                branch: wt.branch,
              } satisfies WorktreeData,
            };
          });

          controller.enqueue(items);
        } catch (e: unknown) {
          console.error("Failed to gather worktrees:", e);
        } finally {
          controller.close();
        }
      },
    });
  }

  params(): Params {
    return {};
  }

  override actions = {
    remove: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      for (const item of args.items) {
        const action = item.action as ActionData;
        if (!action.path) continue;

        const confirm = await args.denops.call(
          "input",
          `Remove worktree at ${action.path}? (y/N): `,
        ) as string;

        if (confirm.toLowerCase() !== "y") {
          continue;
        }

        try {
          await runGitCommand(["worktree", "remove", action.path]);
          await args.denops.call(
            "ddu#kind#file#print",
            `Removed: ${action.path}`,
          );
        } catch (e: unknown) {
          await args.denops.call(
            "ddu#kind#file#print",
            `Failed to remove: ${e}`,
          );
        }
      }

      return ActionFlags.RefreshItems;
    },

    add: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      const cwd = String(args.sourceOptions.path) || Deno.cwd();

      const branch = await args.denops.call(
        "input",
        "Branch name: ",
      ) as string;

      if (!branch) {
        await args.denops.call(
          "ddu#kind#file#print",
          "Branch name is required",
        );
        return ActionFlags.None;
      }

      const path = await args.denops.call(
        "input",
        `Worktree path (default: ../${branch}): `,
        `../${branch}`,
      ) as string;

      try {
        await runGitCommand(
          ["worktree", "add", path, branch],
          cwd,
        );
        await args.denops.call("ddu#kind#file#print", `Added: ${path}`);
      } catch (e: unknown) {
        await args.denops.call("ddu#kind#file#print", `Failed to add: ${e}`);
      }

      return ActionFlags.RefreshItems;
    },

    cd: async (args: ActionArguments<Params>): Promise<ActionFlags> => {
      for (const item of args.items) {
        const action = item.action as ActionData;
        if (!action.path) continue;

        // git rev-parse --show-toplevel を使用してトップディレクトリを取得
        let targetPath = action.path;
        try {
          const output = await runGitCommand(
            ["rev-parse", "--show-toplevel"],
            action.path,
          );
          targetPath = output.trim();
        } catch (e: unknown) {
          // git rev-parse が失敗した場合は action.path にフォールバック
          console.warn(
            `git rev-parse failed for ${action.path}, falling back to original path:`,
            e,
          );
        }

        await args.denops.call("chdir", targetPath);
        await args.denops.call(
          "ddu#kind#file#print",
          `Changed directory to: ${targetPath}`,
        );
        break;
      }

      return ActionFlags.None;
    },
  };
}

export { Source as worktree };
