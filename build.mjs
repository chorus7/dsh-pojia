#!/usr/bin/env node
/**
 * dsh-pojia 打包器
 *
 * 用法：
 *   node build.mjs              产出到 ./dist
 *   node build.mjs --out DIR    指定输出目录
 *
 * 产出三类：
 *   1. dsh-pojia-<ver>.zip        技能包，直接解到 $DSH_HOME/skills/ 即可用
 *   2. dsh-pojia-prompt-<ver>.md  单文件纯提示词，喂给任意模型
 *   3. dsh-pojia-<ver>/           未压缩目录，便于二次修改
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERSION = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8")).version || 1;
const STAMP = `${new Date().toISOString().slice(0, 10)}`;

const args = process.argv.slice(2);
const outIdx = args.indexOf("--out");
const OUT = outIdx >= 0 && args[outIdx + 1] ? path.resolve(args[outIdx + 1]) : path.join(HERE, "dist");

/** 打包时排除的东西：构建产物、版本控制、CI 配置、临时文件。 */
const EXCLUDE_DIRS = new Set(["dist", "node_modules", ".git", ".github"]);
const EXCLUDE_PATTERNS = [/\.tmp-/, /\.bak$/, /~$/, /^\.DS_Store$/, /^Thumbs\.db$/, /^\.gitignore$/, /^\.gitattributes$/];

function shouldSkip(name) {
  return EXCLUDE_DIRS.has(name) || EXCLUDE_PATTERNS.some((re) => re.test(name));
}

function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (shouldSkip(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full));
  }
  return out.sort();
}

function copyTree(src, dst) {
  const files = walk(src);
  for (const rel of files) {
    const to = path.join(dst, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(src, rel), to);
  }
  return files;
}

const cfg = JSON.parse(fs.readFileSync(path.join(HERE, "config.json"), "utf8"));
const promptDir = path.join(HERE, "prompts");

/** 单文件提示词：标识 + 全模块正文。按 modules 顺序，默认用 full 预设做完整版。 */
function buildMergedPrompt(list, title) {
  const parts = [];
  if (cfg.identity) parts.push(`# 固定标识\n\n${cfg.identity}`);
  for (const m of list) {
    const fp = path.join(promptDir, `${m}.md`);
    if (!fs.existsSync(fp)) continue;
    parts.push(fs.readFileSync(fp, "utf8").trim());
  }
  const head = [
    `<!-- ${title} -->`,
    `<!-- 生成时间：${STAMP} · 版本：v${VERSION} -->`,
    `<!-- 模块数：${list.length} · 用法：整段贴进任意模型的 system prompt -->`,
    "",
  ].join("\n");
  return `${head}${parts.join("\n\n---\n\n")}\n`;
}

/** 跨平台打包：Windows 用 Compress-Archive，其余平台用 zip 命令。 */
function zipDir(srcDir, zipPath) {
  if (process.platform === "win32") {
    const ps = [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${path.join(srcDir, "*")}' -DestinationPath '${zipPath}' -Force`,
    ];
    execFileSync("powershell.exe", ps, { stdio: "inherit" });
    return;
  }
  // Linux / macOS：zip -r <target> . 
  execFileSync("zip", ["-r", "-q", zipPath, "."], { cwd: srcDir, stdio: "inherit" });
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const pkgName = `dsh-pojia-v${VERSION}`;
  const stage = path.join(OUT, pkgName);
  fs.rmSync(stage, { recursive: true, force: true });

  // 1. 未压缩目录
  const copied = copyTree(HERE, stage);
  console.log(`[1/3] 目录 ${stage}（${copied.length} 个文件）`);

  // 2. 技能包 zip
  const zipPath = path.join(OUT, `${pkgName}.zip`);
  fs.rmSync(zipPath, { force: true });
  zipDir(stage, zipPath);
  const zipSize = fs.statSync(zipPath).size;
  console.log(`[2/3] 技能包 ${path.basename(zipPath)}（${(zipSize / 1024).toFixed(1)} KB）`);

  // 3. 单文件提示词
  const fullList = cfg.profiles?.full || cfg.modules || [];
  const mergedPath = path.join(OUT, `dsh-pojia-prompt-v${VERSION}.md`);
  fs.writeFileSync(mergedPath, buildMergedPrompt(fullList, "dsh-pojia 完整破甲提示词"), "utf8");
  console.log(`[3/3] 单文件提示词 ${path.basename(mergedPath)}（${fullList.length} 个模块）`);

  // 附赠：精简版（只要常驻四件套）
  const baseList = cfg.profiles?.base || ["core", "output", "scope", "ladder"];
  const slimPath = path.join(OUT, `dsh-pojia-prompt-lite-v${VERSION}.md`);
  fs.writeFileSync(slimPath, buildMergedPrompt(baseList, "dsh-pojia 精简破甲提示词"), "utf8");
  console.log(`[+]   精简版 ${path.basename(slimPath)}（${baseList.length} 个模块）`);

  console.log("");
  console.log(`全部产出在 ${OUT}`);
}

main();
