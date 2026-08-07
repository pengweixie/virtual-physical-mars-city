# dev/ — 子 session 开发预览页与交接文档

各设计 session 的**单资产开发预览页**(dev-preview-*.html / dev-anim-*.html)和
交接文档(HANDOFF_*.md)统一放这里,不放仓库根目录。

- 预览页从本目录引用资产走 `../viewer/units/...`(仓库根起服务,路径带 /dev/ 前缀)
- 预览启动器 `preview-*.bat` 也放本目录(2026-08-07 自根目录迁入);脚本里
  `cd /d "%~dp0.."` 回到仓库根再起服务,双击即用,URL 不变
- 新 session 交付 .bat 启动器时:放这里,端口用 8124+(8123 是主城保留端口)
- 新 session 交付预览页时:文件放这里,命名 `dev-preview-<资产ID>.html`
- 这里的页面是开发工具,不是交付物——正式验证以城内实测(viewer/index.html)为准
