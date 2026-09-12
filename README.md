# 口袋翻牌工具（本地桌面版）

这是原 `pocket-flipcard-export` 的独立 Tauri 桌面客户端工程。它不会启动 Docker、Nginx 或任何本地 HTTP 服务。

## 使用前请了解：数据保存在这台电脑上

**Windows portable EXE 仅表示程序免安装。账号、登录状态、设置、已同步的数据和下载的媒体缓存保存在本机，不在 EXE 内，也不会随 EXE 一起搬迁。**

- Windows 应用数据位于当前系统用户的 `%LOCALAPPDATA%\cn.pocket.flipcard.desktop\` 下，媒体缓存位于其中的 `media\` 目录。不会把这些数据自动保存到 EXE 所在文件夹或 U 盘。
- 在同一台电脑、同一个 Windows 用户下移动、重命名或替换 EXE，仍会使用原来的应用数据。把 EXE 复制到另一台电脑或换一个系统用户运行，不会带上原来的账号、登录状态和数据；原电脑上的数据仍然保留。
- 删除 EXE **不会删除本机数据**。如需清理，请先运行应用，在“统计设置”或登录页选择“彻底清除本机数据并退出”，完成两次确认，清理成功后再删除 EXE。
- 如需换电脑使用，请事先通过应用导出需要保留的数据，并自行保管、转移导出文件；不要把复制 EXE 当作数据备份。导出文件可能包含私人内容，请谨慎分享。
- 应用不把用户数据上传到开发者的服务。登录、同步及获取尚未缓存的媒体需要连接 Pocket 的接口或媒体服务；这些操作会产生网络请求。清理本机数据不会删除 Pocket 服务端的内容。

## 工作方式

- React 界面运行在用户电脑的桌面应用窗口中。
- Tauri 的 Rust 进程只允许访问程序所需的 Pocket API 白名单。
- 用户的数据保存在本机浏览器数据库中；不上传到开发者的服务。
- 用户同步时直接连接 Pocket 的服务；查看、搜索和导出使用本机数据。
- 在“下载音视频”中，可把当前账号已同步的音视频下载到应用私有缓存；之后断网仍能播放。它不会替代现有的“导出媒体”功能。

应用不提供开发者部署的 Web 服务。用户电脑需要正常访问 Pocket 接口才能登录和同步；同步完成后，已缓存的数据可以在断网状态下查看。

## 本地媒体缓存

- 缓存由应用自动管理，用户不需要选择文件夹；播放时优先使用本地副本。
- 清除当前账号缓存时，会一并删除该账号已缓存的音视频。
- 数据同步不会自动下载媒体，避免在不知情时消耗大量流量和磁盘；用户可在同步后点击“下载音视频”。

### 媒体缓存目录

媒体由应用自动管理，文件名是内部标识，不建议用户手动移动或重命名：

macOS：

```text
~/Library/Application Support/cn.pocket.flipcard.desktop/media/
├── audio/
└── video/
```

Windows：

```text
%LOCALAPPDATA%\cn.pocket.flipcard.desktop\media\
├── audio\
└── video\
```

数据记录和登录状态保存在应用 WebView 的 IndexedDB/localStorage 中，不是用户下载目录中的普通文件。应用使用 Tauri 的 `appLocalDataDir` 管理媒体目录，并按应用 identifier 区分不同应用的数据。

原有“导出媒体”功能仍然保存到用户主动选择的目录；这些文件不会被应用缓存清理或卸载流程删除。

## 卸载与数据清除

- macOS：先在应用的“统计设置”或登录页选择“彻底清除本机数据并退出”，再将应用移到废纸篓。macOS 的拖拽删除不会自动运行应用清理逻辑。
- Windows：发布免安装 portable EXE，双击即可运行。删除前先在应用中选择“彻底清除本机数据并退出”，再删除 EXE；仅删除 EXE 不会清除本机数据，也没有系统“卸载”入口。
- 两个平台的彻底清除都只删除应用自己的数据库、登录状态、设置与媒体缓存；用户主动导出的备份和媒体文件不会删除。

免安装版的应用内清理与安装版使用同一套逻辑，不依赖安装程序。清理会清空应用账号数据库中的记录、登录状态与设置，并删除应用管理的音视频缓存。若界面提示清理失败，请勿视为已完成；处理错误后重新执行清理。

这里的“彻底清除”指应用管理的用户内容清理，并非磁盘安全擦除；应用数据目录或 WebView 自身的文件可能仍然存在。用户主动导出的文件、系统备份以及其他电脑上的副本需要用户另行管理。

### 验证清理

1. 同步一条含音频或视频的数据，并点击“下载音视频”。
2. 关闭网络，确认媒体仍可播放。
3. 打开设置，选择“彻底清除本机数据并退出”，完成两次确认。
4. 重新打开应用，应回到未登录、无本地数据状态。
5. macOS 再将 `.app` 移到废纸篓；Windows 删除 portable EXE。

## 开发

需要 Node.js 20+、Rust 稳定版，以及当前系统的 Tauri 构建依赖。

```bash
npm install
npm run desktop:dev
```

构建桌面应用（macOS 生成安装包，Windows 仅生成 EXE）：

```bash
npm run desktop:build
```

Windows 免安装 EXE（在 Windows x64 或 GitHub Actions Windows runner 上执行）：

```bash
npm run desktop:build:windows
```

本地构建产物为 `src-tauri/target/release/pocket-flipcard-desktop.exe`，可直接复制并双击运行。Windows 专用配置禁用安装包生成，MSVC 运行库静态链接到 EXE。

运行电脑仍需具备 [Microsoft Edge WebView2 Runtime](https://v2.tauri.app/distribute/windows-installer/#webview2-installation-options)；缺少该组件的电脑需要先安装它。此版本的 portable 指应用免安装，数据库、登录状态和媒体缓存仍保存在本机应用数据目录，不会随 EXE 一起迁移。

如果之前安装过旧版，旧版卸载程序会清除同一应用目录的数据；如需保留数据，请先导出备份，再卸载旧版并运行 portable EXE。

## GitHub Actions 打包

工作流位于 `.github/workflows/desktop-build.yml`，支持：

- 手动运行 `workflow_dispatch`；
- 推送 `v*` 标签时自动构建并创建 GitHub Release；
- macOS Apple Silicon：DMG；
- macOS Intel：DMG；
- Windows x64：`pocket-flipcard-desktop_<版本>-windows-x64-portable.exe`（直接运行，无安装向导）。

推送版本示例：

```bash
git tag v0.1.0
git push origin v0.1.0
```

当前工作流没有配置 Apple Developer ID 或 Windows 代码签名证书，因此产物可以打包和发布，但用户首次打开时可能看到系统安全提示。正式面向用户发布前应把签名证书放入 GitHub Actions Secrets。

macOS Apple Silicon 产物：

```text
src-tauri/target/release/bundle/macos/口袋翻牌工具.app
src-tauri/target/release/bundle/dmg/口袋翻牌工具_0.1.0_aarch64.dmg
```

## 安全边界

- Rust 端拒绝非白名单接口，前端不能把它当作通用代理。
- 不复制原项目 `.env`；固定的客户端请求参数由桌面端维护。
- 发行前应为 Windows EXE/macOS 安装包配置代码签名。
