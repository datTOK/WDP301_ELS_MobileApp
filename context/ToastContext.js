import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomToast from '../components/CustomToast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info',
    duration: 3000,
    position: 'top',
  });

  const showToast = useCallback((message, type = 'info', duration = 3000, position = 'top') => {
    setToast({
      visible: true,
      message,
      type,
      duration,
      position,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const showSuccess = useCallback((message, duration = 3000) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const showError = useCallback((message, duration = 6000) => {
    showToast(message, 'error', duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration = 3500) => {
    showToast(message, 'warning', duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration = 3000) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      hideToast,
    }}>
      {children}
      <CustomToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        position={toast.position}
        onClose={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 