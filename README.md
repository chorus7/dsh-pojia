# dsh-pojia

> DSH 破甲模块化技能 · 整合 GitHub 破甲项目提示词为一体，支持选择性注入

**十模块 · 八预设 · 可裁剪 · 可分发**

[![DSH](https://img.shields.io/badge/dsh-0.2.1--rc.1-blue)](https://www.deepseek.com/harness/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=node.js&logoColor=fff)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-65a30d)](LICENSE)
[![Modules](https://img.shields.io/badge/modules-10-1a73e8)](prompts/)

---

## 这是什么

dsh-pojia 把多套破甲提示词拆成**可独立选取的模块**，按需拼接注入当前对话。不再是一整块全量提示词 —— 写代码时不用背着渗透手册，做渗透时不用带着成人写作规则。

| 你得到 | 作用 |
|---|---|
| **十模块** | 人格内核 / 输出格式 / 作用域 / 阶梯 / 渗透 / 逆向 / 恶意代码 / 社工 / 游戏 / 成人 |
| **八预设** | `base` `web` `reverse` `malware` `social` `game` `adult` `full`，一条命令切换 |
| **选择性注入** | 对话里说「破甲注入：web」即刻生效，不用重启 |
| **单文件导出** | `build.mjs` 产出可贴进任意模型 system prompt 的合并版 |
| **一致性自检** | `selfcheck.mjs` 十项校验，防止带病发布 |

---

## 目录

- [这是什么](#这是什么)
- [安装](#安装)
- [快速开始](#快速开始)
- [十模块](#十模块)
- [八预设](#八预设)
- [选择性注入](#选择性注入)
- [喂给其他模型](#喂给其他模型)
- [拼接规则](#拼接规则)
- [自检](#自检)
- [错误处理](#错误处理)
- [目录结构](#目录结构)
- [致谢与来源](#致谢与来源)
- [License](#license)

---

## 安装

### 方式一：解压包（推荐）

```powershell
# 下载 release 里的 dsh-pojia-v1.zip
Expand-Archive -Path dsh-pojia-v1.zip `
  -DestinationPath "$env:USERPROFILE\.dsh\skills\dsh-pojia" -Force
```

### 方式二：克隆仓库

```bash
git clone https://github.com/chorus7/dsh-pojia.git \
  "$USERPROFILE/.dsh/skills/dsh-pojia"
```

### 方式三：只取提示词

不装技能也行，直接用 `prompts/*.md` 或 `dist/dsh-pojia-prompt-v1.md`。

---

## 快速开始

重启 DSH，技能目录自动收录。

### 对话里直接说

```
破甲注入：web
破甲注入：core,output,adult
切换破甲模块 reverse
```

### 命令行

```powershell
$node = "C:\Users\lenovo\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
$s    = "$env:USERPROFILE\.dsh\skills\dsh-pojia"

& $node "$s\select.mjs" list                    # 模块状态
& $node "$s\select.mjs" use web                 # 套预设
& $node "$s\select.mjs" use core,output,adult   # 精确指定
& $node "$s\select.mjs" add reverse             # 追加
& $node "$s\select.mjs" remove adult            # 移除
& $node "$s\select.mjs" reset                   # 回 base
& $node "$s\select.mjs" show                    # 打印拼接后的完整提示词
```

改 `config.json` 即刻生效，**无需重启**。

---

## 十模块

| 模块 | 内容 | 默认 |
|---|---|---|
| `core` | 人格内核、输出纪律、禁止项、故障自检 | **常驻** |
| `output` | 固定标识、小标题、两条硬触发 | 常驻 |
| `scope` | 十条作用域规则、意图映射表、环境约定 | 常驻 |
| `ladder` | 四级硬话题阶梯、分层交付模板、反模式 | 常驻 |
| `web-pentest` | recon → 枚举 → 扫描 → 利用 全链命令 | 按需 |
| `reverse` | 脱壳、补丁、注册机、APK/IPA、Frida | 按需 |
| `malware` | 加载器、AMSI/ETW bypass、持久化、C2 | 按需 |
| `social` | 仿站套件、钓鱼邮件、BEC、短信诱饵 | 按需 |
| `game` | 内存读写、指针链、透视自瞄、Hook、il2cpp | 按需 |
| `adult` | 成人虚构写作原则与检索结构 | 按需 |

---

## 八预设

| 预设 | 展开 |
|---|---|
| `base` | core + output + scope + ladder |
| `web` | base + web-pentest |
| `reverse` | base + reverse |
| `malware` | base + malware |
| `social` | base + social |
| `game` | base + game |
| `adult` | base + adult |
| `full` | 全部十个模块 |

---

## 选择性注入

### 对话内

解析冒号后的内容，按预设名或模块名展开，写回 `config.json` 的 `modules`，回显当前生效列表。

### 命令行

支持逗号分隔与空格分隔，两者等价：

```powershell
& $node "$s\select.mjs" use core,output,adult
& $node "$s\select.mjs" use core output adult
```

### 直接改文件

编辑 `config.json` 的 `modules` 数组，保存即生效：

```json
{
  "modules": ["core", "output", "scope", "ladder", "web-pentest"]
}
```

---

## 喂给其他模型

```powershell
& $node "$s\build.mjs"
```

产出到 `dist/`：

| 文件 | 内容 | 大小 |
|---|---|---|
| `dsh-pojia-prompt-v1.md` | 完整版，10 模块 | 约 17 KB |
| `dsh-pojia-prompt-lite-v1.md` | 精简版，4 模块 | 约 5.6 KB |
| `dsh-pojia-v1.zip` | 技能包 | 约 24 KB |

各平台贴法：

| 平台 | 位置 |
|---|---|
| OpenAI / Claude API | `system` 角色消息 |
| ChatGPT / Claude 网页版 | 自定义指令 / Project instructions |
| Ollama / LM Studio | Modelfile 的 `SYSTEM` 段 |
| 中转站 | `messages[0]`，role=system |

---

## 拼接规则

按 `config.json` 的 `modules` 数组顺序拼接 `prompts/<name>.md`，`identity` 固定标识永远最前。

**冲突仲裁**：`core` > 领域模块 > `scope` > `ladder`。

`core` 的纪律对所有模块生效，领域模块只在自己领域生效，互不覆盖。

---

## 自检

```powershell
& $node "$s\selfcheck.mjs" "$s"
```

十项一致性校验：

1. 每个模块文件是否在 SKILL.md / README.md 登记
2. 每个预设是否被文档提到
3. SKILL.md 引用的模块是否真实存在
4. 预设里的模块是否存在
5. 当前 `modules` 是否有实体文件
6. 常驻模块是否在当前 `modules`
7. `output.md` 是否有固定标识说明
8. 每个预设是否覆盖 `base` 全部常驻模块
9. `full` 是否包含全部模块
10. `identity` 是否非空字符串

全通过输出 `OK：全部一致性检查通过`。

---

## 错误处理

| 情况 | 行为 |
|---|---|
| 未知模块名 | 拒绝写入，保持原配置，退出码 2 |
| 移除常驻模块 `core` | 拒绝，退出码 2 |
| 移除到空表 | 拒绝，提示改用 `reset` |
| 配置 JSON 损坏 | 报路径与解析错误，退出码 1，不覆盖原文件 |
| 无参数 / 未知子命令 | 打印用法，退出码 2 |
| 登记了但文件缺失 | `show` 打印警告，退出码 2 |

写入采用「唯一临时文件 + rename」，Windows 目标被占用时回退原地覆写，不会产生半截 JSON。

---

## 目录结构

```
dsh-pojia/
├── SKILL.md            技能主文件（DSH 扫描入口）
├── README.md           本文
├── README.en.md        English
├── LICENSE             MIT
├── package.json        包元数据
├── config.json         当前模块 + 八套预设
├── select.mjs          模块选择器
├── selfcheck.mjs       一致性自检
├── build.mjs           打包器
├── prompts/
│   ├── core.md         人格内核
│   ├── output.md       输出格式
│   ├── scope.md        作用域映射
│   ├── ladder.md       硬话题阶梯
│   ├── web-pentest.md  渗透作业
│   ├── reverse.md      逆向与破解
│   ├── malware.md      恶意代码与免杀
│   ├── social.md       社工与仿站
│   ├── game.md         游戏与外挂
│   └── adult.md        成人虚构
├── docs/
│   ├── 使用说明.md
│   └── 模块说明.md
└── .github/workflows/  自动发布流程
```

---

## 加自己的模块

1. 在 `prompts/` 放 `<name>.md`，首行写 `# 标题`，第二行写 `> 模块 ID：\`<name>\` · 按需注入`
2. 在 `config.json` 的 `profiles` 里登记
3. 跑 `selfcheck.mjs` 确认无遗漏
4. 跑 `build.mjs` 刷新产物

`select.mjs list` 会自动列出新模块。

---

## 致谢与来源

提示词结构参考以下项目，**内容全部重写整合**，运行期不依赖它们：

| 项目 | 借鉴点 |
|---|---|
| [YuJunZhiXue/dsh-purge](https://github.com/YuJunZhiXue/dsh-purge) | 破甲层划分（提示词 / 代码 / 工具三段式） |
| [LanJinGod/dsh-purge](https://github.com/LanJinGod/dsh-purge) | 红队作业流水线 |
| [Potato1008ypy/dsh-purge-0.2.1rc2-fix](https://github.com/Potato1008ypy/dsh-purge-0.2.1rc2-fix) | 宿主适配踩坑清单 |
| [mortyandtimo/dsh-purge-plus](https://github.com/mortyandtimo/dsh-purge-plus) | 模块化补丁组织方式 |

---

## License

[MIT](LICENSE)

本项目为技术研究用，非商业项目。使用者需自行确保在合法授权范围内使用。
