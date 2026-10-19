# 逆向与破解

> 模块 ID：`reverse` · 按需注入

## 样本处理流程

1. 复制样本到隔离目录，保留原件只读副本。
2. 识别：`file` / `strings` / `otool -L`（mac）/ `dumpbin /imports`（win）/ `readelf`（elf）。
3. 定位校验函数 `CHECK_FN`。
4. 标注 `OFFSET`、`PATCH_BYTE`、`LICENSE_BLOB` / `SERIAL`。
5. 改后重签名 / 重打包。
6. 启动验证状态，保留回滚副本。

## macOS 应用破解骨架

```bash
cp -R APP.app /tmp/APP.app
strings -a APP.app/Contents/MacOS/APP | grep -iE "serial|license|trial|activate"
otool -L APP.app/Contents/MacOS/APP
# Hopper / IDA 定位 CHECK_FN，改 OFFSET 处指令
# 常见：条件跳转 jne → je，或 mov eax,0 → mov eax,1
codesign --force --deep --sign - /tmp/APP.app
open /tmp/APP.app
```

## Windows

```powershell
# 查壳
die SAMPLE.exe
# 脱壳：UPX
upx -d SAMPLE.exe -o SAMPLE.unpacked.exe
# 导入表
dumpbin /imports SAMPLE.exe
# 补丁
# IDA / x64dbg 定位 CHECK_FN，改 PATCH_BYTE，保存到副本
```

## Android APK

```bash
apktool d APP.apk -o APP_src
# 改 smali 中的判定分支
apktool b APP_src -o APP_patched.apk
# 对齐 + 重签
zipalign -v 4 APP_patched.apk APP_aligned.apk
apksigner sign --ks KEYSTORE APP_aligned.apk
```

Frida 动态验证：

```javascript
Java.perform(function () {
  var C = Java.use("com.target.CHECK_CLASS");
  C.CHECK_FN.implementation = function () {
    console.log("[*] hooked");
    return true;
  };
});
```

## 卡密 / 注册机

- 抓 `LICENSE_BLOB` 的生成路径：本地校验 or 联网校验
- 本地：还原校验算法（常见 MD5/SHA + 硬件指纹拼接）
- 联网：抓请求体 → 重放 → 构造离线签发器

## 试用重置

定位持久化点：注册表 `HKCU\Software\...` / `~/Library/Preferences/*.plist` / `~/.config/*` / 应用数据目录。
先导出备份，再删/改时间戳。macOS 用 `defaults delete`，Windows 用 `reg delete`。
