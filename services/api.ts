/**
 * API Service - Communicates with Google Apps Script Backend
 * 
 * Handles all HTTP requests to the deployed web app.
 * Provides typed methods for each endpoint.
 */

import { LearningMap, HexProgress } from '../types';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  _timing?: string;
}

export interface StatusResponse {
  success: boolean;
  configured: boolean;
  needsSetup: boolean;
  needsMigration?: boolean;
  schemaVersion?: number;
  currentVersion?: number;
  requiredVersion?: number;
  spreadsheetId?: string;
  spreadsheetName?: string;
  message?: string;
  error?: string;
}

export interface CreateResponse {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  schemaVersion?: number;
  message?: string;
  error?: string;
  code?: number;
}

export interface AttachResponse {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetName?: string;
  schemaVersion?: number;
  needsMigration?: boolean;
  currentVersion?: number;
  requiredVersion?: number;
  message?: string;
  error?: string;
  code?: number;
}

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'needs_setup';

export interface ConnectionInfo {
  state: ConnectionState;
  apiUrl: string | null;
  lastCheck: Date | null;
  error: string | null;
  spreadsheetName?: string;
  schemaVersion?: number;
}

/**
 * API Service Class
 * Singleton pattern for consistent state across the app
 */
class ApiService {
  private apiUrl: string | null = null;
  private connectionInfo: ConnectionInfo = {
    state: 'disconnected',
    apiUrl: null,
    lastCheck: null,
    error: null
  };
  private listeners: Set<(info: ConnectionInfo) => void> = new Set();

  constructor() {
    // Try to load saved API URL from localStorage
    this.loadSavedUrl();
  }

  /**
   * Load API URL from localStorage
   */
  private loadSavedUrl(): void {
    try {
      const saved = localStorage.getItem('learning_map_api_url');
      if (saved) {
        this.apiUrl = saved;
        this.connectionInfo.apiUrl = saved;
      }
    } catch (e) {
      console.warn('Could not load saved API URL:', e);
    }
  }

  /**
   * Save API URL to localStorage
   */
  private saveUrl(url: string): void {
    try {
      localStorage.setItem('learning_map_api_url', url);
    } catch (e) {
      console.warn('Could not save API URL:', e);
    }
  }

  /**
   * Clear saved API URL
   */
  clearSavedUrl(): void {
    try {
      localStorage.removeItem('learning_map_api_url');
      this.apiUrl = null;
      this.updateConnectionInfo({ 
        state: 'disconnected', 
        apiUrl: null,
        error: null 
      });
    } catch (e) {
      console.warn('Could not clear API URL:', e);
    }
  }

  /**
   * Get current API URL
   */
  getApiUrl(): string | null {
    return this.apiUrl;
  }

  /**
   * Set API URL and save it
   */
  setApiUrl(url: string): void {
    // Validate URL format
    if (!url.startsWith('https://script.google.com/')) {
      throw new Error('Invalid API URL. Must be a Google Apps Script web app URL.');
    }
    
    this.apiUrl = url;
    this.saveUrl(url);
    this.updateConnectionInfo({ apiUrl: url, state: 'disconnected', error: null });
  }

  /**
   * Check if API URL is configured
   */
  isConfigured(): boolean {
    return this.apiUrl !== null && this.apiUrl.length > 0;
  }

  /**
   * Get current connection info
   */
  getConnectionInfo(): ConnectionInfo {
    return { ...this.connectionInfo };
  }

  /**
   * Subscribe to connection info changes
   */
  subscribe(listener: (info: ConnectionInfo) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  /**
   * Update connection info and notify listeners
   */
  private updateConnectionInfo(updates: Partial<ConnectionInfo>): void {
    this.connectionInfo = { ...this.connectionInfo, ...updates };
    this.listeners.forEach(listener => listener(this.connectionInfo));
  }

  /**
   * Make a GET request to the API
   */
  private async get<T>(action: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
    if (!this.apiUrl) {
      return { success: false, error: 'API URL not configured', code: 0 };
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return { success: false, error: message, code: 0 };
    }
  }

  /**
   * Make a POST request to the API
   */
  private async post<T>(action: string, body: Record<string, any> = {}): Promise<ApiResponse<T>> {
    if (!this.apiUrl) {
      return { success: false, error: 'API URL not configured', code: 0 };
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set('action', action);

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return { success: false, error: message, code: 0 };
    }
  }

  // ==================== Setup Endpoints ====================

  /**
   * Check backend status
   */
  async checkStatus(): Promise<StatusResponse> {
    this.updateConnectionInfo({ state: 'connecting' });

    const result = await this.get<StatusResponse>('status');
    
    if (!result.success && result.code === 0) {
      // Network error
      this.updateConnectionInfo({ 
        state: 'error', 
        error: result.error || 'Connection failed',
        lastCheck: new Date()
      });
      return { success: false, configured: false, needsSetup: true, error: result.error };
    }

    // Handle the response
    const statusResult = result as unknown as StatusResponse;
    
    if (statusResult.needsSetup) {
      this.updateConnectionInfo({ 
        state: 'needs_setup', 
        error: null,
        lastCheck: new Date()
      });
    } else if (statusResult.configured) {
      this.updateConnectionInfo({ 
        state: 'connected', 
        error: null,
        lastCheck: new Date(),
        spreadsheetName: statusResult.spreadsheetName,
        schemaVersion: statusResult.schemaVersion
      });
    } else {
      this.updateConnectionInfo({ 
        state: 'error', 
        error: statusResult.error || 'Unknown error',
        lastCheck: new Date()
      });
    }

    return statusResult;
  }

  /**
   * Create a new backend
   */
  async createBackend(name?: string): Promise<CreateResponse> {
    const body: Record<string, any> = {};
    if (name) body.name = name;

    const result = await this.post<CreateResponse>('create', body);
    
    if (result.success) {
      // Re-check status after creation
      await this.checkStatus();
    }

    return result as unknown as CreateResponse;
  }

  /**
   * Attach an existing backend
   */
  async attachBackend(sheetId: string): Promise<AttachResponse> {
    const result = await this.post<AttachResponse>('attach', { sheetId });
    
    if (result.success) {
      // Re-check status after attachment
      await this.checkStatus();
    }

    return result as unknown as AttachResponse;
  }

  /**
   * Clear backend configuration
   */
  async clearConfig(): Promise<ApiResponse> {
    const result = await this.post('clearConfig');
    
    if (result.success) {
      await this.checkStatus();
    }

    return result;
  }

  // ==================== Data Endpoints (Story 3+) ====================

  /**
   * Get all maps (placeholder for Story 3)
   */
  async getMaps(): Promise<ApiResponse<LearningMap[]>> {
    return this.get<LearningMap[]>('getMaps');
  }

  /**
   * Save a map (placeholder for Story 3)
   */
  async saveMap(map: LearningMap): Promise<ApiResponse<LearningMap>> {
    return this.post<LearningMap>('saveMap', map);
  }

  /**
   * Update student progress (placeholder for Story 4)
   */
  async updateProgress(mapId: string, hexId: string, status: HexProgress): Promise<ApiResponse> {
    return this.post('updateProgress', { mapId, hexId, status });
  }
}

// Export singleton instance
export const apiService = new ApiService();