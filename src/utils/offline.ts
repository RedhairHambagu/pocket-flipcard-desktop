// 离线模式状态管理工具

export interface OfflineState {
  isOfflineMode: boolean;
  hasLocalData: boolean;
  localDataCount: number;
}

// 离线模式状态管理
class OfflineModeManager {
  private storageKey = 'offlineMode';
  private listeners: Array<(state: OfflineState) => void> = [];

  // 获取离线模式状态
  getOfflineState(): OfflineState {
    const isOfflineMode = localStorage.getItem(this.storageKey) === 'true';

    return {
      isOfflineMode,
      hasLocalData: false, // 将通过 IndexedDB 检查更新
      localDataCount: 0
    };
  }

  // 设置离线模式
  setOfflineMode(enabled: boolean): void {
    localStorage.setItem(this.storageKey, enabled.toString());
    this.notifyListeners();
  }

  // 切换离线模式
  toggleOfflineMode(): boolean {
    const currentState = this.getOfflineState();
    const newState = !currentState.isOfflineMode;
    this.setOfflineMode(newState);
    return newState;
  }

  // 检查是否在离线模式
  isOfflineMode(): boolean {
    return this.getOfflineState().isOfflineMode;
  }

  // 添加状态监听器
  addListener(listener: (state: OfflineState) => void): () => void {
    this.listeners.push(listener);
    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知所有监听器
  private notifyListeners(): void {
    const state = this.getOfflineState();
    this.listeners.forEach(listener => listener(state));
  }

  // 更新本地数据统计
  async updateLocalDataStats(): Promise<void> {
    try {
      // 动态导入 indexedDB 工具以避免循环依赖
      const { getDataItemCount } = await import('./indexedDB');
      const count = await getDataItemCount();

      // 这里我们需要更新状态并通知监听器
      // 但由于状态结构限制，我们通过事件的方式处理
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to update local data stats:', error);
    }
  }

  // 检查是否有离线数据可用
  async hasOfflineData(): Promise<boolean> {
    try {
      const { getDataItemCount } = await import('./indexedDB');
      const count = await getDataItemCount();
      return count > 0;
    } catch (error) {
      console.warn('Failed to check offline data:', error);
      return false;
    }
  }

  // 获取离线数据数量
  async getOfflineDataCount(): Promise<number> {
    try {
      const { getDataItemCount } = await import('./indexedDB');
      return await getDataItemCount();
    } catch (error) {
      console.warn('Failed to get offline data count:', error);
      return 0;
    }
  }
}

// 导出单例实例
export const offlineModeManager = new OfflineModeManager();

// 离线模式工具函数
export const offlineUtils = {
  // 检查是否应该显示离线入口
  shouldShowOfflineEntry: async (): Promise<boolean> => {
    return await offlineModeManager.hasOfflineData();
  },

  // 准备离线模式数据
  prepareOfflineData: async (): Promise<{
    success: boolean;
    dataCount: number;
    message?: string;
  }> => {
    try {
      const count = await offlineModeManager.getOfflineDataCount();

      if (count === 0) {
        return {
          success: false,
          dataCount: 0,
          message: '没有找到本地数据，请先同步或导入数据'
        };
      }

      return {
        success: true,
        dataCount: count,
        message: `找到 ${count} 条本地数据`
      };
    } catch (error) {
      return {
        success: false,
        dataCount: 0,
        message: '检查本地数据时出现错误'
      };
    }
  },

  // 清理离线模式
  cleanupOfflineMode: (): void => {
    offlineModeManager.setOfflineMode(false);
  }
};