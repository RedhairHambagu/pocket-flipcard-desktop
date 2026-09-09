import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, Loader2, Phone, HardDrive, Trash2 } from 'lucide-react';
import { authUtils } from '../utils/auth';
import { PhoneLoginFormData } from '../types';
import { getDefaultLoginTab } from '../utils/env';
import { eraseAllLocalApplicationData } from '../utils/localData';
import { isTauriDesktop, quitDesktopApp } from '../utils/desktop';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onEnterOfflineMode?: () => void;
  hasOfflineData?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onEnterOfflineMode, hasOfflineData }) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'token'>(getDefaultLoginTab());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [erasingAllData, setErasingAllData] = useState(false);
  const [eraseConfirmStep, setEraseConfirmStep] = useState<'idle' | 'first' | 'final'>('idle');
  
  // SMS verification code states
  const [smsLoading, setSmsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Phone form state
  const [phoneCredentials, setPhoneCredentials] = useState({
    areaCode: '86',
    phoneNumber: '',
    verificationCode: ''
  });

  // Token form state
  const [token, setToken] = useState('');

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 使用真实的手机号登录API
      const result = await authUtils.phoneLogin(phoneCredentials);
      if (result.success && result.data) {
        authUtils.saveUser(result.data);
        onLogin(result.data);
      } else {
        setError(result.message || '手机号或验证码错误');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authUtils.tokenLogin(token);
      if (result.success && result.data) {
        authUtils.saveTokenToSession(token); // 保存真实token到sessionStorage
        authUtils.saveUser(result.data); // 保存用户信息到localStorage
        onLogin(result.data);
      } else {
        setError(result.message || 'Token登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 验证手机号格式
  const validatePhoneNumber = (phone: string): boolean => {
    // 中国手机号验证：11位数字，以1开头
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  };

  // 获取验证码
  const handleGetVerificationCode = async () => {
    if (!phoneCredentials.phoneNumber) {
      setError('请输入手机号');
      return;
    }

    if (!validatePhoneNumber(phoneCredentials.phoneNumber)) {
      setError('请输入正确的手机号格式');
      return;
    }

    if (countdown > 0) {
      return; // 倒计时期间不允许重复发送
    }

    setSmsLoading(true);
    setError('');

    try {
      const result = await authUtils.requestSMS(phoneCredentials.phoneNumber, phoneCredentials.areaCode);
      if (result.success) {
        setCountdown(60); // 60秒倒计时
        setError('');
      } else {
        setError(result.message || '发送验证码失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setSmsLoading(false);
    }
  };

  const handleEraseAllLocalData = async () => {
    setEraseConfirmStep('idle');
    setErasingAllData(true);
    try {
      await eraseAllLocalApplicationData();
      alert('所有本机数据已清除。应用将退出。');
      await quitDesktopApp();
      window.location.reload();
    } catch (err) {
      console.error('Erase all local data failed:', err);
      setError('彻底清除失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setErasingAllData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-cyan-200/40 rounded-full blur-2xl"></div>
      </div>

      <div className="relative w-full max-w-md animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300 hover:shadow-3xl transform hover:scale-[1.02]">
          <div className="text-center mb-8">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-3">口袋翻牌工具</h1>
            <p className="text-slate-600">一键导出口袋的翻牌数据</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'phone'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              手机号登录
            </button>
            <button
              onClick={() => setActiveTab('token')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === 'token'
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Token登录
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Phone Login Form */}
          {activeTab === 'phone' && (
            <form onSubmit={handlePhoneLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">手机号</label>
                <div className="flex space-x-3">
                  <div className="relative w-20">
                    <input
                      type="text"
                      value={phoneCredentials.areaCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 只允许数字
                        if (value.length <= 4) {
                          setPhoneCredentials(prev => ({ ...prev, areaCode: value }));
                        }
                      }}
                      className="w-full px-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-center hover:border-slate-400"
                      placeholder="区号"
                      maxLength={4}
                      required
                    />
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={phoneCredentials.phoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 只允许数字
                        if (value.length <= 11) {
                          setPhoneCredentials(prev => ({ ...prev, phoneNumber: value }));
                          setError(''); // 清除错误信息
                        }
                      }}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-slate-400 ${
                        phoneCredentials.phoneNumber && !validatePhoneNumber(phoneCredentials.phoneNumber)
                          ? 'border-red-300'
                          : 'border-slate-300'
                      }`}
                      placeholder="请输入手机号"
                      maxLength={11}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">验证码</label>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={phoneCredentials.verificationCode}
                    onChange={(e) => setPhoneCredentials(prev => ({ ...prev, verificationCode: e.target.value }))}
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all hover:border-slate-400"
                    placeholder="验证码"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGetVerificationCode}
                    disabled={countdown > 0 || smsLoading || !phoneCredentials.phoneNumber}
                    className={`px-4 py-3 border rounded-xl text-sm transition-all duration-200 ${
                      countdown > 0 || smsLoading || !phoneCredentials.phoneNumber
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300'
                    }`}
                  >
                    {smsLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : countdown > 0 ? (
                      `${countdown}s`
                    ) : (
                      '获取验证码'
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    登录
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Token Form */}
          {activeTab === 'token' && (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">访问Token</label>
                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none hover:border-slate-400"
                  rows={4}
                  placeholder="请输入您的访问Token"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 px-4 rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    使用Token登录
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Login Tips */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 font-medium mb-2">💡 登录建议：</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              推荐使用Token登录，手机号登录会踢掉其他已登录设备， 如有其他问题请及时联系开发者，尽量不要使用手机号频繁登录，不要反复尝试
            </p>
          </div>

          {/* Demo Info */}
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-blue-800 font-medium mb-2">演示信息：</p>
            <p className="text-xs text-blue-600">
              手机号登录：13800138000 / 1234<br />
              Token登录：valid_token_demo123
            </p>
          </div>

          {/* Offline Mode Entry */}
          {onEnterOfflineMode && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              <button
                onClick={onEnterOfflineMode}
                className="mt-4 w-full bg-gradient-to-r from-slate-600 to-slate-700 text-white py-3 px-4 rounded-xl font-medium hover:from-slate-700 hover:to-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
              >
                <HardDrive className="mr-2 w-5 h-5" />
                进入离线模式
              </button>

              <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs text-slate-600">
                  {hasOfflineData
                    ? "💾 检测到本地数据，您可以在离线模式下查看和导出已保存的数据"
                    : "📁 离线模式可以让您导入和查看本地数据文件，无需网络连接"
                  }
                </p>
              </div>
            </div>
          )}

          {isTauriDesktop() && (
            <button
              type="button"
              onClick={() => setEraseConfirmStep('first')}
              disabled={erasingAllData}
              className="mt-5 w-full text-xs text-rose-600 transition-colors hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {erasingAllData ? '正在清除本机数据…' : '彻底清除本机数据并退出'}
            </button>
          )}

          {eraseConfirmStep !== 'idle' && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-2xl">
                <h3 className="text-lg font-bold text-rose-700">彻底清除本机数据</h3>
                {eraseConfirmStep === 'first' ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    这会删除所有账号数据、登录状态、设置和应用内音视频缓存，且无法恢复。<br />
                    已导出的备份和媒体文件不会被删除。
                  </p>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    请再次确认：清理完成后应用会立即退出，之后需要重新登录。<br />
                    是否继续？
                  </p>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEraseConfirmStep('idle')}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => eraseConfirmStep === 'first' ? setEraseConfirmStep('final') : void handleEraseAllLocalData()}
                    className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                  >
                    {eraseConfirmStep === 'first' ? '继续' : '确认清除并退出'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
