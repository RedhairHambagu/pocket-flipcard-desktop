export const VERSION_INFO = {
  version: '0.4.0',
  releaseDate: '2025-09-21',
  buildNumber: '20250921'
};

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'bugfix' | 'improvement' | 'breaking';
    description: string;
  }[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.4',
    date: '2025-09-21',
    changes: [
      {
        type: 'feature',
        description: '全新样式'
      },

    ]
  },  {
    version: '0.3',
    date: '2025-09-17',
    changes: [
      {
        type: 'feature',
        description: '支持json, SQL形式导出和导入，语音、视频翻牌文件一键导出'
      },
      {
        type: 'feature',
        description: '支持离线模式，导入json文件，导出静态html'
      },
      {
        type: 'feature',
        description: '验证码登录，小号切换，切换前提示token刷新, 区号支持'
      },
      {
        type: 'improvement',
        description: '数据加载优化，缓存数据加载'
      },
      {
        type: 'improvement',
        description: '优化数据库存储按照用户id分开存储，缓存可清除'
      },
      {
        type: 'improvement',
        description: '优化统计展示内容，统计配置化，通过配置选择统计模块是否展示内容，增加按人和鸡腿统计'
      },
      {
        type: 'improvement',
        description: 'api请求 payload逻辑优化'
      },
      {
        type: 'bugfix',
        description: '修复手机号登录，修复media下载http Error'
      },
    ]
  },
  {
    version: '0.2',
    date: '2025-08-14',
    changes: [
      {
        type: 'feature',
        description: '支持翻牌数据同步和导出功能'
      },
      {
        type: 'feature',
        description: '支持多种导出格式：CSV、JSON'
      },
      {
        type: 'feature',
        description: '智能搜索和多维度筛选功能'
      },
      {
        type: 'feature',
        description: '数据统计和趋势分析'
      },
      {
        type: 'feature',
        description: '本地数据缓存，支持离线浏览'
      },
      {
        type: 'feature',
        description: '支持音频、视频、文字多种回答类型'
      },
      {
        type: 'feature',
        description: '响应式设计，支持移动端和桌面端'
      },
      {
        type: 'improvement',
        description: '优化用户界面和交互体验'
      }
    ]
  }

];

export const getChangelogByVersion = (version: string): ChangelogEntry | undefined => {
  return CHANGELOG.find(entry => entry.version === version);
};

export const getLatestChangelog = (): ChangelogEntry | undefined => {
  return CHANGELOG[0];
};