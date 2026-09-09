export interface User {
  id: string;
  username: string;
  token: string;
  userId?: number; // Pocket48 userId for data separation
  avatar?: string;
}

// 基础用户信息
export interface BaseUserInfo {
  bgImg: string;
  vip: boolean;
  isStar: boolean;
  userRole: number;
  badge: any[];
  teamLogo: string;
  userId: number;
  avatar: string;
  level: number;
  signature: string;
  pfUrl: string;
  friends: number;
  effectUser: boolean;
  nickname: string;
  starName: string;
  followers: number;
  realNickName: string;
}

// 音频内容
export interface AudioContent {
  url: string;
  duration: number;
  size: number;
}

// 视频内容
export interface VideoContent {
  url: string;
  duration: number;
  size: number;
  previewImg: string;
  height: number;
  width: number;
}

// API返回的消息项
export interface MessageItem {
  content: string;
  qtime: string;
  answerContent: string | AudioContent | VideoContent;
  cost: number;
  baseUserInfo: BaseUserInfo;
  answerTime: string;
  type: number; // 1 公开 2 私密
  userName: string;
  questionId: string;
  answerType: number; // 1 文字 2 语音 3 视频
  answerId: string;
  status: number; // 1 未翻 2 已翻 3 退回/撤回
  headImgUrl: string;
}

export interface DataItem {
  id: string;
  timestamp: string; // 保持向后兼容，使用回复时间
  questionTime: string; // 问题发送时间
  answerTime: string; // 回复时间
  content: string;
  labels: string[];
  createdAt: Date;
  type?: 'text' | 'audio' | 'video';
  audioUrl?: string;
  videoUrl?: string;
  // 应用私有媒体缓存的绝对路径。播放时优先使用，原始远程地址仍保留用于导出和重新下载。
  localAudioPath?: string;
  localVideoPath?: string;
  duration?: number; // in seconds
  previewImg?: string;
  height?: number;
  width?: number;
  userName?: string;
  userAvatar?: string;
  idolAvatar?: string;
  idolId?: number;
  idolNickname?: string;
  starName?: string;
  cost?: number;
  status?: number; // 1 未翻 2 已翻
  questionId?: string;
  questionContent?: string; // 问题内容
  answerContent?: string; // 回答内容
  isPublic?: boolean; // true=公开, false=私密
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface Statistics {
  totalItems: number;
  monthlyStats: Record<string, number>;
  monthlyStatsByStar: Record<string, Record<string, number>>; // 按xox分组的月度统计
  labelStats: Record<string, number>;
  audioCount: number;
  videoCount: number; // 添加视频计数
  textCount: number;
  totalCost: number; // 总花费
  monthlyCostStats: Record<string, number>; // 月度花费统计
}

export interface PhoneLoginFormData {
  phoneNumber: string;
  verificationCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API响应结构
export interface ApiListResponse {
  status: number;
  success: boolean;
  message: string;
  content: MessageItem[];
}

// API请求参数
export interface ApiListParams {
  status: number;
  beginLimit: number;
  memberId: string;
  limit: number;
}

// SMS related types
export interface SMSResult {
  status: number;
  success: boolean;
  message: string;
  content?: any;
}

export interface LoginUserInfo {
  status: number;
  success: boolean;
  message: string;
  content: {
    userInfo: {
      token: string;
      nickname: string;
      avatar: string;
      userId: number;
    };
  };
}

// User info reload types
export interface UserInfoReloadOrSwitch {
  status: number;
  success: boolean;
  message: string;
  content: {
    userId: number;
    nickname: string;
    avatar: string;
    token?: string; // switch时返回新token
    bigSmallInfo?: {
      bigUserInfo: {
        userId: number;
        nickname: string;
        avatar: string;
      };
      smallUserInfo?: Array<{
        userId: number;
        nickname: string;
        avatar: string;
      }>;
    };
  };
}

// Duplicate check result types
export type DuplicateCheckStatus = 'new' | 'duplicate' | 'updated';

export interface DuplicateCheckResult {
  status: DuplicateCheckStatus;
  existingItem?: DataItem;
  shouldSave: boolean;
}

export interface SaveDataItemsResult {
  newCount: number;
  updatedCount: number;
  duplicateCount: number;
  totalProcessed: number;
}
