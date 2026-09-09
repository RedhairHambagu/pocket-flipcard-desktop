; Windows 仅发布 NSIS 安装包。标准“卸载”时强制清除当前用户的应用数据，
; 包括 WebView2 的 IndexedDB/localStorage 与 Tauri 的本地媒体缓存。
; 不影响用户手动导出到其他目录的备份和媒体。
!macro NSIS_HOOK_PREUNINSTALL
  RMDir /r "$LOCALAPPDATA\cn.pocket.flipcard.desktop"
!macroend
