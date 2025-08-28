'use client';

import { useState, useEffect } from 'react';

interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'error';
  message: string;
  timestamp: string;
  error?: string;
}

export default function DatabaseStatusIndicator() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabaseStatus();
    // Check every 30 seconds
    const interval = setInterval(checkDatabaseStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      setStatus({
        status: 'error',
        message: 'فشل في التحقق من حالة قاعدة البيانات',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed bottom-4 left-4 bg-white/10 backdrop-blur-lg rounded-2xl p-3 shadow-xl border border-white/20">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
          <span className="text-white text-sm">جاري التحقق...</span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = () => {
    switch (status.status) {
      case 'connected':
        return 'bg-green-500/20 border-green-500/30 text-green-100';
      case 'disconnected':
        return 'bg-red-500/20 border-red-500/30 text-red-100';
      case 'error':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100';
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-100';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'connected':
        return '🟢';
      case 'disconnected':
        return '🔴';
      case 'error':
        return '🟡';
      default:
        return '⚪';
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 backdrop-blur-lg rounded-2xl p-3 shadow-xl border ${getStatusColor()}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div className="flex flex-col">
          <span className="text-sm font-medium">قاعدة البيانات</span>
          <span className="text-xs opacity-80">{status.message}</span>
          {status.error && (
            <span className="text-xs opacity-60 mt-1">خطأ: {status.error}</span>
          )}
        </div>
        <button
          onClick={checkDatabaseStatus}
          className="ml-2 p-1 hover:bg-white/10 rounded transition-colors"
          title="تحديث الحالة"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
}
