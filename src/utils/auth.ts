import { User } from '../types';
import { apiUtils } from './api';

const STORAGE_KEYS = {
  USER: 'app_user',
  TOKEN: 'app_token',
  SESSION: 'app_session',
  SUB_ACCOUNTS: 'sub_accounts',
  CURRENT_ACCOUNT: 'current_account',
  RELOAD_INFO: 'reload_info_cache'
};

export const authUtils = {
  // Save user data to localStorage (for phone login)
  saveUser: (user: User) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, user.token);
  },

  // Save token to sessionStorage (for token login)
  saveTokenToSession: (token: string) => {
    sessionStorage.setItem(STORAGE_KEYS.SESSION, token);
  },


  // Get current user
  getCurrentUser: (): User | null => {
    // 首先检查是否有子账号被选中
    const currentAccount = localStorage.getItem(STORAGE_KEYS.CURRENT_ACCOUNT);
    if (currentAccount) {
      try {
        return JSON.parse(currentAccount);
      } catch (e) {
        console.error('Failed to parse current account:', e);
      }
    }
    
    // 否则返回主账号
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
    
    return null;
  },

  // Get token from localStorage or sessionStorage
  getToken: (): string | null => {
    // 优先从sessionStorage获取token（token登录）
    const sessionToken = sessionStorage.getItem(STORAGE_KEYS.SESSION);
    if (sessionToken) {
      return sessionToken;
    }
    
    // 如果sessionStorage中没有，再从localStorage获取（手机号登录）
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },


  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!authUtils.getToken();
  },

  // Logout and clear all storage
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.SUB_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT);
  },

  // 获取子账号列表
  getSubAccounts: (): User[] => {
    const subAccounts = localStorage.getItem(STORAGE_KEYS.SUB_ACCOUNTS);
    if (subAccounts) {
      try {
        return JSON.parse(subAccounts);
      } catch (e) {
        console.error('Failed to parse sub accounts:', e);
      }
    }
    return [];
  },

  // 保存子账号列表
  saveSubAccounts: (accounts: User[]) => {
    localStorage.setItem(STORAGE_KEYS.SUB_ACCOUNTS, JSON.stringify(accounts));
  },

  // 切换到子账号
  switchToSubAccount: (account: User) => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(account));
  },

  // 切换回主账号
  switchToMainAccount: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ACCOUNT);
  },

  // 发送短信验证码
  requestSMS: async (phoneNumber: string, areaCode: string = '86') => {
    // 检查是否是演示账号，如果是则直接返回成功，不调用真实API
    if (phoneNumber === '13800138000') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: '验证码已发送（演示模式）' };
    }
    
    // 非演示账号，调用真实API
    try {
      const result = await apiUtils.sendSMS(phoneNumber, areaCode);
      if (result.success) {
        return { success: true, message: '验证码已发送' };
      } else {
        return { success: false, message: result.message || '发送验证码失败' };
      }
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return { success: false, message: error instanceof Error ? error.message : '网络错误，请重试' };
    }
  },

  // Phone login function (支持真实API和演示账号)
  phoneLogin: async (credentials: { phoneNumber: string; verificationCode: string }) => {
    // 检查是否是演示账号，如果是则直接返回模拟数据，不调用真实API
    if (credentials.phoneNumber === '13800138000' && credentials.verificationCode === '1234') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: 'demo_user',
        username: '演示用户',
        token: 'demo_token_' + Date.now(),
        userId: 888888, // 演示用户ID
        avatar: ''
      };
      return { success: true, data: user };
    }
    
    // 非演示账号，调用真实API
    try {
      const result = await apiUtils.loginWithPhoneCode(credentials.phoneNumber, credentials.verificationCode);
      
      if (result.success && result.content?.userInfo) {
        const token = result.content.userInfo.token;
        
        // 登录成功后，调用reload API获取完整账号信息
        const reloadResult = await apiUtils.requestUserInfoReload(token);
        
        if (reloadResult.success && reloadResult.content) {
          // 保存reload信息，用于切换账号
          const reloadInfo = {
            token: token,
            content: reloadResult.content,
            timestamp: Date.now()
          };
          localStorage.setItem(STORAGE_KEYS.RELOAD_INFO, JSON.stringify(reloadInfo));
          
          // 如果有子账号信息，保存到本地
          if (reloadResult.content.bigSmallInfo) {
            const accounts: User[] = [];
            
            // 添加主账号
            accounts.push({
              id: reloadResult.content.bigSmallInfo.bigUserInfo.userId.toString(),
              username: `${reloadResult.content.bigSmallInfo.bigUserInfo.nickname}（主要账号）`,
              token: token,
              userId: reloadResult.content.bigSmallInfo.bigUserInfo.userId,
              avatar: reloadResult.content.bigSmallInfo.bigUserInfo.avatar
            });
            
            // 添加子账号
            if (reloadResult.content.bigSmallInfo.smallUserInfo) {
              reloadResult.content.bigSmallInfo.smallUserInfo.forEach(smallUser => {
                accounts.push({
                  id: smallUser.userId.toString(),
                  username: `${smallUser.nickname}（小号）`,
                  token: '', // 子账号需要通过switch API获取token
                  userId: smallUser.userId,
                  avatar: smallUser.avatar
                });
              });
            }
            
            authUtils.saveSubAccounts(accounts);
          }
        }
        
        const user: User = {
          id: result.content.userInfo.userId.toString(),
          username: result.content.userInfo.nickname,
          token: result.content.userInfo.token,
          userId: result.content.userInfo.userId,
          avatar: result.content.userInfo.avatar
        };
        return { success: true, data: user };
      } else {
        return { success: false, message: result.message || '登录失败' };
      }
    } catch (error) {
      console.error('Failed to login with phone:', error);
      return { success: false, message: error instanceof Error ? error.message : '网络错误，请重试' };
    }
  },

  // Token login function (支持真实API和演示token)
  tokenLogin: async (token: string) => {
    const trimmedToken = token.trim();
    
    // 检查是否是演示token
    if (trimmedToken === 'valid_token_demo123') {
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user: User = {
        id: 'demo_token_user',
        username: '演示Token用户',
        token: trimmedToken,
        userId: 999999, // 演示用户ID
        avatar: ''
      };
      return { success: true, data: user };
    }
    
    // 非演示token，调用真实API验证和reload用户信息
    try {
      if (!trimmedToken || trimmedToken.length <= 10) {
        return { success: false, message: 'Token格式无效' };
      }

      // 调用用户信息reload API获取真实用户信息
      const reloadResult = await apiUtils.requestUserInfoReload(trimmedToken);
      
      if (reloadResult.success && reloadResult.content) {
        // 保存reload信息，用于切换账号
        const reloadInfo = {
          token: trimmedToken,
          content: reloadResult.content,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.RELOAD_INFO, JSON.stringify(reloadInfo));
        
        // 如果有子账号信息，保存到本地
        if (reloadResult.content.bigSmallInfo) {
          const accounts: User[] = [];
          
          // 添加主账号
          accounts.push({
            id: reloadResult.content.bigSmallInfo.bigUserInfo.userId.toString(),
            username: `${reloadResult.content.bigSmallInfo.bigUserInfo.nickname}（主要账号）`,
            token: trimmedToken,
            userId: reloadResult.content.bigSmallInfo.bigUserInfo.userId,
            avatar: reloadResult.content.bigSmallInfo.bigUserInfo.avatar
          });
          
          // 添加子账号
          if (reloadResult.content.bigSmallInfo.smallUserInfo) {
            reloadResult.content.bigSmallInfo.smallUserInfo.forEach(smallUser => {
              accounts.push({
                id: smallUser.userId.toString(),
                username: `${smallUser.nickname}（小号）`,
                token: '', // 子账号需要通过switch API获取token
                userId: smallUser.userId,
                avatar: smallUser.avatar
              });
            });
          }
          
          authUtils.saveSubAccounts(accounts);
        }
        
        const user: User = {
          id: reloadResult.content.userId.toString(),
          username: reloadResult.content.nickname,
          token: trimmedToken,
          userId: reloadResult.content.userId,
          avatar: reloadResult.content.avatar
        };
        return { success: true, data: user };
      } else {
        return { success: false, message: reloadResult.message || 'Token验证失败' };
      }
    } catch (error) {
      console.error('Failed to validate token:', error);
      return { success: false, message: error instanceof Error ? error.message : '网络错误，请重试' };
    }
  },

  // 切换到指定账号
  switchAccount: async (targetUserId: number) => {
    try {
      const reloadInfoStr = localStorage.getItem(STORAGE_KEYS.RELOAD_INFO);
      if (!reloadInfoStr) {
        return { success: false, message: '缺少账号信息，请重新登录' };
      }
      
      const reloadInfo = JSON.parse(reloadInfoStr);
      const originalToken = reloadInfo.token;
      
      // 检查是否是当前已登录的账号
      const currentUser = authUtils.getCurrentUser();
      if (currentUser?.userId === targetUserId) {
        return { success: true, message: '已经是当前账号' };
      }

      // 获取目标账号信息以显示友好的账号名称
      const availableAccounts = authUtils.getSubAccounts();
      const targetAccount = availableAccounts.find(account => account.userId === targetUserId);
      const targetAccountName = targetAccount ? targetAccount.username : `ID: ${targetUserId}`;
      
      // 添加切换账号确认提示
      const userConfirmed = confirm(
        `⚠️ 重要提示：\n\n` +
        `切换账号将会使当前token失效，所有已登录的设备将被踢掉。\n\n` +
        `确定要切换到账号「${targetAccountName}」吗？\n\n` +
        `点击"确定"继续切换，点击"取消"停留在当前账号。`
      );
      
      if (!userConfirmed) {
        return { success: false, message: '用户取消了账号切换' };
      }
      
      // 检查是否是主账号
      if (reloadInfo.content.userId === targetUserId) {
        // 切换到主账号，也需要调用switch API获取新token
        const switchResult = await apiUtils.requestUserInfoSwitch(originalToken, targetUserId);
        
        if (switchResult.success && switchResult.content && switchResult.content.token) {
          const mainUser: User = {
            id: targetUserId.toString(),
            username: switchResult.content.nickname,
            token: switchResult.content.token, // 使用新返回的token
            userId: targetUserId,
            avatar: switchResult.content.avatar
          };
          
          // 重新设置用户信息到localStorage和sessionStorage
          authUtils.saveUser(mainUser);
          authUtils.saveTokenToSession(switchResult.content.token);
          authUtils.switchToSubAccount(mainUser);
          
          return { success: true, data: mainUser, message: '已切换到主账号' };
        } else {
          return { success: false, message: switchResult.message || '切换到主账号失败' };
        }
      }
      
      // 切换到子账号，需要调用switch API
      const switchResult = await apiUtils.requestUserInfoSwitch(originalToken, targetUserId);
      
      if (switchResult.success && switchResult.content && switchResult.content.token) {
        const subUser: User = {
          id: targetUserId.toString(),
          username: switchResult.content.nickname,
          token: switchResult.content.token, // 必须使用新返回的token
          userId: targetUserId,
          avatar: switchResult.content.avatar
        };
        
        // 重新设置用户信息到localStorage和sessionStorage
        authUtils.saveUser(subUser);
        authUtils.saveTokenToSession(switchResult.content.token);
        authUtils.switchToSubAccount(subUser);
        
        return { success: true, data: subUser, message: '账号切换成功' };
      } else {
        return { success: false, message: switchResult.message || '切换账号失败：未获取到有效token' };
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
      return { success: false, message: error instanceof Error ? error.message : '切换账号时发生错误' };
    }
  },

  // 获取可切换的账号列表
  getAvailableAccounts: (): User[] => {
    return authUtils.getSubAccounts();
  },

  // 获取reload信息
  getReloadInfo: () => {
    const reloadInfoStr = localStorage.getItem(STORAGE_KEYS.RELOAD_INFO);
    if (reloadInfoStr) {
      try {
        return JSON.parse(reloadInfoStr);
      } catch (e) {
        console.error('Failed to parse reload info:', e);
      }
    }
    return null;
  },

  // 刷新账号信息
  refreshAccountInfo: async () => {
    const currentUser = authUtils.getCurrentUser();
    if (!currentUser?.token) {
      return { success: false, message: '未找到当前用户token' };
    }
    
    try {
      // 重新调用reload API获取最新信息
      const reloadResult = await apiUtils.requestUserInfoReload(currentUser.token);
      
      if (reloadResult.success && reloadResult.content) {
        // 更新reload信息缓存
        const reloadInfo = {
          token: currentUser.token,
          content: reloadResult.content,
          timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.RELOAD_INFO, JSON.stringify(reloadInfo));
        
        // 更新用户信息
        const updatedUser: User = {
          ...currentUser,
          username: reloadResult.content.nickname,
          userId: reloadResult.content.userId,
          avatar: reloadResult.content.avatar
        };
        
        // 如果是主账号，更新主账号信息
        const mainUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (mainUser) {
          const parsed = JSON.parse(mainUser);
          if (parsed.userId === updatedUser.userId) {
            authUtils.saveUser(updatedUser);
          }
        }
        
        // 更新当前账号信息
        authUtils.switchToSubAccount(updatedUser);
        
        return { success: true, data: updatedUser, message: '账号信息已刷新' };
      } else {
        return { success: false, message: reloadResult.message || '刷新账号信息失败' };
      }
    } catch (error) {
      console.error('Failed to refresh account info:', error);
      return { success: false, message: error instanceof Error ? error.message : '刷新账号信息时发生错误' };
    }
  }
};