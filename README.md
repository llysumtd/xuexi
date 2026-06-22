# 自适应学习管理系统 - 前端部署指南

## 📁 项目结构

```
frontend/
├── package.json          # 依赖配置
├── vite.config.js        # Vite 配置
├── index.html            # 入口 HTML
├── src/
│   ├── main.js           # Vue 入口
│   ├── App.vue           # 根组件
│   ├── router/
│   │   └── index.js      # 路由配置
│   ├── api/
│   │   └── learning.js   # Coze API 调用
│   └── views/
│       ├── Dashboard.vue       # 家长驾驶舱
│       ├── WrongQuestions.vue # 错题列表
│       ├── Report.vue         # 学习报告
│       ├── AddQuestion.vue     # 添加错题
│       ├── AITutor.vue        # AI 讲解
│       └── Export.vue          # 导出 PDF
```

---

## 🚀 部署到 Vercel（推荐，免费）

### 步骤 1: 下载项目代码

代码已保存在 `/workspace/projects/frontend/` 目录

### 步骤 2: 创建 GitHub 仓库

1. 访问 https://github.com 并登录
2. 点击右上角 `+` → `New repository`
3. 仓库名: `learning-management-frontend`
4. 选择 `Private`（私有）
5. 点击 `Create repository`

### 步骤 3: 上传代码到 GitHub

```bash
cd /workspace/projects/frontend

# 初始化 Git
git init
git add .
git commit -m "feat: 添加学习管理系统前端"

# 关联远程仓库（替换为你自己的仓库地址）
git remote add origin https://github.com/你的用户名/learning-management-frontend.git

# 推送
git push -u origin main
```

### 步骤 4: 部署到 Vercel

1. 访问 https://vercel.com 并登录（可用 GitHub 账号）
2. 点击 `Add New` → `Project`
3. 选择刚才创建的 GitHub 仓库
4. 配置构建选项：
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 `Deploy`

### 步骤 5: 配置环境变量（可选）

在 Vercel 项目设置中添加：
- `VITE_COZE_API_URL`: `https://nt8xzpg462.coze.site/stream_run`
- `VITE_API_TOKEN`: 你的 Coze API Token

### 步骤 6: 访问你的网站

部署成功后，Vercel 会给你一个免费域名，例如：
```
https://learning-management-frontend.vercel.app
```

---

## 🌐 其他免费部署平台

### Netlify

1. 访问 https://app.netlify.com
2. 用 GitHub 登录
3. `Add new site` → `Import from Git`
4. 选择仓库
5. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
6. 点击 `Deploy`

### Cloudflare Pages

1. 访问 https://pages.cloudflare.com
2. 登录后点击 `Create a project`
3. 关联 GitHub 仓库
4. 构建配置：
   - Build command: `npm run build`
   - Build output directory: `dist`
5. 点击 `Save and Deploy`

---

## ⚠️ 注意事项

### 1. API Token 安全

**不要把 API Token 硬编码在前端代码中！**

正确做法：
- 在 Vercel/Netlify 后台配置环境变量
- 前端代码从 `import.meta.env.VITE_API_TOKEN` 读取

### 2. CORS 跨域问题

Coze API 可能不支持直接从前端调用。你需要在 Vercel 后台配置代理，或者：

**方案 A**: 使用 Netlify Functions / Vercel Edge Functions 做代理

**方案 B**: 在后端创建一个简单的 API 转发服务

### 3. 建议的改进

1. 添加用户登录系统
2. 后端服务存储会话
3. 数据库存储孩子信息和错题
4. 添加数据缓存

---

## 📱 功能预览

部署后，你将拥有：

| 功能 | 说明 |
|------|------|
| 🏠 家长驾驶舱 | 学习概览、掌握率、错误分析图表 |
| 📝 错题列表 | 筛选、搜索、讲解、检验 |
| 📈 学习报告 | 周报、月报、知识热力图 |
| ➕ 添加错题 | 快速录入新错题 |
| 🎓 AI 讲解 | 分步引导、提示、深度检验 |
| 📄 导出 PDF | 生成错题本 PDF |

---

## 🔧 本地开发

```bash
cd /workspace/projects/frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

---

## 📞 需要帮助？

如果部署过程中遇到问题，请：
1. 查看 Vercel/Netlify 的部署日志
2. 检查浏览器控制台错误
3. 确认 API Token 有效性
