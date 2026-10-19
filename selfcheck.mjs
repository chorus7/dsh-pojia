import fs from "node:fs";
import path from "node:path";

const p = process.argv[2];
const cfg = JSON.parse(fs.readFileSync(path.join(p, "config.json"), "utf8"));
const skill = fs.readFileSync(path.join(p, "SKILL.md"), "utf8");
const readme = fs.readFileSync(path.join(p, "README.md"), "utf8");
const files = fs.readdirSync(path.join(p, "prompts")).map((f) => f.replace(/\.md$/, ""));

const problems = [];

// 1. 每个模块文件是否在 SKILL.md / README.md 里被登记
for (const f of files) {
  const inSkill = skill.includes(f);
  const inReadme = readme.includes(f);
  if (!inSkill) problems.push(`模块 ${f} 未在 SKILL.md 登记`);
  if (!inReadme) problems.push(`模块 ${f} 未在 README.md 登记`);
}

// 2. 每个预设是否被文档提到
for (const k of Object.keys(cfg.profiles)) {
  if (!skill.includes(k)) problems.push(`预设 ${k} 未在 SKILL.md 登记`);
}

// 3. SKILL.md 提到的 prompts/xxx.md 是否真实存在
for (const m of new Set([...skill.matchAll(/prompts\/([a-z-]+)\.md/g)].map((x) => x[1]))) {
  if (!files.includes(m)) problems.push(`SKILL.md 引用了不存在的模块 ${m}`);
}

// 4. 预设里的模块是否都存在
for (const [k, v] of Object.entries(cfg.profiles)) {
  for (const m of v) {
    if (!files.includes(m)) problems.push(`预设 ${k} 引用了不存在的模块 ${m}`);
  }
}

// 5. modules 是否都有实体文件
for (const m of cfg.modules || []) {
  if (!files.includes(m)) problems.push(`当前 modules 引用了不存在的模块 ${m}`);
}

// 6. 常驻模块是否在当前 modules 里
for (const m of ["core"]) {
  if (!(cfg.modules || []).includes(m)) problems.push(`常驻模块 ${m} 不在当前 modules`);
}

// 7. identity 是否在 output.md 有对应说明
if (!/固定标识/.test(fs.readFileSync(path.join(p, "prompts", "output.md"), "utf8"))) {
  problems.push("output.md 缺少固定标识说明");
}

// 8. 每个预设都必须覆盖 base 的全部常驻模块（adult 曾漏掉 ladder）
const base = cfg.profiles?.base || [];
for (const [k, v] of Object.entries(cfg.profiles || {})) {
  const missing = base.filter((m) => !v.includes(m));
  if (missing.length) problems.push(`预设 ${k} 缺少常驻模块 ${missing.join(", ")}`);
}

// 9. full 预设必须包含全部模块文件
const full = cfg.profiles?.full;
if (Array.isArray(full)) {
  const missing = files.filter((m) => !full.includes(m));
  if (missing.length) problems.push(`full 预设缺少模块 ${missing.join(", ")}`);
}

// 10. identity 必须是 config 里的固定串，且非空
if (!cfg.identity || typeof cfg.identity !== "string") {
  problems.push("config.identity 缺失或不是字符串");
}

if (problems.length === 0) {
  console.log("OK：全部一致性检查通过");
} else {
  for (const x of problems) console.log("✗", x);
  process.exitCode = 1;
}
