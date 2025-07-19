import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const ConfirmationContext = createContext();

export const ConfirmationProvider = ({ children }) => {
  const [confirmation, setConfirmation] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: null,
    onCancel: null,
  });

  const showConfirmation = useCallback(({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
  }) => {
    setConfirmation({
      visible: true,
      title,
      message,
      confirmText,
      cancelText,
      variant,
      onConfirm,
      onCancel,
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmation(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmation.onConfirm) {
      confirmation.onConfirm();
    }
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const handleCancel = useCallback(() => {
    if (confirmation.onCancel) {
      confirmation.onCancel();
    }
    hideConfirmation();
  }, [confirmation, hideConfirmation]);

  const confirmDelete = useCallback((itemName, onConfirm) => {
    showConfirmation({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm,
    });
  }, [showConfirmation]);

  const confirmAction = useCallback((title, message, onConfirm, variant = 'info') => {
    showConfirmation({
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      variant,
      onConfirm,
    });
  }, [showConfirmation]);

  return (
    <ConfirmationContext.Provider value={{
      showConfirmation,
      confirmDelete,
      confirmAction,
      hideConfirmation,
    }}>
      {children}
      <ConfirmationModal
        visible={confirmation.visible}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}; 