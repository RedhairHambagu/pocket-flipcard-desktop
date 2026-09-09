import React, { useState, useEffect } from 'react';
import OfflineModePage from './components/OfflineModePage';
import Dashboard from './components/Dashboard';
import { offlineModeManager } from './utils/offline';
import { User } from './types';

function OfflineApp() {
  const [showDashboard, setShowDashboard] = useState(false);

  const offlineUser: User = {
    id: 'offline_user',
    username: '离线模式',
    token: 'offline_token'
  };

  useEffect(() => {
    // 确保设置为离线模式
    offlineModeManager.setOfflineMode(true);
  }, []);

  const handleEnterDashboard = () => {
    setShowDashboard(true);
  };

  const handleExitDashboard = () => {
    setShowDashboard(false);
  };

  if (showDashboard) {
    return (
      <Dashboard
        user={offlineUser}
        onLogout={handleExitDashboard}
        onUserChange={() => {}} // 离线模式下不需要用户切换
        isOfflineMode={true}
      />
    );
  }

  return (
    <OfflineModePage onExit={handleExitDashboard} />
  );
}

export default OfflineApp;