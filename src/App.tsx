import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from './utils/auth';
import { User } from './types';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { WelcomePage } from './components/WelcomePage';
import OfflineModePage from './components/OfflineModePage';
import { VERSION_INFO } from './config/version';
import { offlineModeManager, offlineUtils } from './utils/offline';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasOfflineData, setHasOfflineData] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // 检查是否有离线数据
      const hasData = await offlineModeManager.hasOfflineData();
      setHasOfflineData(hasData);

      // 如果当前路径是 /offline，设置离线模式
      if (location.pathname === '/offline') {
        offlineModeManager.setOfflineMode(true);
        setLoading(false);
        return;
      }

      // 原有的在线模式逻辑
      const token = authUtils.getToken();
      const lastSeenVersion = localStorage.getItem('lastSeenVersion');

      // 检查是否需要显示欢迎页：首次使用或版本更新
      const shouldShowWelcome = !lastSeenVersion || lastSeenVersion !== VERSION_INFO.version;

      if (token) {
        // 如果有token，尝试从存储中获取完整的用户信息
        const currentUser = authUtils.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // 如果没有存储的用户信息，创建一个基本的用户对象
          const user: any = {
            id: 'logged_in_user',
            username: '已登录用户',
            email: '',
            token: token
          };
          setUser(user);
        }

        // 如果版本更新了，也显示欢迎页
        if (shouldShowWelcome) {
          setShowWelcome(true);
        }
      } else if (shouldShowWelcome) {
        // 如果没有登录且是首次使用或版本更新，显示欢迎页
        setShowWelcome(true);
      }

      setLoading(false);
    };

    initializeApp();
  }, [location.pathname]);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleUserChange = (userData: User) => {
    setUser(userData);
  };

  const handleWelcomeContinue = () => {
    localStorage.setItem('lastSeenVersion', VERSION_INFO.version);
    setShowWelcome(false);
  };

  const handleLogout = () => {
    authUtils.logout();
    setUser(null);
  };

  const handleEnterOfflineMode = async () => {
    // 导航到离线模式页面
    navigate('/offline');
  };

  const handleExitOfflineMode = () => {
    offlineModeManager.setOfflineMode(false);
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 如果显示欢迎页，覆盖所有路由
  if (showWelcome) {
    return <WelcomePage onContinue={handleWelcomeContinue} />;
  }

  return (
    <Routes>
      {/* 离线模式路由 */}
      <Route
        path="/offline"
        element={<OfflineModePage onExit={handleExitOfflineMode} />}
      />

      {/* 主页路由 */}
      <Route
        path="/"
        element={
          user ? (
            <Dashboard
              user={user}
              onLogout={handleLogout}
              onUserChange={handleUserChange}
              isOfflineMode={false}
            />
          ) : (
            <LoginPage
              onLogin={handleLogin}
              onEnterOfflineMode={handleEnterOfflineMode}
              hasOfflineData={hasOfflineData}
            />
          )
        }
      />

      {/* 404 页面重定向到主页 */}
      <Route path="*" element={<LoginPage onLogin={handleLogin} onEnterOfflineMode={handleEnterOfflineMode} hasOfflineData={hasOfflineData} />} />
    </Routes>
  );
}

export default App;