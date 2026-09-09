// utils/env.ts

type EnvSource = {
    [key: string]: string | undefined;
  };

  function rStr(len: number): string {
    const str: string = 'QWERTYUIOPASDFGHJKLZXCVBNM1234567890';
    let result: string = '';
  
    for (let i: number = 0; i < len; i++) {
      const rIndex: number = Math.floor(Math.random() * str.length);
      result += str[rIndex];
    }
  
    return result;
  }

  const APP_INFO_CACHE_KEY = 'pocket_flipcard_app_info';

  export function generateDeviceId(): string {
    return `${rStr(8)}-${rStr(4)}-${rStr(4)}-${rStr(4)}-${rStr(12)}`;
  }

  function generateRandomDeviceName(): string {
    const iPhoneModels = [
      "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
      "iPhone 12", "iPhone 12 mini", "iPhone 12 Pro", "iPhone 12 Pro Max",
      "iPhone 13", "iPhone 13 mini", "iPhone 13 Pro", "iPhone 13 Pro Max",
      "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
      "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"
    ];
    const randomIndex = Math.floor(Math.random() * iPhoneModels.length);
    return iPhoneModels[randomIndex];
  }

  export function generateAppInfo(): string {
    try {
      const cachedAppInfo = localStorage.getItem(APP_INFO_CACHE_KEY);
      if (cachedAppInfo) {
        return cachedAppInfo;
      }
    } catch (error) {
      console.warn('无法访问 localStorage，将生成新的 appInfo');
    }

    const appInfo = {
      vendor: "apple",
      deviceId: generateDeviceId(),
      appVersion: "7.0.4",
      appBuild: "23011601",
      osVersion: '16.3.1',
      os: "ios",
      osType: 'ios',
      deviceName: generateRandomDeviceName(),
    };
    
    const appInfoStr = JSON.stringify(appInfo);
    
    try {
      localStorage.setItem(APP_INFO_CACHE_KEY, appInfoStr);
    } catch (error) {
      console.warn('无法保存 appInfo 到 localStorage');
    }
    
    return appInfoStr;
  }
  
  // 从 window.ENV 或 import.meta.env 获取环境变量
  export function getEnvVar(key: string, fallback = ''): string {
    if (typeof window !== 'undefined' && (window as any).ENV?.[key]) {
      return (window as any).ENV[key] as string;
    }
    if ((import.meta as any).env?.[key]) {
      return (import.meta as any).env[key] as string;
    }
    return fallback;
  }
  
  // 检查是否为开发环境
  export function isDevelopment(): boolean {
    const nodeEnv = getEnvVar('NODE_ENV');
    const viteMode = getEnvVar('VITE_MODE');
    
    // 明确设置为 development 才是开发环境
    if (nodeEnv === 'development' || viteMode === 'development') {
      return true;
    }
    
    // 明确设置为 production 则是生产环境
    if (nodeEnv === 'production' || viteMode === 'production') {
      return false;
    }
    
    // 都没有设置时，默认为生产环境
    return false;
  }
  
  // 开发环境日志函数
  export function devLog(...args: any[]): void {
    if (isDevelopment()) {
      console.log(...args);
    }
  }
  
  // 获取默认登录标签页
export function getDefaultLoginTab(): 'phone' | 'token' {
    const tab = getEnvVar('VITE_DEFAULT_LOGIN_TAB', 'phone');
    return tab === 'phone' ? 'phone' : 'token';
  }
  
  // 专门给请求 Header 用的函数
  export function getApiHeaders(): Record<string, string> {
    const appInfo = generateAppInfo();
    return {
      'Host': getEnvVar('VITE_API_HOST'),
      'appInfo': appInfo,
      'Content-Type': getEnvVar('VITE_API_HEADERS_CONTENT_TYPE'),
      'User-Agent': getEnvVar('VITE_API_HEADERS_USER_AGENT'),
      'Accept-Language': getEnvVar('VITE_API_HEADERS_ACCEPT_LANGUAGE'),
      'Accept-Encoding': getEnvVar('VITE_API_HEADERS_ACCEPT_ENCODING'),
      'Connection': getEnvVar('VITE_API_HEADERS_CONNECTION'),
    };
  }
  
