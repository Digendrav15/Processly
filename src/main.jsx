import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SystemProvider } from './context/SystemContext';
import App from './App';
import './index.css';
import { checkAndRunAutoCleanup } from './services/dataCleanupService';

// Automatically ensure desktop local storage is clean and free of legacy dummy records
checkAndRunAutoCleanup();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <SystemProvider>
              <App />
            </SystemProvider>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
