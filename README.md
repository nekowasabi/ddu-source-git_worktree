# ddu-source-git-worktree

`git worktree` source for [ddu.vim](https://github.com/Shougo/ddu.vim)

## Requirements

- [Deno](https://deno.land/)
- [ddu.vim](https://github.com/Shougo/ddu.vim)
- [Denops](https://github.com/vim-denops/denops.vim)
- [ddu-kind-file](https://github.com/Shougo/ddu-kind-file)
- [neovim](https://neovim.io/)

## Install

Add to your `init.vim` or `init.lua`:

```vim
call plug#begin('~/.vim/plugged')
Plug 'your-username/ddu-source-git-worktree'
call plug#end()
```

After adding the lines, run `:PlugInstall` in your editor to install the plugin.

## Settings

```vim
call ddu#custom#patch_global(#{
    \   sourceOptions: #{
    \     worktree: #{
    \       kind: 'file',
    \       defaultAction: 'cd',
    \     },
    \   },
    \ })
```

## Usage

### List worktrees

```vim
:Ddu worktree
```

Or using key mapping:

```vim
nnoremap <Leader>tw <Cmd>call ddu#start({'name': 'worktree', 'sources': [{'name': 'worktree'}]})<CR>
```

### Actions

| Action | Description |
|--------|-------------|
| `add` | Add a new worktree. Prompts for branch name and path |
| `remove` | Remove a worktree. Prompts for confirmation |
| `cd` | Change current working directory to the selected worktree |

### Example Key Mappings

```vim
" Add key mappings for worktree actions
autocmd FileType ddu-ff call s:ddu_worktree_settings()

function! s:ddu_worktree_settings() abort
  nnoremap <buffer> <silent> a <Cmd>call ddu#ui#do_action('add')<CR>
  nnoremap <buffer> <silent> d <Cmd>call ddu#ui#do_action('remove')<CR>
  nnoremap <buffer> <silent> c <Cmd>call ddu#ui#do_action('cd')<CR>
endfunction
```

## License

MIT
