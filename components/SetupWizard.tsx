
import React, { useState } from 'react';
import { apiService, StatusResponse, CreateResponse, AttachResponse } from '../services/api';
import { Database, Link, Plus, AlertCircle, CheckCircle, Loader2, Server, ExternalLink } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
  statusResponse?: StatusResponse;
}

type SetupStep = 'choose' | 'create' | 'attach' | 'success' | 'error';

// The specific backend sheet provided by the user
const DEFAULT_SHEET_ID = '14dSth8Ow2m65RBxeQRVWmwcAuyjYhV0DH1A-VqV4fEQ';

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, onSkip, statusResponse }) => {
  const [step, setStep] = useState<SetupStep>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResponse | AttachResponse | null>(null);
  
  // Form state
  const [backendName, setBackendName] = useState('Learning Map - Backend');
  const [sheetId, setSheetId] = useState(DEFAULT_SHEET_ID);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.createBackend(backendName);
      
      if (response.success) {
        setResult(response);
        setStep('success');
      } else {
        setError(response.error || 'Failed to create backend');
        setStep('error');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleAttach = async () => {
    if (!sheetId.trim()) {
      setError('Please enter a Spreadsheet ID');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.attachBackend(sheetId.trim());
      
      if (response.success) {
        setResult(response);
        setStep('success');
      } else if (response.needsMigration) {
        setError(`Schema migration required. Your spreadsheet is version ${response.currentVersion}, but version ${response.requiredVersion} is required.`);
        setStep('error');
      } else {
        setError(response.error || 'Failed to attach backend');
        setStep('error');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const renderChooseStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
          <Database className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Set Up Your Backend</h2>
        <p className="text-slate-500 mt-2">
          Choose how you want to store your learning maps
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Attach Existing Option - Primary Choice now */}
        <button
          onClick={() => setStep('attach')}
          className="p-6 border-2 border-emerald-200 bg-emerald-50/50 rounded-xl hover:border-emerald-400 hover:bg-emerald-100 transition-all text-left group relative"
        >
          <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-200/50 px-2 py-1 rounded-full">
            Recommended
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
              <Link className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Attach Existing</h3>
          </div>
          <p className="text-sm text-slate-600">
            Connect to the "Project Learning Map" spreadsheet you provided.
          </p>
        </button>

        {/* Create New Option */}
        <button
          onClick={() => setStep('create')}
          className="p-6 border-2 border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-800">Create New Backend</h3>
          </div>
          <p className="text-sm text-slate-500">
            Create a fresh Google Spreadsheet to store your data.
          </p>
        </button>
      </div>

      <div className="border-t border-slate-200 pt-4 mt-6">
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-slate-500 hover:text-slate-700 py-2"
        >
          Skip for now (use local storage only)
        </button>
      </div>
    </div>
  );

  const renderCreateStep = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setStep('choose')}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-3">
          <Plus className="w-6 h-6 text-indigo-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Create New Backend</h2>
        <p className="text-slate-500 text-sm mt-1">
          A new Google Spreadsheet will be created in your Drive
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Spreadsheet Name
        </label>
        <input
          type="text"
          value={backendName}
          onChange={(e) => setBackendName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Learning Map - Backend"
        />
        <p className="text-xs text-slate-400 mt-1">
          This will appear in your Google Drive
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={loading || !backendName.trim()}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" />
            Create Backend
          </>
        )}
      </button>
    </div>
  );

  const renderAttachStep = () => (
    <div className="space-y-6">
      <button 
        onClick={() => setStep('choose')}
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← Back
      </button>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-full mb-3">
          <Link className="w-6 h-6 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Attach Existing Backend</h2>
        <p className="text-slate-500 text-sm mt-1">
          Connect to a spreadsheet you already have
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Spreadsheet ID
        </label>
        <input
          type="text"
          value={sheetId}
          onChange={(e) => setSheetId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
        />
        <p className="text-xs text-slate-400 mt-1">
          Pre-filled with your provided backend sheet ID.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleAttach}
        disabled={loading || !sheetId.trim()}
        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Attaching...
          </>
        ) : (
          <>
            <Link className="w-5 h-5" />
            Attach Backend
          </>
        )}
      </button>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-2">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Backend Ready!</h2>
        <p className="text-slate-500 mt-2">
          Your data will now be saved to Google Sheets
        </p>
      </div>

      {result && 'spreadsheetName' in result && (
        <div className="bg-slate-50 rounded-lg p-4 text-left">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Spreadsheet:</span>
              <span className="font-medium text-slate-700">{result.spreadsheetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Schema Version:</span>
              <span className="font-medium text-slate-700">{result.schemaVersion}</span>
            </div>
            {'spreadsheetUrl' in result && result.spreadsheetUrl && (
              <a 
                href={result.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm mt-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Sheets
              </a>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2"
      >
        <Server className="w-5 h-5" />
        Start Using Learning Map
      </button>
    </div>
  );

  const renderErrorStep = () => (
    <div className="text-center space-y-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-2">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Setup Failed</h2>
        <p className="text-slate-500 mt-2">
          Something went wrong during setup
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setError(null);
            setStep('choose');
          }}
          className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50"
        >
          Try Again
        </button>
        <button
          onClick={onSkip}
          className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200"
        >
          Use Local Storage
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        {step === 'choose' && renderChooseStep()}
        {step === 'create' && renderCreateStep()}
        {step === 'attach' && renderAttachStep()}
        {step === 'success' && renderSuccessStep()}
        {step === 'error' && renderErrorStep()}
      </div>
    </div>
  );
};