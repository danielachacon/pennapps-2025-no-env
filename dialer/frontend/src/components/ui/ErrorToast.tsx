"use client";

import React, { useState, useEffect } from 'react';
import { WorkflowError } from '@/types/workflow';

interface ErrorToastProps {
  error: WorkflowError;
  onDismiss: (errorId: string) => void;
  duration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ 
  error, 
  onDismiss, 
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onDismiss(error.id);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [error.id, duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(error.id);
    }, 300);
  };

  if (!isVisible) return null;

  const getErrorIcon = (type: WorkflowError['type']) => {
    switch (type) {
      case 'execute':
        return '⚠️';
      case 'save':
        return '💾';
      case 'connection':
        return '🔌';
      case 'validation':
        return '✋';
      default:
        return '❌';
    }
  };

  const getErrorColor = (type: WorkflowError['type']) => {
    switch (type) {
      case 'execute':
        return 'border-red-500 bg-red-50 text-red-800';
      case 'save':
        return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'connection':
        return 'border-blue-500 bg-blue-50 text-blue-800';
      case 'validation':
        return 'border-orange-500 bg-orange-50 text-orange-800';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border-2 shadow-lg
        backdrop-blur-sm bg-white/80
        transform transition-all duration-300 ease-in-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
        ${getErrorColor(error.type)}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xl flex-shrink-0">
            {getErrorIcon(error.type)}
          </span>
          <div className="flex-1">
            <h4 className="font-semibold text-sm capitalize">
              {error.type} Error
            </h4>
            <p className="text-sm mt-1 opacity-90">
              {error.message}
            </p>
            {error.nodeId && (
              <p className="text-xs mt-1 opacity-70">
                Node: {error.nodeId}
              </p>
            )}
            <p className="text-xs mt-1 opacity-60">
              {error.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
          aria-label="Dismiss error"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};