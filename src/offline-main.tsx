import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import OfflineApp from './OfflineApp.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineApp />
  </StrictMode>
);