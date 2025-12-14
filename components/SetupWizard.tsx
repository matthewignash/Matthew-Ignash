import React, { useState, useEffect } from 'react';
import { apiService, StatusResponse } from '../services/api';
import { setStorageMode } from '../services/storage';
import { Database, Link, Plus, Loader2, CheckCircle, AlertCircle, User, Shield } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  statusResponse?: StatusResponse;
}

type SetupStep = 'welcome' | 'choose' | 'create' | 'attach' | 'complete' | 'error';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip, statusResponse }) => {
  const [step, setStep] = useState<SetupStep>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [result, setResult] = useState<{ spreadsheetId?: string; spreadsheetUrl?: string; spreadsheetName?: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ email: string; role: string; isAdmin: boolean } | null>(null);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await apiService.whoAmI();
        if (response.success && response.user) {
          setUserInfo(response.user as any);
          
          // If not admin, show error
          if (!(response.user as any).isAdmin) {
            setStep('error');
            setError('You do not have permission to set up the backend. Please contact your administrator.');
          }
        }
      } catch (e) {
        console.error('Failed to fetch user info:', e);
      }
    };
    
    if (apiService.isConfigured()) {
      fetchUserInfo();
    }
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.createBackend();
      
      if (response.success) {
        setResult({
          spreadsheetId: response.spreadsheetId,
          spreadsheetUrl: response.spreadsheetUrl
        });
        setStep('complete');
      } else {
        setError(response.error || 'Failed to create backend');
        setStep('error');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create backend');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!spreadsheetId.trim()) {
      setError('Please enter a Spreadsheet ID');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.attachBackend(spreadsheetId.trim());
      
      if (response.success) {
        setResult({
          spreadsheetId: response.spreadsheetId,
          spreadsheetUrl: response.spreadsheetUrl,
          spreadsheetName: response.spreadsheetName
        });
        setStep('complete');
      } else {
        setError(response.error || 'Failed to attach backend');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to attach backend');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setStorageMode('api');
    onComplete();
  };

  const handleSkip = () => {
    setStorageMode('mock');
    onSkip();
  };

  // Extract spreadsheet ID from URL if user pastes full URL
  const handleSpreadsheetIdChange = (value: string) => {
    // Check if it's a full Google Sheets URL
    const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      setSpreadsheetId(match[1]);
    } else {
      setSpreadsheetId(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white">
          <h2 className="text-xl font-bold">Backend Setup</h2>
          <p className="text-indigo-100 text-sm mt-1">Connect your Google Sheets database</p>
          
          {/* User Info Badge */}
          {userInfo && (
            <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2 text-sm">
              <User size={16} />
              <span>{userInfo.email}</span>
              <span className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${userInfo.isAdmin ? 'bg-emerald-400 text-emerald-900' : 'bg-amber-400 text-amber-900'}`}>
                {userInfo.role.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Welcome Step */}
          {step === 'welcome' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                <Database size={32} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Welcome to Learning Map</h3>
                <p className="text-slate-600 text-sm mt-2">
                  To save your maps permanently, you need to connect a Google Sheets backend.
                </p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left">
                <p className="text-amber-800 text-xs">
                  <strong>Note:</strong> Only teachers/admins can set up the backend. 
                  Students will be able to view and interact with maps after setup.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Use Local Storage
                </button>
                <button
                  onClick={() => setStep('choose')}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                >
                  Set Up Backend
                </button>
              </div>
            </div>
          )}

          {/* Choose Step */}
          {step === 'choose' && (
            <div className="space-y-4">
              <p className="text-slate-600 text-sm text-center mb-6">
                Choose how to set up your backend:
              </p>
              
              {/* Create New */}
              <button
                onClick={() => setStep('create')}
                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <Plus size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Create New Backend</h4>
                    <p className="text-slate-500 text-sm mt-1">
                      Creates a new Google Sheet with all required tabs and schema
                    </p>
                  </div>
                </div>
              </button>
              
              {/* Attach Existing */}
              <button
                onClick={() => setStep('attach')}
                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Link size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Attach Existing Spreadsheet</h4>
                    <p className="text-slate-500 text-sm mt-1">
                      Connect to an existing Google Sheet you own
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setStep('welcome')}
                className="w-full text-center text-slate-500 text-sm hover:text-slate-700 mt-4"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Create Step */}
          {step === 'create' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={32} className="text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Create New Backend</h3>
                <p className="text-slate-600 text-sm mt-2">
                  This will create a new Google Sheet in your Drive with the following tabs:
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <ul className="space-y-1 text-slate-600">
                  <li>📋 <strong>Config</strong> - Schema version & settings</li>
                  <li>🗺️ <strong>Maps</strong> - Learning maps data</li>
                  <li>📚 <strong>Courses</strong> - Course catalog</li>
                  <li>📖 <strong>Units</strong> - Unit organization</li>
                  <li>👥 <strong>Classes</strong> - Class groups</li>
                  <li>📊 <strong>Progress</strong> - Student progress tracking</li>
                  <li>🔗 <strong>Assignments</strong> - Map assignments</li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('choose')}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Backend'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Attach Step */}
          {step === 'attach' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Link size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Attach Existing Spreadsheet</h3>
                <p className="text-slate-600 text-sm mt-2">
                  Enter the ID of a Google Sheet you own
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Spreadsheet ID or URL
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => handleSpreadsheetIdChange(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Find the ID in your spreadsheet URL:<br/>
                  <code className="bg-slate-100 px-1 rounded">docs.google.com/spreadsheets/d/<strong>[ID]</strong>/edit</code>
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-xs">
                <strong>Note:</strong> If the spreadsheet doesn't have the required schema, 
                it will be initialized automatically.
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setStep('choose'); setError(null); }}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handleAttach}
                  disabled={loading || !spreadsheetId.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Attaching...
                    </>
                  ) : (
                    'Attach Backend'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && result && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Backend Connected!</h3>
                <p className="text-slate-600 text-sm mt-2">
                  Your Learning Map is now connected to Google Sheets.
                </p>
              </div>
              
              {result.spreadsheetUrl && (
                <a
                  href={result.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-indigo-600 hover:text-indigo-700 text-sm underline"
                >
                  Open Spreadsheet →
                </a>
              )}

              <div className="bg-slate-50 rounded-lg p-3 text-left text-xs text-slate-600">
                <strong>Spreadsheet ID:</strong><br/>
                <code className="bg-white px-2 py-1 rounded border text-xs block mt-1 break-all">
                  {result.spreadsheetId}
                </code>
              </div>

              <button
                onClick={handleComplete}
                className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Start Using Learning Map
              </button>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Setup Error</h3>
                <p className="text-red-600 text-sm mt-2">
                  {error || 'An error occurred during setup'}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setStep('choose'); setError(null); }}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium"
                >
                  Try Again
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 text-sm font-medium"
                >
                  Use Local Storage
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};