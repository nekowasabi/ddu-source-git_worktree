import type { Denops } from "https://deno.land/x/denops_std@v6.5.1/mod.ts";
import { Source } from "./@ddu-sources/worktree.ts";

export async function main(denops: Denops): Promise<void> {
  await denops.dispatcher.worktree = Source;
}
