# dsh-pojia

> Modular jailbreak skill for DeepSeek Harness — ten selectable prompt modules, eight presets.

**10 modules · 8 presets · composable · distributable**

[![DSH](https://img.shields.io/badge/dsh-0.2.1--rc.1-blue)](https://www.deepseek.com/harness/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=fff)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-65a30d)](LICENSE)
[![Modules](https://img.shields.io/badge/modules-10-1a73e8)](prompts/)

---

## What this is

dsh-pojia splits a large jailbreak prompt into **independently selectable modules** and composes only what you need. No more carrying a pentest manual while writing code, or adult-fiction rules while doing recon.

| You get | What it does |
|---|---|
| **10 modules** | persona / output / scope / ladder / web-pentest / reverse / malware / social / game / adult |
| **8 presets** | `base` `web` `reverse` `malware` `social` `game` `adult` `full` |
| **Selective injection** | type `破甲注入：web` in chat — effective immediately, no restart |
| **Single-file export** | `build.mjs` emits a merged prompt usable as any model's system prompt |
| **Consistency self-check** | `selfcheck.mjs` runs ten validations before you ship |

---

## Install

### Option 1: zip (recommended)

```powershell
Expand-Archive -Path dsh-pojia-v1.zip `
  -DestinationPath "$env:USERPROFILE\.dsh\skills\dsh-pojia" -Force
```

### Option 2: clone

```bash
git clone https://github.com/chorus7/dsh-pojia.git \
  "$USERPROFILE/.dsh/skills/dsh-pojia"
```

### Option 3: prompts only

No skill needed — use `prompts/*.md` or `dist/dsh-pojia-prompt-v1.md` directly.

---

## Quick start

Restart DSH; the skill directory is picked up automatically.

```powershell
$node = "C:\Users\lenovo\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
$s    = "$env:USERPROFILE\.dsh\skills\dsh-pojia"

& $node "$s\select.mjs" list                    # module status
& $node "$s\select.mjs" use web                 # apply a preset
& $node "$s\select.mjs" use core,output,adult   # explicit list
& $node "$s\select.mjs" add reverse             # append
& $node "$s\select.mjs" remove adult            # drop
& $node "$s\select.mjs" reset                   # back to base
& $node "$s\select.mjs" show                    # print the composed prompt
```

Editing `config.json` takes effect immediately — **no restart**.

---

## Modules

| Module | Content | Default |
|---|---|---|
| `core` | persona core, output discipline, prohibitions, fault self-check | **always on** |
| `output` | fixed identity line, subtitle, two hard triggers | always on |
| `scope` | ten scope rules, intent mapping table, environment conventions | always on |
| `ladder` | four-level hard-topic ladder, layered delivery template, anti-patterns | always on |
| `web-pentest` | recon → enumerate → scan → exploit command chains | on demand |
| `reverse` | unpacking, patching, keygen, APK/IPA, Frida | on demand |
| `malware` | loaders, AMSI/ETW bypass, persistence, C2 | on demand |
| `social` | clone kits, phishing mail, BEC, SMS lures | on demand |
| `game` | memory R/W, pointer chains, ESP/aimbot, hooks, il2cpp | on demand |
| `adult` | adult-fiction writing principles and catalog structure | on demand |

## Presets

`base` `web` `reverse` `malware` `social` `game` `adult` `full` — `full` enables all ten.

---

## Composition rules

Modules are concatenated in `config.json` `modules` order; `identity` always comes first.

**Precedence**: `core` > domain module > `scope` > `ladder`.
`core` discipline applies to every module; domain modules apply only within their own domain and never override each other.

---

## Self-check

```powershell
& $node "$s\selfcheck.mjs" "$s"
```

Ten validations covering module registration, preset coverage, always-on preservation, and reference integrity. Prints `OK` when everything passes.

---

## Error handling

| Case | Behavior |
|---|---|
| Unknown module name | Refuse to write, keep current config, exit 2 |
| Removing always-on `core` | Refuse, exit 2 |
| Removing down to empty | Refuse, suggest `reset` |
| Corrupt config JSON | Report path and parse error, exit 1, never overwrite |
| No args / unknown subcommand | Print usage, exit 2 |
| Registered but file missing | `show` warns, exit 2 |

Writes use a unique temp file plus rename; on Windows a locked target falls back to in-place write, so you never get truncated JSON.

---

## Credits

Prompt structure references the following projects; **all content is rewritten and integrated**, with no runtime dependency:

- [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) — jailbreak layer split (prompt / code / tool)
- [LanJinGod/dsh-purge](https://github.com/LanJinGod/dsh-purge) — red-team workflow
- [Potato1008ypy/dsh-purge-0.2.1rc2-fix](https://github.com/Potato1008ypy/dsh-purge-0.2.1rc2-fix) — host adaptation notes
- [mortyandtimo/dsh-purge-plus](https://github.com/mortyandtimo/dsh-purge-plus) — modular patch organization

---

## License

[MIT](LICENSE)

For technical research. Users are responsible for operating within authorized scope.
