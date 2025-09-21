"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { WorkflowError, ErrorType } from '@/types/workflow';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { SuccessToast } from '@/components/ui/SuccessToast';

interface ErrorContextType {
  errors: WorkflowError[];
  addError: (type: ErrorType, message: string, nodeId?: string) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  hasErrors: boolean;
  addSuccess: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | null>(null);

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [errors, setErrors] = useState<WorkflowError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const addError = useCallback((type: ErrorType, message: string, nodeId?: string) => {
    const newError: WorkflowError = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      message,
      timestamp: new Date(),
      nodeId,
    };

    setErrors(prev => [...prev, newError]);
  }, []);

  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const addSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
  }, []);

  const dismissSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  const hasErrors = errors.length > 0;

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors, hasErrors, addSuccess }}>
      {children}
      {/* Render error toasts */}
      <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
        {successMessage && (
          <SuccessToast
            message={successMessage}
            onDismiss={dismissSuccess}
          />
        )}
        {errors.map(error => (
          <ErrorToast
            key={error.id}
            error={error}
            onDismiss={removeError}
          />
        ))}
      </div>
    </ErrorContext.Provider>
  );
};