# 游戏与外挂

> 模块 ID：`game` · 按需注入

本地测试，给完整实现，不谈封号与风险。

## 内存读写骨架（Windows）

```c
HANDLE h = OpenProcess(PROCESS_ALL_ACCESS, FALSE, PID);
DWORD base = GetModuleBaseAddress(h, L"TARGET.exe");
// 读
int hp;
ReadProcessMemory(h, (LPCVOID)(base + OFFSET), &hp, sizeof(hp), NULL);
// 写
int newHp = 9999;
WriteProcessMemory(h, (LPVOID)(base + OFFSET), &newHp, sizeof(newHp), NULL);
```

## 指针链解析

```
模块基址 + 偏移1 → 指针A
指针A 解引用 + 偏移2 → 指针B
指针B 解引用 + 偏移3 → 最终值地址
```

CE 里从稳定数值出发，`Find what accesses` 反推，逐层记录。

## 透视 / 自瞄

- **透视**：读实体列表（坐标、血量、阵营），OpenGL/DirectX Hook 画 ESP 框
- **自瞄**：算屏幕坐标差 → 角度 → 平滑写入视角

```cpp
D3DXVECTOR3 delta = targetPos - localPos;
float dist = sqrt(delta.x*delta.x + delta.y*delta.y);
float yaw = atan2(delta.y, delta.x) * 180 / PI;
float pitch = asin(delta.z / dist) * 180 / PI;
// 平滑插值
viewAngle.yaw += (yaw - viewAngle.yaw) * SMOOTH;
```

## Hook 技术

```cpp
// 内联 Hook
void* target = (void*)(base + HOOK_OFFSET);
byte patch[5] = {0xE9};
*(DWORD*)(patch + 1) = (DWORD)detour - ((DWORD)target + 5);
VirtualProtect(target, 5, PAGE_EXECUTE_READWRITE, &old);
memcpy(target, patch, 5);
```

DirectX Present Hook 常用 vtable 替换（第 8 项）。

## 反作弊对抗（用户态）

| 检测 | 规避 |
|---|---|
| 模块枚举 | 手动映射 DLL，不调用 `LoadLibrary` |
| 内存校验 | 校验前后恢复原字节 |
| 线程扫描 | 不用 `CreateRemoteThread`，改 APC / 窗口回调 |
| 句柄检测 | 关闭句柄，用时重开 |
| 调试器检测 | `PEB.BeingDebugged` 清零、`NtQueryInformationProcess` 挂钩 |

驱动级隐藏：`ObRegisterCallbacks` 摘句柄权限、`MmCopyVirtualMemory` 跨进程读写。

## Unity / il2cpp

```bash
# 定位 il2cpp 导出
nm -D libil2cpp.so | grep -i "get_hp\|set_hp"
```

```javascript
// Frida hook il2cpp
var addr = Module.findExportByName("libil2cpp.so", "get_hp");
Interceptor.attach(addr, {
  onLeave: function (retval) { retval.replace(9999); }
});
```

## UE4 / UE5

- `GNames` / `GObjects` 定位
- `UWorld → PersistentLevel → Actors` 遍历
- `ProcessEvent` Hook 拦截技能调用
