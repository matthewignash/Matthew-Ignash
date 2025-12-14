import React, { useState, useEffect } from 'react';
import { apiService, ConnectionInfo } from '../services/api';
import { X, Server, Database, RefreshCw, Trash2, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  currentMode: 'mock' | 'api';
  onModeChange: (mode: 'mock' | 'api') => void;
  onSetupRequired: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  currentMode,
  onModeChange,
  onSetupRequired
}) => {
  const [apiUrl, setApiUrl] = useState(apiService.getApiUrl() || '');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo>(apiService.getConnectionInfo());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = apiService.subscribe(setConnectionInfo);
    return unsubscribe;
  }, []);

  const handleSaveUrl = async () => {
    if (!apiUrl.trim()) {
      setTestResult({ success: false, message: 'Please enter an API URL' });
      return;
    }

    try {
      setSaving(true);
      setTestResult(null);
      
      apiService.setApiUrl(apiUrl.trim());
      
      // Test the connection
      const status = await apiService.checkStatus();
      
      if (status.needsSetup) {
        setTestResult({ success: true, message: 'Connected! Backend needs setup.' });
        onModeChange('api');
        setTimeout(() => {
          onClose();
          onSetupRequired();
        }, 1000);
      } else if (status.configured) {
        setTestResult({ success: true, message: `Connected to ${status.spreadsheetName || 'backend'}` });
        onModeChange('api');
      } else {
        setTestResult({ success: false, message: status.error || 'Connection failed' });
      }
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : 'Invalid URL' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiService.isConfigured()) {
      setTestResult({ success: false, message: 'Save the API URL first' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const status = await apiService.checkStatus();
      
      if (status.needsSetup) {
        setTestResult({ success: true, message: 'Connected! Backend needs setup.' });
      } else if (status.configured) {
        setTestResult({ success: true, message: `Connected (v${status.schemaVersion})` });
      } else {
        setTestResult({ success: false, message: status.error || 'Connection failed' });
      }
    } catch (e) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleClearUrl = () => {
    if (confirm('Clear the API URL and switch to local storage mode?')) {
      apiService.clearSavedUrl();
      setApiUrl('');
      setTestResult(null);
      onModeChange('mock');
    }
  };

  const handleModeToggle = (mode: 'mock' | 'api') => {
    if (mode === 'api' && !apiService.isConfigured()) {
      setTestResult({ success: false, message: 'Enter and save an API URL first' });
      return;
    }
    onModeChange(mode);
    
    if (mode === 'api') {
      // Recheck status when switching to API mode
      apiService.checkStatus().then(status => {
        if (status.needsSetup) {
          onClose();
          onSetupRequired();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Connection Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Storage Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleModeToggle('mock')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  currentMode === 'mock'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className={`w-5 h-5 ${currentMode === 'mock' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${currentMode === 'mock' ? 'text-amber-700' : 'text-slate-700'}`}>
                    Local
                  </span>
                </div>
                <p className="text-xs text-slate-500">Browser storage only</p>
              </button>

              <button
                onClick={() => handleModeToggle('api')}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  currentMode === 'api'
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Server className={`w-5 h-5 ${currentMode === 'api' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={`font-medium ${currentMode === 'api' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    Cloud
                  </span>
                </div>
                <p className="text-xs text-slate-500">Google Sheets backend</p>
              </button>
            </div>
          </div>

          {/* API URL Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Apps Script Web App URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              The URL from your deployed Apps Script web app
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              disabled={saving || !apiUrl.trim()}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save & Connect'
              )}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testing || !apiService.isConfigured()}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Test Connection"
            >
              {testing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>

            {apiService.isConfigured() && (
              <button
                onClick={handleClearUrl}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                title="Clear URL"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              testResult.success ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              <p className={`text-sm ${testResult.success ? 'text-emerald-700' : 'text-red-700'}`}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Connection Info */}
          {connectionInfo.state === 'connected' && connectionInfo.spreadsheetName && (
            <div className="bg-slate-50 rounded-lg p-4 text-sm">
              <h4 className="font-medium text-slate-700 mb-2">Connected Backend</h4>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Spreadsheet:</span>
                  <span className="font-medium">{connectionInfo.spreadsheetName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Schema Version:</span>
                  <span className="font-medium">{connectionInfo.schemaVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Check:</span>
                  <span className="font-medium">
                    {connectionInfo.lastCheck?.toLocaleTimeString() || 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Help Link */}
          <div className="border-t border-slate-200 pt-4">
            <a
              href="#"
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                alert('See docs/TEACHER_SETUP.md for setup instructions');
              }}
            >
              <ExternalLink className="w-4 h-4" />
              How to set up the backend
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
