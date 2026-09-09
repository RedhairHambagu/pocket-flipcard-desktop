import { authUtils } from './auth';
import * as indexedDB from './indexedDB';
import { clearAllCachedMedia } from './desktop';

/**
 * 清除本应用能够写入的所有用户内容：全部账号数据库、会话、设置与内部媒体缓存。
 * 用户主动导出的备份和媒体位于用户选择的位置，绝不会由此函数删除。
 */
export async function eraseAllLocalApplicationData(): Promise<void> {
  const users = [authUtils.getCurrentUser(), ...authUtils.getSubAccounts()];
  const userIds = users.map(user => user?.userId);

  await indexedDB.clearAllApplicationData(userIds);
  await clearAllCachedMedia();

  localStorage.clear();
  sessionStorage.clear();
}
