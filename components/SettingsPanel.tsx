
import React, { useState, useEffect } from 'react';
import { apiService, ConnectionInfo } from '../services/api';
import { X, Server, Database, RefreshCw, Trash2, ExternalLink, CheckCircle, AlertCircle, Loader2, User, Shield, HelpCircle } from 'lucide-react';

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
  const [userInfo, setUserInfo] = useState<{ email: string; role: string; isAdmin: boolean } | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    const unsubscribe = apiService.subscribe(setConnectionInfo);
    return unsubscribe;
  }, []);

  // Fetch user info when connected
  useEffect(() => {
    const fetchUser = async () => {
      if (connectionInfo.state === 'connected' && apiService.isConfigured()) {
        setLoadingUser(true);
        try {
          const response = await apiService.whoAmI();
          if (response.success && response.user) {
            setUserInfo(response.user as any);
          }
        } catch (e) {
          console.error('Failed to fetch user:', e);
        } finally {
          setLoadingUser(false);
        }
      }
    };
    fetchUser();
  }, [connectionInfo.state]);

  const handleSaveUrl = async () => {
    if (!apiUrl.trim()) {
      setTestResult({ success: false, message: 'Please enter an API URL' });
      return;
    }

    // Basic URL validation
    if (!apiUrl.includes('script.google.com')) {
      setTestResult({ success: false, message: 'URL must be a Google Apps Script web app URL' });
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
      setUserInfo(null);
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
      apiService.checkStatus().then(status => {
        if (status.needsSetup) {
          onClose();
          onSetupRequired();
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Connection Settings</h2>
            <p className="text-slate-400 text-xs">Connect to Google Sheets backend</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Current User Info - Show if connected */}
          {connectionInfo.state === 'connected' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  {loadingUser ? (
                    <Loader2 size={20} className="text-emerald-600 animate-spin" />
                  ) : (
                    <User size={20} className="text-emerald-600" />
                  )}
                </div>
                <div className="flex-1">
                  {userInfo ? (
                    <>
                      <div className="font-bold text-emerald-800">{userInfo.email}</div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded font-bold ${userInfo.isAdmin ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'}`}>
                          {userInfo.role?.toUpperCase() || (userInfo.isAdmin ? 'TEACHER' : 'STUDENT')}
                        </span>
                        {userInfo.isAdmin && <Shield size={12} className="text-emerald-600" />}
                      </div>
                    </>
                  ) : (
                    <div className="text-emerald-700 text-sm">Connected to backend</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              Storage Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleModeToggle('mock')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  currentMode === 'mock'
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Database className={`w-5 h-5 ${currentMode === 'mock' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className={`font-bold ${currentMode === 'mock' ? 'text-amber-700' : 'text-slate-700'}`}>
                    Local
                  </span>
                </div>
                <p className="text-xs text-slate-500">Browser storage only</p>
              </button>

              <button
                onClick={() => handleModeToggle('api')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  currentMode === 'api'
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Server className={`w-5 h-5 ${currentMode === 'api' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className={`font-bold ${currentMode === 'api' ? 'text-emerald-700' : 'text-slate-700'}`}>
                    Cloud
                  </span>
                </div>
                <p className="text-xs text-slate-500">Google Sheets backend</p>
              </button>
            </div>
          </div>

          {/* API URL Input */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              Apps Script Web App URL
              <a 
                href="https://developers.google.com/apps-script/guides/web" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-600"
              >
                <HelpCircle size={14} />
              </a>
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white"
            />
            <p className="text-xs text-slate-500 mt-2">
              Paste the URL from your deployed Apps Script web app
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              disabled={saving || !apiUrl.trim()}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Save & Connect'
              )}
            </button>

            <button
              onClick={handleTestConnection}
              disabled={testing || !apiService.isConfigured()}
              className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
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
            <div className="bg-slate-50 rounded-xl p-4 text-sm border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3">Connected Backend</h4>
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Spreadsheet:</span>
                  <span className="font-medium text-slate-800">{connectionInfo.spreadsheetName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Schema Version:</span>
                  <span className="font-medium text-slate-800">{connectionInfo.schemaVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Check:</span>
                  <span className="font-medium text-slate-800">
                    {connectionInfo.lastCheck?.toLocaleTimeString() || 'Never'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-slate-700 text-sm mb-3">Setup Instructions</h4>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside">
              <li>Create a Google Apps Script project</li>
              <li>Add the backend code (Code.gs)</li>
              <li>Deploy as Web App:
                <ul className="ml-4 mt-1 space-y-1 list-disc list-inside text-slate-500">
                  <li><strong>Execute as:</strong> "User accessing the web app" for login</li>
                  <li><strong>Who has access:</strong> "Anyone" or "Anyone with Google account"</li>
                </ul>
              </li>
              <li>Copy the web app URL and paste above</li>
            </ol>
            
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-800">
                <strong>⚠️ Important:</strong> For user login to work, deploy with "Execute as: User accessing the web app". 
                This allows the script to identify who is logged in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};