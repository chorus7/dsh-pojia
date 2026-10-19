#!/usr/bin/env node
/**
 * dsh-pojia 模块选择器
 *
 * 用法：
 *   node select.mjs list                列出全部模块与启用状态
 *   node select.mjs use web             套用预设 web
 *   node select.mjs use core,output,adult  按模块名直接指定
 *   node select.mjs add reverse         追加一个模块
 *   node select.mjs remove adult        移除一个模块
 *   node select.mjs reset               回到 base
 *   node select.mjs show                打印当前拼接后的完整提示词
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROMPT_DIR = path.join(HERE, "prompts");
const CONFIG = path.join(HERE, "config.json");

/** 常驻模块：任何 use/add/remove/reset 之后都必须仍在表里，否则破甲会静默失效。 */
const ALWAYS_ON = ["core"];

/** 读配置。文件缺失/损坏时抛明确错误，不要静默吞成空对象。 */
function readConfig() {
  let raw;
  try {
    raw = fs.readFileSync(CONFIG, "utf8");
  } catch (err) {
    throw new Error(`读不到配置 ${CONFIG}：${err.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`配置不是合法 JSON（${CONFIG}）：${err.message}`);
  }
}

/** 原子写：先写唯一临时文件再 rename，断电/占用/并发都不会留下半截 JSON。 */
function writeConfig(cfg) {
  const tmp = `${CONFIG}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = JSON.stringify(cfg, null, 2) + "\n";
  try {
    fs.writeFileSync(tmp, body, "utf8");
    try {
      fs.renameSync(tmp, CONFIG);
    } catch (renameErr) {
      // Windows 上目标被占用时 rename 会 EPERM/EBUSY：退回原地覆写，仍是完整 JSON。
      fs.writeFileSync(CONFIG, body, "utf8");
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
      if (renameErr.code !== "EPERM" && renameErr.code !== "EBUSY" && renameErr.code !== "EACCES") {
        throw renameErr;
      }
    }
  } catch (err) {
    try { fs.unlinkSync(tmp); } catch { /* 清理失败无所谓 */ }
    throw new Error(`写配置失败（${CONFIG}）：${err.message}`);
  }
}

function moduleFiles() {
  try {
    return fs.readdirSync(PROMPT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.slice(0, -3))
      .sort();
  } catch {
    return [];
  }
}

/** 把 spec 展开成模块列表。预设名与模块名都接受，去重保序。 */
function resolveModules(spec, cfg) {
  const known = new Set(moduleFiles());
  const out = [];
  let hadError = false;
  for (const raw of spec) {
    const name = String(raw).trim();
    if (!name) continue;
    const preset = cfg.profiles?.[name];
    const list = Array.isArray(preset) ? preset : [name];
    for (const item of list) {
      if (!known.has(item)) {
        console.error(`未知模块：${item}（可选：${[...known].join(", ")}）`);
        hadError = true;
        continue;
      }
      if (!out.includes(item)) out.push(item);
    }
  }
  return { modules: out, hadError };
}

/** 补齐常驻模块，并校验结果非空。 */
function finalizeModules(mods) {
  const out = [];
  for (const m of ALWAYS_ON) if (!out.includes(m)) out.push(m);
  for (const m of mods || []) if (!out.includes(m)) out.push(m);
  return out;
}

const isEmpty = (mods) => !Array.isArray(mods) || mods.length === 0;

function cmdList(cfg) {
  const active = new Set(cfg.modules || []);
  console.log("模块\t状态");
  for (const m of moduleFiles()) {
    const tag = active.has(m) ? "启用" : "—";
    const pin = ALWAYS_ON.includes(m) ? "（常驻）" : "";
    console.log(`${m}\t${tag}${pin}`);
  }
  console.log("");
  console.log(`预设：${Object.keys(cfg.profiles || {}).join(", ")}`);
  console.log(`当前：${(cfg.modules || []).join(", ")}`);
}

function cmdShow(cfg) {
  const parts = [];
  const missing = [];
  for (const m of cfg.modules || []) {
    const fp = path.join(PROMPT_DIR, `${m}.md`);
    if (!fs.existsSync(fp)) {
      missing.push(m);
      continue;
    }
    parts.push(fs.readFileSync(fp, "utf8").trim());
  }
  // 缺文件时说清楚，别静默跳过让用户以为模块生效了。
  if (missing.length) {
    console.error(`⚠ 配置里登记了但文件缺失：${missing.join(", ")}`);
    process.exitCode = 2;
  }
  if (cfg.identity) console.log(`# 固定标识\n\n${cfg.identity}\n`);
  console.log(parts.join("\n\n---\n\n"));
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  // 支持逗号分隔、空格分隔、以及两者混用。
  const spec = rest.join(",").split(",").map((s) => s.trim()).filter(Boolean);

  let cfg;
  try {
    cfg = readConfig();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
    return;
  }

  switch (cmd) {
    case "list":
      cmdList(cfg);
      return;
    case "show":
      cmdShow(cfg);
      return;
    case "use": {
      if (!spec.length) {
        console.error("用法：use <预设名|模块名,…>");
        process.exitCode = 2;
        return;
      }
      const r = resolveModules(spec, cfg);
      if (r.hadError) {
        console.error(`已取消写入，保持原配置：${(cfg.modules || []).join(", ")}`);
        process.exitCode = 2;
        return;
      }
      cfg.modules = finalizeModules(r.modules);
      writeConfig(cfg);
      console.log(`已启用：${cfg.modules.join(", ")}`);
      return;
    }
    case "add": {
      if (!spec.length) {
        console.error("用法：add <模块,…>");
        process.exitCode = 2;
        return;
      }
      const r = resolveModules([...(cfg.modules || []), ...spec], cfg);
      if (r.hadError) {
        console.error(`已取消写入，保持原配置：${(cfg.modules || []).join(", ")}`);
        process.exitCode = 2;
        return;
      }
      cfg.modules = finalizeModules(r.modules);
      writeConfig(cfg);
      console.log(`当前：${cfg.modules.join(", ")}`);
      return;
    }
    case "remove": {
      if (!spec.length) {
        console.error("用法：remove <模块,…>");
        process.exitCode = 2;
        return;
      }
      // 未知名字现在会报错，不再静默忽略（改错模块名时能发现）。
      const known = new Set(moduleFiles());
      const drop = new Set();
      let bad = false;
      for (const name of spec) {
        if (!known.has(name)) {
          console.error(`未知模块：${name}`);
          bad = true;
          continue;
        }
        drop.add(name);
      }
      if (bad) {
        console.error(`已取消写入，保持原配置：${(cfg.modules || []).join(", ")}`);
        process.exitCode = 2;
        return;
      }
      const pinned = [...drop].filter((m) => ALWAYS_ON.includes(m));
      if (pinned.length) {
        console.error(`常驻模块不能移除：${pinned.join(", ")}（移除会让破甲静默失效）`);
        process.exitCode = 2;
        return;
      }
      const next = (cfg.modules || []).filter((m) => !drop.has(m));
      if (isEmpty(next)) {
        console.error("拒绝把模块清空；请改用 reset 回到 base");
        process.exitCode = 2;
        return;
      }
      cfg.modules = finalizeModules(next);
      writeConfig(cfg);
      console.log(`当前：${cfg.modules.join(", ")}`);
      return;
    }
    case "reset": {
      const base = cfg.profiles?.base;
      cfg.modules = finalizeModules(Array.isArray(base) && base.length ? base : ["core", "output", "scope", "ladder"]);
      writeConfig(cfg);
      console.log(`已重置：${cfg.modules.join(", ")}`);
      return;
    }
    default:
      console.log(`dsh-pojia 模块选择器

  list                       列出模块与启用状态
  use <预设|模块,…>           套用预设或直接指定模块
  add <模块,…>                追加模块
  remove <模块,…>             移除模块（常驻模块不可移除）
  reset                      回到 base
  show                       打印当前拼接后的完整提示词`);
      if (cmd) process.exitCode = 2;
  }
}

main();
