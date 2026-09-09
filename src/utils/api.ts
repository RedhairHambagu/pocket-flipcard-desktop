import { 
  DataItem, 
  Statistics, 
  ApiListResponse, 
  ApiListParams, 
  MessageItem, 
  AudioContent, 
  VideoContent,
  SMSResult,
  LoginUserInfo,
  UserInfoReloadOrSwitch
} from '../types';
import * as indexedDB from './indexedDB';
import { authUtils } from './auth';
import { getEnvVar, getApiHeaders, devLog } from './env';
import { requestPocketApi } from './desktop';

// API配置 - 自动适配开发环境和生产环境
const API_BASE_URL = getEnvVar('VITE_API_BASE_URL');
const API_ROUTE = '/idolanswer/api/idolanswer/v1/user/question/list';

devLog('API_BASE_URL:', API_BASE_URL);

// 默认memberId（可以从配置文件或其他地方获取）
const DEFAULT_MEMBER_ID = '';

// 统一获取认证信息
const getAuthInfo = () => {
  const token = authUtils.getToken();
  
  if (!token) {
    throw new Error('用户未登录或token无效');
  }
  
  return { token };
};


// API headers配置 - 使用环境工具函数
const getBaseApiHeaders = () => getApiHeaders();
devLog(getBaseApiHeaders())

// 将API返回的MessageItem转换为DataItem
const convertMessageToDataItem = (message: MessageItem): DataItem => {
  // 根据message.type设置标签：1=公开，2=私密
  const labels = [];
  if (message.type === 1) {
    labels.push('公开');
  } else if (message.type === 2) {
    labels.push('私密');
  }

  const dataItem: DataItem = {
    id: message.questionId,
    timestamp: message.answerTime, // 保持向后兼容，使用回复时间
    questionTime: message.qtime, // 问题发送时间
    answerTime: message.answerTime, // 回复时间
    content: `${message.content}`, // 暂时保持完整内容用于显示
    questionContent: message.content, // 问题内容
    labels: labels,
    createdAt: new Date(message.answerTime),
    userName: message.userName,
    userAvatar: message.headImgUrl ? (message.headImgUrl.startsWith('http') ? message.headImgUrl : `https://source.48.cn${message.headImgUrl}`) : '',
    idolAvatar: message.baseUserInfo?.avatar ? (message.baseUserInfo.avatar.startsWith('http') ? message.baseUserInfo.avatar : `https://source.48.cn${message.baseUserInfo.avatar}`) : '',
    idolId: message.baseUserInfo?.userId,
    idolNickname: message.baseUserInfo?.realNickName || '',
    starName: message.baseUserInfo?.nickname || '',
    cost: message.cost,
    status: message.status,
    questionId: message.questionId,
    isPublic: message.type === 1
  };

  // // 调试：检查时间戳
  // if (!message.answerTime) {
  //   console.warn('Missing answerTime for message:', message.questionId);
  // }

  // 根据answerType设置类型和相关属性
  switch (message.answerType) {
    case 1: // 文字
      dataItem.type = 'text';
      
      // 只有已翻牌状态(status === 2)才显示回答内容
      if (message.status === 2) {
        dataItem.answerContent = message.answerContent as string;
        dataItem.content = `问题：${message.content}\n\n回答：${message.answerContent}`;
      } else {
        dataItem.answerContent = '[文字回答，未翻牌]';
        dataItem.content = `问题：${message.content}\n\n回答：${dataItem.answerContent}`;
      }
      break;
    case 2: // 语音
      dataItem.type = 'audio';
      
      // 只有已翻牌状态(status === 2)才处理音频内容
      if (message.status === 2) {
        // Parse JSON string to get audio content
        const audioContent = typeof message.answerContent === 'string' 
          ? JSON.parse(message.answerContent) as AudioContent
          : message.answerContent as AudioContent;
        dataItem.audioUrl = audioContent.url.startsWith('http') 
          ? audioContent.url 
          : `https://mp4.48.cn${audioContent.url}`;
        dataItem.duration = audioContent.duration;
        devLog('Audio content:', { url: audioContent.url, duration: audioContent.duration });
        
        // 安全的时长格式化
        const formatDuration = (duration: number) => {
          if (!duration || isNaN(duration)) return '未知时长';
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        dataItem.answerContent = `[音频回答，时长: ${formatDuration(audioContent.duration)}]`;
      } else {
        dataItem.answerContent = '[音频回答，未翻牌]';
      }
      
      dataItem.content = `问题：${message.content}\n\n回答：${dataItem.answerContent}`;
      break;
    case 3: // 视频
      dataItem.type = 'video';
      
      // 只有已翻牌状态(status === 2)才处理视频内容
      if (message.status === 2) {
        // Parse JSON string to get video content
        const videoContent = typeof message.answerContent === 'string'
          ? JSON.parse(message.answerContent) as VideoContent
          : message.answerContent as VideoContent;
        dataItem.videoUrl = videoContent.url.startsWith('http') 
          ? videoContent.url 
          : `https://mp4.48.cn${videoContent.url}`;
        dataItem.duration = videoContent.duration;
        dataItem.previewImg = videoContent.previewImg ? (videoContent.previewImg.startsWith('http') ? videoContent.previewImg : `https://source.48.cn${videoContent.previewImg}`) : '';
        dataItem.height = videoContent.height;
        dataItem.width = videoContent.width;
        
        // 使用相同的安全格式化函数
        const formatVideoDuration = (duration: number) => {
          if (!duration || isNaN(duration)) return '未知时长';
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        dataItem.answerContent = `[视频回答，时长: ${formatVideoDuration(videoContent.duration)}]`;
      } else {
        dataItem.answerContent = '[视频回答，未翻牌]';
      }
      
      dataItem.content = `问题：${message.content}\n\n回答：${dataItem.answerContent}`;
      break;
  }

  return dataItem;
};

// 构建API请求的通用headers
const buildApiHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  
  // 添加基础headers，过滤undefined
  const baseHeaders = getBaseApiHeaders();
  Object.entries(baseHeaders).forEach(([key, value]) => {
    if (value !== undefined) {
      headers[key] = value;
    }
  });
  
  // 添加token（如果提供）
  if (token) {
    headers['token'] = token;
  }

  // 添加CORS相关头部
  headers['Access-Control-Allow-Origin'] = '*';
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, token, pa, Host, appInfo, User-Agent, Accept-Language, Accept-Encoding, Connection';
  devLog(headers);
  return headers;
};

// 通用API请求函数
const makeApiRequest = async <T>(endpoint: string, body: unknown, token?: string, _useApiPrefix: boolean = true, customHeaders?: Record<string, string>): Promise<T> => {
  const headers = buildApiHeaders(token);
  
  // 合并自定义headers
  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }
  
  try {
    // No local HTTP server is started. The Tauri Rust process forwards only
    // its fixed allow-list of Pocket endpoints, so browser CORS is not involved.
    return await requestPocketApi<T>({ endpoint, body, token, headers });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('网络连接失败，请检查网络连接或CORS配置');
    }
    throw error;
  }
};

// API调用函数
const fetchApiData = async (params: ApiListParams, token: string): Promise<ApiListResponse> => {
  return makeApiRequest<ApiListResponse>(API_ROUTE, params, token);
};

export const apiUtils = {
  // 获取数据（替换原来的模拟数据）
  fetchData: async (
    page: number = 1, 
    pageSize: number = 10,
    searchTerm?: string, 
    dateRange?: { start: Date | null; end: Date | null },
    selectedTag?: string,
    selectedContentTypes?: string[],
    memberid?: string,
    selectedStarName?: string
  ): Promise<{
    data: DataItem[];
    hasMore: boolean;
    total?: number;
  }> => {
    try {
      // 获取认证信息
      const { token } = getAuthInfo();
      
      // 计算beginLimit
      const beginLimit = (page - 1) * pageSize;
      
      // 构造API参数
      const params: ApiListParams = {
        status: 0,
        beginLimit,
        memberId: memberid || DEFAULT_MEMBER_ID,
        limit: pageSize
      };

      // 调用API
      const apiResponse = await fetchApiData(params, token);
      
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || 'API request failed');
      }

      // 获取当前用户ID
      const currentUser = authUtils.getCurrentUser();
      const currentUserId = currentUser?.userId;
      
      // 转换数据格式
      let allData = apiResponse.content.map(item => convertMessageToDataItem(item));
      
      // 保存到IndexDB
      await indexedDB.saveDataItems(allData, currentUserId);
      
      // 应用搜索过滤
      if (searchTerm) {
        allData = allData.filter(item => 
          item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.userName && item.userName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // 应用日期过滤 - 按问题发送时间筛选
      if (dateRange?.start || dateRange?.end) {
        allData = allData.filter(item => {
          // 优先使用问题发送时间，如果没有则使用timestamp
          const timeStr = item.questionTime || item.timestamp;
          let itemDate: Date;
          
          // 处理Unix时间戳格式
          if (/^\d{13}$/.test(timeStr)) {
            itemDate = new Date(parseInt(timeStr));
          } else if (/^\d{10}$/.test(timeStr)) {
            itemDate = new Date(parseInt(timeStr) * 1000);
          } else {
            itemDate = new Date(timeStr);
          }
          
          if (isNaN(itemDate.getTime())) {
            return false; // 无效日期，过滤掉
          }
          
          if (dateRange.start && itemDate < dateRange.start) return false;
          if (dateRange.end && itemDate > dateRange.end) return false;
          return true;
        });
      }

      // 应用标签过滤
      if (selectedTag) {
        allData = allData.filter(item => 
          item.labels.includes(selectedTag)
        );
      }

      // 应用内容类型过滤
      if (selectedContentTypes && selectedContentTypes.length > 0) {
        allData = allData.filter(item => 
          selectedContentTypes.includes(item.type || 'text')
        );
      }

      // 应用偶像名过滤
      if (selectedStarName) {
        allData = allData.filter(item => {
          const starName = item.starName || item.idolNickname || '';
          return starName === selectedStarName;
        });
      }
      
      // 按问题发送时间降序排序（最新的问题在前面）
      allData.sort((a, b) => {
        // 优先使用问题发送时间排序，处理Unix时间戳
        const parseTime = (timeStr: string) => {
          if (!timeStr) return 0;
          // 如果是13位数字字符串（Unix毫秒时间戳）
          if (/^\d{13}$/.test(timeStr)) {
            return parseInt(timeStr);
          }
          // 否则尝试作为日期字符串解析
          return new Date(timeStr).getTime();
        };
        
        const timeA = parseTime(a.questionTime || a.timestamp);
        const timeB = parseTime(b.questionTime || b.timestamp);
        
        // 移除详细的排序日志，减少控制台输出
        
        // 如果时间戳无效，将其排到最后
        if (isNaN(timeA) && isNaN(timeB)) return 0;
        if (isNaN(timeA)) return 1;
        if (isNaN(timeB)) return -1;
        
        return timeB - timeA; // 降序：最新的在前面
      });
      
      return {
        data: allData,
        hasMore: apiResponse.content.length === pageSize, // 如果返回的数据量等于请求量，可能还有更多
        total: undefined // API未返回总数
      };
    } catch (error) {
      console.error('Failed to fetch data:', error);
      throw error;
    }
  },

  // 从IndexDB获取数据（离线模式）
  fetchFromCache: async (
    searchTerm?: string, 
    dateRange?: { start: Date | null; end: Date | null },
    selectedTag?: string,
    selectedContentTypes?: string[],
    selectedStarName?: string
  ): Promise<DataItem[]> => {
    try {
      // 获取当前用户ID，按userId获取数据实现数据分离
      const currentUser = authUtils.getCurrentUser();
      const currentUserId = currentUser?.userId;
      
      // 从IndexDB获取当前用户的已排序数据
      let allData: DataItem[];
      allData = await indexedDB.getAllDataItemsSorted(currentUserId);
      
      // 应用搜索过滤
      if (searchTerm) {
        allData = allData.filter(item => 
          item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.userName && item.userName.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // 应用日期过滤 - 按问题发送时间筛选
      if (dateRange?.start || dateRange?.end) {
        allData = allData.filter(item => {
          // 优先使用问题发送时间，如果没有则使用timestamp
          const timeStr = item.questionTime || item.timestamp;
          let itemDate: Date;
          
          // 处理Unix时间戳格式
          if (/^\d{13}$/.test(timeStr)) {
            itemDate = new Date(parseInt(timeStr));
          } else if (/^\d{10}$/.test(timeStr)) {
            itemDate = new Date(parseInt(timeStr) * 1000);
          } else {
            itemDate = new Date(timeStr);
          }
          
          if (isNaN(itemDate.getTime())) {
            return false; // 无效日期，过滤掉
          }
          
          if (dateRange.start && itemDate < dateRange.start) return false;
          if (dateRange.end && itemDate > dateRange.end) return false;
          return true;
        });
      }

      // 应用标签过滤
      if (selectedTag) {
        allData = allData.filter(item => 
          item.labels.includes(selectedTag)
        );
      }

      // 应用内容类型过滤
      if (selectedContentTypes && selectedContentTypes.length > 0) {
        allData = allData.filter(item => 
          selectedContentTypes.includes(item.type || 'text')
        );
      }

      // 应用偶像名过滤
      if (selectedStarName) {
        allData = allData.filter(item => {
          const starName = item.starName || item.idolNickname || '';
          return starName === selectedStarName;
        });
      }
      
      // 数据已在IndexedDB层面排序，无需重复排序
      return allData;
    } catch (error) {
      console.error('Failed to fetch data from cache:', error);
      throw error;
    }
  },

  // 同步数据（获取新数据并保存到IndexDB）
  syncData: async (
    onProgress?: (current: number, total: number) => void,
    memberid?: string
  ): Promise<number> => {
    try {
      // 获取认证信息
      const { token } = getAuthInfo();
      
      let beginLimit = 0;
      const limit = 10;
      let totalSynced = 0;
      let duplicateDetectionCount = 0; // 连续重复数据计数
      
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // 构造API参数
        const params: ApiListParams = {
          status: 0,
          beginLimit,
          memberId: memberid || DEFAULT_MEMBER_ID,
          limit
        };

        // 调用API
        devLog(`Syncing batch: beginLimit=${beginLimit}, limit=${limit}, memberid=${memberid || DEFAULT_MEMBER_ID || ''}`);
        const apiResponse = await fetchApiData(params, token);
        
        devLog('API Response status:', apiResponse.success);
        devLog('API Response content length:', apiResponse.content?.length || 0);
        
        if (!apiResponse.success) {
          throw new Error(apiResponse.message || 'API request failed');
        }

        // 获取当前用户ID
        const currentUser = authUtils.getCurrentUser();
        const currentUserId = currentUser?.userId;
        
        // 转换数据格式
        const data = apiResponse.content.map(item => convertMessageToDataItem(item));
        devLog(`Converted ${data.length} items`);
        
        
        // 使用增强的重复检查和保存逻辑
        let saveResult;
        try {
          saveResult = await indexedDB.saveDataItemsWithStats(data, currentUserId);
          devLog(`Enhanced save result: ${saveResult.newCount} new, ${saveResult.updatedCount} updated, ${saveResult.duplicateCount} duplicates`);
        } catch (dbError) {
          console.error('Failed to save to IndexedDB:', dbError);
          // 继续执行，不因数据库错误中断同步
          saveResult = {
            newCount: 0,
            updatedCount: 0,
            duplicateCount: data.length,
            totalProcessed: data.length
          };
        }
        
        // 新的重复检测逻辑：只有真正的重复数据才计入重复检测
        // 如果有新数据或者更新数据，不算作重复
        const trueDuplicateRatio = data.length > 0 ? saveResult.duplicateCount / data.length : 0;
        
        devLog(`True duplicate ratio: ${trueDuplicateRatio.toFixed(2)} (${saveResult.duplicateCount}/${data.length})`);
        
        // 如果当前批次中大部分数据（>=80%）都是真正的重复数据，增加重复检测计数
        if (data.length > 0 && trueDuplicateRatio >= 0.8) {
          duplicateDetectionCount++;
          devLog(`Duplicate detection count: ${duplicateDetectionCount}`);
          
          // 如果连续两次都是重复数据，提示用户
          if (duplicateDetectionCount >= 2) {
            const userChoice = confirm(
              `检测到连续获取的数据大部分都是真正的重复数据。\n\n` +
              `当前批次：${data.length} 条数据中有 ${saveResult.duplicateCount} 条重复数据\n` +
              `新增：${saveResult.newCount} 条，更新：${saveResult.updatedCount} 条\n` +
              `这可能表示当前数据已经获取完毕。\n\n` +
              `是否继续同步数据？\n\n` +
              `选择"确定"继续同步，选择"取消"停止同步。`
            );
            
            if (!userChoice) {
              devLog('User chose to stop sync due to duplicate data detection');
              break;
            } else {
              devLog('User chose to continue sync despite duplicate data');
              duplicateDetectionCount = 0; // 重置计数器
            }
          }
        } else {
          // 如果有新数据或更新数据，重置重复检测计数
          duplicateDetectionCount = 0;
        }
        
        totalSynced += data.length;
        
        // 更新进度
        if (onProgress) {
          onProgress(totalSynced, totalSynced); // 由于不知道总数，这里只传当前数量
        }
        
        // 如果返回的数据量小于请求量，说明已经获取完所有数据
        if (apiResponse.content.length < limit) {
          break;
        }
        
        // 继续下一批次
        beginLimit += limit;
        
        // 增加随机延时，避免频繁请求
        const randomDelay = Math.floor(Math.random() * 2000) + 500; // 500-2500ms 随机延时
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }
      
      return totalSynced;
    } catch (error) {
      console.error('Failed to sync data:', error);
      throw error;
    }
  },


  // 发送短信验证码
  sendSMS: async (mobile: string, area: string = '86', answer?: string): Promise<SMSResult> => {
    try {
      const body: Record<string, string> = { mobile, area };
      if (answer) body.answer = answer;

      return await makeApiRequest<SMSResult>('/user/api/v1/sms/send2', body);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  },

  // 手机验证码登录
  loginWithPhoneCode: async (mobile: string, code: string): Promise<LoginUserInfo> => {
    try {
      const body = { mobile, code };
      
      // 添加pa header逻辑
      const customHeaders: Record<string, string> = {};
      function generatePa(): string {
        // 生成随机salt
        const generateRandomSalt = (length: number = 20): string => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let result = '';
          for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          return result;
        };

        const salt = generateRandomSalt(20);
        const currentTimestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
        
        // 创建MD5哈希 (按照Python代码顺序: timestamp + randomNum + salt)
        const mixData = currentTimestamp.toString() + randomNum.toString() + salt;
        
        // 浏览器兼容的MD5实现
        const md5 = (str: string): string => {
          function rotateLeft(value: number, amount: number): number {
            return (value << amount) | (value >>> (32 - amount));
          }

          function addUnsigned(x: number, y: number): number {
            return ((x & 0x7FFFFFFF) + (y & 0x7FFFFFFF)) ^ (x & 0x80000000) ^ (y & 0x80000000);
          }

          function md5cycle(x: number[], k: number[]): number[] {
            let a = x[0], b = x[1], c = x[2], d = x[3];

            a = ff(a, b, c, d, k[0], 7, -680876936);
            d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819);
            b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897);
            d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341);
            b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416);
            d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063);
            b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682);
            d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290);
            b = ff(b, c, d, a, k[15], 22, 1236535329);

            a = gg(a, b, c, d, k[1], 5, -165796510);
            d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713);
            b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691);
            d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335);
            b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438);
            d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961);
            b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467);
            d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473);
            b = gg(b, c, d, a, k[12], 20, -1926607734);

            a = hh(a, b, c, d, k[5], 4, -378558);
            d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562);
            b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060);
            d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632);
            b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174);
            d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979);
            b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487);
            d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520);
            b = hh(b, c, d, a, k[2], 23, -995338651);

            a = ii(a, b, c, d, k[0], 6, -198630844);
            d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905);
            b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571);
            d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523);
            b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359);
            d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380);
            b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070);
            d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259);
            b = ii(b, c, d, a, k[9], 21, -343485551);

            return [addUnsigned(a, x[0]), addUnsigned(b, x[1]), addUnsigned(c, x[2]), addUnsigned(d, x[3])];
          }

          function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
            return addUnsigned(rotateLeft(addUnsigned(addUnsigned(a, q), addUnsigned(x, t)), s), b);
          }

          function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
            return cmn((b & c) | ((~b) & d), a, b, x, s, t);
          }

          function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
            return cmn((b & d) | (c & (~d)), a, b, x, s, t);
          }

          function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
            return cmn(b ^ c ^ d, a, b, x, s, t);
          }

          function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
            return cmn(c ^ (b | (~d)), a, b, x, s, t);
          }

          function convertToWordArray(str: string): number[] {
            const wordArray: number[] = [];
            for (let i = 0; i < str.length * 8; i += 8) {
              wordArray[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32);
            }
            return wordArray;
          }

          function convertToHex(wordArray: number[]): string {
            let hex = '';
            for (let i = 0; i < wordArray.length * 4; i++) {
              hex += ((wordArray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF).toString(16) +
                     ((wordArray[i >> 2] >> ((i % 4) * 8)) & 0xF).toString(16);
            }
            return hex;
          }

          const x = convertToWordArray(str);
          const len = str.length * 8;
          x[len >> 5] |= 0x80 << (len % 32);
          x[(((len + 64) >>> 9) << 4) + 14] = len;

          let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

          for (let i = 0; i < x.length; i += 16) {
            const result = md5cycle([a, b, c, d], x.slice(i, i + 16));
            a = result[0]; b = result[1]; c = result[2]; d = result[3];
          }

          return convertToHex([a, b, c, d]);
        };
        
        const mixStr = md5(mixData);
        const source = `${currentTimestamp},${randomNum},${mixStr}`;
        
        return btoa(source);
      }
      
      customHeaders['pa'] = generatePa();
      
      
      return await makeApiRequest<LoginUserInfo>('/user/api/v1/login/app/mobile/code', body, undefined, true, customHeaders);
    } catch (error) {
      console.error('Failed to login with phone code:', error);
      throw error;
    }
  },

  // 获取用户信息reload
  requestUserInfoReload: async (token: string): Promise<UserInfoReloadOrSwitch> => {
    try {
      const body = { from: 'appstart' };
      return await makeApiRequest<UserInfoReloadOrSwitch>('/user/api/v1/user/info/reload', body, token);
    } catch (error) {
      console.error('Failed to reload user info:', error);
      throw error;
    }
  },

  // 切换账号
  requestUserInfoSwitch: async (token: string, userId: number): Promise<UserInfoReloadOrSwitch> => {
    try {
      const body = { toUserId: userId };
      return await makeApiRequest<UserInfoReloadOrSwitch>('/user/api/v1/bigsmall/switch/user', body, token);
    } catch (error) {
      console.error('Failed to switch user:', error);
      throw error;
    }
  },

  // 生成统计信息
  generateStatistics: (data: DataItem[]): Statistics => {
    const monthlyStats: Record<string, number> = {};
    const monthlyStatsByStar: Record<string, Record<string, number>> = {};
    const labelStats: Record<string, number> = {};
    const monthlyCostStats: Record<string, number> = {};
    let audioCount = 0;
    let videoCount = 0;
    let textCount = 0;
    let totalCost = 0;
    
    data.forEach(item => {
      // 月度统计 - 使用问题发送时间（questionTime）
      let month: string;
      try {
        // 优先使用问题发送时间，如果没有则使用回复时间
        const timeStr = item.questionTime || item.timestamp;
        let date: Date;
        
        // 处理Unix时间戳格式
        if (/^\d{13}$/.test(timeStr)) {
          date = new Date(parseInt(timeStr));
        } else if (/^\d{10}$/.test(timeStr)) {
          date = new Date(parseInt(timeStr) * 1000);
        } else {
          date = new Date(timeStr);
        }
        
        if (!isNaN(date.getTime())) {
          month = date.toISOString().slice(0, 7);
          monthlyStats[month] = (monthlyStats[month] || 0) + 1;
        } else {
          // 无效时间戳，使用默认月份
          month = '未知时间';
          monthlyStats[month] = (monthlyStats[month] || 0) + 1;
        }
      } catch (error) {
        console.error('Invalid timestamp in generateStatistics:', item.questionTime || item.timestamp, error);
        month = '未知时间';
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      }
      
      // 按idol分组的月度统计
      const starKey = item.starName || item.idolNickname || '';
      if (!monthlyStatsByStar[starKey]) {
        monthlyStatsByStar[starKey] = {};
      }
      monthlyStatsByStar[starKey][month] = (monthlyStatsByStar[starKey][month] || 0) + 1;
      
      // Cost统计
      const itemCost = item.cost || 0;
      totalCost += itemCost;
      monthlyCostStats[month] = (monthlyCostStats[month] || 0) + itemCost;
      
      // 标签统计（如果需要的话）
      item.labels.forEach(label => {
        labelStats[label] = (labelStats[label] || 0) + 1;
      });

      // 类型统计
      switch (item.type) {
        case 'audio':
          audioCount++;
          break;
        case 'video':
          videoCount++;
          break;
        case 'text':
        default:
          textCount++;
          break;
      }
    });
    
    return {
      totalItems: data.length,
      monthlyStats,
      monthlyStatsByStar,
      labelStats,
      audioCount,
      videoCount,
      textCount,
      totalCost,
      monthlyCostStats
    };
  }
};
