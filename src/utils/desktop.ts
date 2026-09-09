import { convertFileSrc, invoke } from '@tauri-apps/api/core';

export interface PocketRequest {
  endpoint: string;
  body: unknown;
  token?: string;
  headers?: Record<string, string>;
}

export const isTauriDesktop = () =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export type MediaKind = 'audio' | 'video';

export interface CachedMedia {
  path: string;
  bytes: number;
  alreadyCached: boolean;
}

/**
 * The renderer is deliberately unable to choose an arbitrary URL. The Rust
 * side accepts only the fixed Pocket API endpoints used by this application.
 */
export async function requestPocketApi<T>(request: PocketRequest): Promise<T> {
  if (!isTauriDesktop()) {
    throw new Error('请从“口袋翻牌工具”桌面客户端启动，浏览器模式不能同步数据。');
  }

  return invoke<T>('pocket_request', { request });
}

export async function cacheMedia(
  id: string,
  mediaType: MediaKind,
  url: string,
): Promise<CachedMedia> {
  if (!isTauriDesktop()) {
    throw new Error('媒体缓存仅能在桌面客户端中使用。');
  }

  return invoke<CachedMedia>('cache_media', { request: { id, mediaType, url } });
}

export async function removeCachedMedia(urls: string[]): Promise<number> {
  if (!isTauriDesktop() || urls.length === 0) {
    return 0;
  }

  return invoke<number>('remove_cached_media', { urls });
}

/** 删除应用管理的全部音视频缓存，不涉及用户主动导出的文件。 */
export async function clearAllCachedMedia(): Promise<void> {
  if (!isTauriDesktop()) {
    return;
  }

  await invoke<void>('clear_all_cached_media');
}

/** 仅在完成彻底清除后调用；由原生进程结束整个应用。 */
export async function quitDesktopApp(): Promise<void> {
  if (isTauriDesktop()) {
    await invoke<void>('quit_app');
  }
}

/** 将受应用目录保护的原生文件路径转换成 WebView 可播放的 asset URL。 */
export function getMediaPlaybackUrl(localPath?: string, remoteUrl?: string): string | undefined {
  if (localPath && isTauriDesktop()) {
    return convertFileSrc(localPath);
  }

  return remoteUrl;
}
