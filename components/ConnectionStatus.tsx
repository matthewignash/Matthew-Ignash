
import React, { useState, useEffect } from 'react';
import { apiService, ConnectionInfo, ConnectionState } from '../services/api';
import { Cloud, CloudOff, Loader2, AlertTriangle, Database, Wifi, WifiOff, Settings } from 'lucide-react';

interface ConnectionStatusProps {
  mode: 'mock' | 'api';
  onSettingsClick?: () => void;
  compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  mode, 
  onSettingsClick,
  compact = false 
}) => {
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>(apiService.getConnectionInfo());

  useEffect(() => {
    // Subscribe to connection info changes
    const unsubscribe = apiService.subscribe(setConnectionInfo);
    return unsubscribe;
  }, []);

  const getStatusConfig = (state: ConnectionState, isApiMode: boolean) => {
    if (!isApiMode) {
      return {
        icon: Database,
        label: 'Local Storage',
        description: 'Data saved in browser',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        dotColor: 'bg-amber-500'
      };
    }

    switch (state) {
      case 'connected':
        return {
          icon: Cloud,
          label: 'Connected',
          description: connectionInfo.spreadsheetName || 'Google Sheets',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          dotColor: 'bg-emerald-500'
        };
      case 'connecting':
        return {
          icon: Loader2,
          label: 'Connecting...',
          description: 'Checking backend status',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          dotColor: 'bg-blue-500',
          animate: true
        };
      case 'needs_setup':
        return {
          icon: AlertTriangle,
          label: 'Setup Required',
          description: 'Backend needs configuration',
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          dotColor: 'bg-amber-500'
        };
      case 'error':
        return {
          icon: CloudOff,
          label: 'Connection Error',
          description: connectionInfo.error || 'Unable to connect',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          dotColor: 'bg-red-500'
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          label: 'Disconnected',
          description: 'No API configured',
          color: 'text-slate-500',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          dotColor: 'bg-slate-400'
        };
    }
  };

  const config = getStatusConfig(connectionInfo.state, mode === 'api');
  const Icon = config.icon;

  if (compact) {
    return (
      <button
        onClick={onSettingsClick}
        className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor} hover:opacity-80 transition-opacity`}
        title={`${config.label}: ${config.description}`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dotColor} ${config.animate ? 'animate-pulse' : ''}`} />
        <Icon className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">{mode === 'mock' ? 'Local' : config.label}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
      <div className="relative">
        <Icon className={`w-5 h-5 ${config.color} ${config.animate ? 'animate-spin' : ''}`} />
        <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${config.dotColor} border-2 border-white ${config.animate ? 'animate-pulse' : ''}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {config.description}
        </div>
      </div>

      {onSettingsClick && (
        <button
          onClick={onSettingsClick}
          className="p-1.5 hover:bg-white/50 rounded-md transition-colors"
          title="Connection Settings"
        >
          <Settings className="w-4 h-4 text-slate-400" />
        </button>
      )}
    </div>
  );
};