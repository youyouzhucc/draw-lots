# 职场每日抽签 🎴

一个轻量级的职场运势每日抽签 Web 应用，根据用户生日等信息生成当日职场运势签文。

## 所需信息说明

| 信息 | 必填 | 用途 |
|------|------|------|
| **生日（月/日）** | ✅ 是 | 星座、生肖、每日签文确定性种子 |
| **姓名/昵称** | 否 | 个性化称呼 |
| **职业/行业** | 否 | 更精准的职场建议 |
| **当前关注** | 否 | 升职、跳槽、面试、团队合作、项目推进等 |

## 功能特性

- 📅 **每日一签**：同一天同一人生成的签文固定，可分享
- 🌟 **星座运势**：根据生日自动识别星座
- 🎯 **职场主题**：签文聚焦职场场景
- 📱 **响应式**：支持手机和桌面端

## 快速开始

```bash
# 本地预览
npx serve .
# 或
python -m http.server 8080
```

然后访问 http://localhost:8080

## 项目结构

```
draw-lots/
├── index.html      # 主页面
├── style.css       # 样式
├── app.js          # 抽签逻辑
├── signs.js        # 签文库
└── README.md
```

## 部署到 GitHub

```bash
cd draw-lots
git init
git add .
git commit -m "feat: 职场每日抽签初版"
git branch -M main
git remote add origin https://github.com/你的用户名/draw-lots.git
git push -u origin main
```

启用 GitHub Pages：仓库 Settings → Pages → Source 选 `main` 分支，根目录 `/`，保存后访问 `https://你的用户名.github.io/draw-lots/`。

## License

MIT
