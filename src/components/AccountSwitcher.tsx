import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User } from '../types';
import { authUtils } from '../utils/auth';
import { ChevronDown, User as UserIcon, LogOut, Users, RefreshCw } from 'lucide-react';

interface AccountSwitcherProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onLogout?: () => void;
}

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ currentUser, onUserChange, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const accounts = authUtils.getAvailableAccounts();
    setAvailableAccounts(accounts);
  };

  const handleAccountSwitch = async (targetUserId: number) => {
    if (currentUser?.userId === targetUserId) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const result = await authUtils.switchAccount(targetUserId);
      
      if (result.success && result.data) {
        onUserChange(result.data);
        setIsOpen(false);
      } else {
        // 如果是用户取消切换，不显示错误提示
        if (result.message !== '用户取消了账号切换') {
          alert(result.message || '切换账号失败');
        }
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to switch account:', error);
      alert('切换账号时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await authUtils.refreshAccountInfo();
      
      if (result.success && result.data) {
        onUserChange(result.data);
        loadUserData(); // 重新加载账号列表
      } else {
        alert(result.message || '刷新账号信息失败');
      }
    } catch (error) {
      console.error('Failed to refresh account info:', error);
      alert('刷新账号信息时发生错误');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    authUtils.logout();
    setIsOpen(false);
    
    if (onLogout) {
      onLogout();
    }
  };

  const hasMultipleAccounts = availableAccounts.length > 1;

  const toggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 256 // 256px = w-64
      });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" style={{zIndex: 9999}}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        disabled={loading}
      >
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar.startsWith('http') ? currentUser.avatar : `https://source.48.cn${currentUser.avatar}`}
            alt={currentUser.username}
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <UserIcon className="w-4 h-4 text-gray-600" />
        )}
        
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium text-gray-700 truncate max-w-32">
            {currentUser.username}
          </span>
          {hasMultipleAccounts && (
            <span className="text-gray-500 text-xs flex items-center">
              <Users className="w-3 h-3 mr-1" />
              {availableAccounts.length} 账号
            </span>
          )}
        </div>
        
        {loading ? (
          <RefreshCw className="w-4 h-4 text-gray-500 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0"
            style={{zIndex: 99998}}
            onClick={() => setIsOpen(false)}
          />

          <div
            className="w-64 bg-white rounded-lg shadow-lg border border-gray-200"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              zIndex: 99999,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
            }}
          >
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">账号管理</span>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="刷新账号信息"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="py-2">
              {hasMultipleAccounts ? (
                availableAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSwitch(account.userId!)}
                    disabled={loading}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 ${
                      currentUser.userId === account.userId ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {account.avatar ? (
                      <img
                        src={account.avatar.startsWith('http') ? account.avatar : `https://source.48.cn${account.avatar}`}
                        alt={account.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {account.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {account.userId}
                      </div>
                    </div>
                    
                    {currentUser.userId === account.userId && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  当前只有一个账号
                </div>
              )}
            </div>

            <div className="border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span className="text-sm">退出登录</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default AccountSwitcher;