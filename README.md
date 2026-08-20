# 龙族世界模拟器 - 独立部署版

一个基于江南《龙族》系列世界观的长程开放世界互动RPG，使用 DeepSeek API 进行AI剧情生成。

## 功能特性

- 完整的龙族世界状态模拟器（五层世界结构）
- 四种正典模式（CANON-R/O/H/C）
- 六种玩家身份（原创/穿越者/原著替代/普通人/混血种家族/自定义）
- AI剧情生成（DeepSeek API，支持 deepseek-chat / deepseek-reasoner）
- 智能选项解析（支持6种选项格式）
- 多维度人际关系系统（非单一好感度）
- 任务/线索/背包/能力/势力/世界消息/伏笔等完整系统
- 本地存档（3个存档槽 + 自动存档）
- 续玩码生成与读取（跨设备迁移）
- 莫兰迪浅色系UI
- 响应式设计（支持桌面和移动端）

## 快速开始

### 1. 获取 DeepSeek API Key

访问 [platform.deepseek.com](https://platform.deepseek.com) 注册并获取 API Key。

### 2. 本地运行

由于是纯前端应用，直接用任意HTTP服务器打开即可：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node.js (需要安装 http-server)
npx http-server -p 8080

# 方式三：VS Code Live Server 插件
```

然后在浏览器打开 `http://localhost:8080`

### 3. 配置 API Key

- 进入应用首页 → 点击「设置」
- 输入你的 DeepSeek API Key
- 选择模型（deepseek-chat 或 deepseek-reasoner）
- 调整 Temperature 和 Max Tokens
- 点击「保存设置」

### 4. 开始游戏

- 点击「开始新游戏」
- 按照5步流程创建角色（正典模式 → 身份 → 基础信息 → 血统能力 → 确认）
- 确认后AI自动生成开场剧情

## 部署到静态托管平台

### Vercel

```bash
npm install -g vercel
vercel --prod
```

### Netlify

直接将项目文件夹拖拽到 [app.netlify.com/drop](https://app.netlify.com/drop)

### GitHub Pages

1. 将项目推送到 GitHub 仓库
2. 在仓库 Settings → Pages 中选择 main 分支作为源

### 其他平台

任何支持静态文件托管的平台都可以（Cloudflare Pages、阿里云OSS、腾讯云COS等）。

## CORS 问题解决

如果浏览器直接调用 DeepSeek API 遇到 CORS 限制，可以使用以下方案：

### 方案一：使用项目自带的代理服务器

```bash
cd proxy
npm install
node server.js
```

代理服务器默认运行在 `http://localhost:3001`，在应用设置中将「API代理地址」设为 `http://localhost:3001/v1`

### 方案二：使用在线代理服务

使用支持 CORS 的第三方代理服务，在设置中填写代理地址。

### 方案三：部署到同一域名

将前端和代理后端部署到同一域名下，避免跨域问题。

## 项目结构

```
dragon-world-standalone/
├── index.html              # 主页面
├── css/
│   └── style.css           # 样式（莫兰迪色系）
├── js/
│   ├── state.js            # 游戏状态管理
│   ├── parser.js           # 选项解析器
│   ├── storage.js          # 存档系统
│   ├── ai.js               # DeepSeek API 调用
│   └── app.js              # 主应用逻辑
├── proxy/
│   ├── server.js           # Node.js CORS 代理服务器
│   └── package.json
└── README.md               # 本文件
```

## 游戏指令

### 查询指令
- `状态` - 查看当前角色状态
- `关系` - 查看人际关系
- `任务` - 查看任务列表
- `线索` - 查看线索图谱
- `背包` - 查看背包物品
- `能力` - 查看能力与言灵
- `组织` - 查看组织声望
- `世界消息` - 查看世界事件
- `原著偏差` - 查看蝴蝶效应等级
- `伏笔` - 查看活跃伏笔
- `存档` - 打开存档面板
- `调试信息` - 查看调试数据

### 节奏指令
- `快进一周` / `快进一个学期` - 时间快进
- `剧情快一点` / `剧情慢一点` - 调整节奏
- `校园剧情多一点` / `任务剧情多一点` - 调整侧重

## 存档说明

- **自动存档**：每轮剧情生成后自动保存
- **存档槽**：3个手动存档槽位
- **续玩码**：生成Base64编码的续玩码，可跨设备迁移
- 所有数据保存在浏览器 localStorage 中，清除浏览器数据会丢失存档

## 注意事项

1. API Key 仅保存在本地浏览器中，不会上传到任何服务器
2. 建议使用 deepseek-chat 模型进行日常游戏，deepseek-reasoner 适合需要深度推理的场景
3. 每轮剧情生成消耗的 Token 数量取决于上下文长度和输出长度
4. 如果遇到生成失败，请检查 API Key 是否正确、账户余额是否充足、网络连接是否正常
5. 建议定期使用续玩码备份重要进度

## 技术栈

- 纯前端：HTML5 + CSS3 + 原生 JavaScript（无框架依赖）
- AI：DeepSeek API（OpenAI 兼容格式）
- 存储：localStorage
- 样式：莫兰迪浅色系
- 无构建步骤，开箱即用