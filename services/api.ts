/**
 * API Service - Communicates with Google Apps Script Backend
 * 
 * Handles all HTTP requests to the deployed web app.
 * Provides typed methods for each endpoint.
 */

import { LearningMap, HexProgress, Course, Unit, ClassGroup, HexTemplate, CurriculumConfig, User } from '../types';

// API Response Types
export interface ApiResponse {
  success: boolean;
  error?: string;
  code?: number;
  _timing?: string;
  // Response data fields
  maps?: LearningMap[];
  map?: LearningMap;
  courses?: Course[];
  units?: Unit[];
  classes?: ClassGroup[];
  templates?: HexTemplate[];
  curriculum?: CurriculumConfig;
  user?: User;
  progress?: Record<string, any>;
  [key: string]: any;
}

export interface StatusResponse extends ApiResponse {
  configured: boolean;
  needsSetup: boolean;
  needsMigration?: boolean;
  schemaVersion?: number;
  currentVersion?: number;
  requiredVersion?: number;
  spreadsheetId?: string;
  spreadsheetName?: string;
  message?: string;
}

export interface CreateResponse extends ApiResponse {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  schemaVersion?: number;
}

export interface AttachResponse extends ApiResponse {
  spreadsheetId?: string;
  spreadsheetName?: string;
  schemaVersion?: number;
  needsMigration?: boolean;
  currentVersion?: number;
  requiredVersion?: number;
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
  private async get<T extends ApiResponse = ApiResponse>(action: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    if (!this.apiUrl) {
      return { success: false, error: 'API URL not configured', code: 0 } as T;
    }

    const url = new URL(this.apiUrl);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      return data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return { success: false, error: message, code: 0 } as T;
    }
  }

  /**
   * Make a POST request to the API
   */
  private async post<T extends ApiResponse = ApiResponse>(action: string, body: Record<string, any> = {}): Promise<T> {
    if (!this.apiUrl) {
      return { success: false, error: 'API URL not configured', code: 0 } as T;
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
      return data as T;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      return { success: false, error: message, code: 0 } as T;
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
    const statusResult = result;
    
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
      await this.checkStatus();
    }

    return result;
  }

  /**
   * Attach an existing backend
   */
  async attachBackend(sheetId: string): Promise<AttachResponse> {
    const result = await this.post<AttachResponse>('attach', { sheetId });
    
    if (result.success) {
      await this.checkStatus();
    }

    return result;
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

  // ==================== Data Endpoints ====================

  async getMaps(): Promise<ApiResponse> {
    return this.get('getMaps');
  }

  async getMap(mapId: string): Promise<ApiResponse> {
    return this.get('getMap', { mapId });
  }

  async saveMap(map: LearningMap): Promise<ApiResponse> {
    return this.post('saveMap', map);
  }

  async duplicateMap(sourceId: string, newTitle: string): Promise<ApiResponse> {
    return this.post('duplicateMap', { sourceId, newTitle });
  }

  async saveProgress(mapId: string, hexId: string, status: HexProgress, score?: number): Promise<ApiResponse> {
    return this.post('updateProgress', { mapId, hexId, status, score });
  }

  async getProgress(mapId: string): Promise<ApiResponse> {
    return this.get('getStudentProgress', { mapId });
  }

  async getCourses(): Promise<ApiResponse> {
    return this.get('getCourses');
  }

  async getUnits(): Promise<ApiResponse> {
    return this.get('getUnits');
  }

  async getClasses(): Promise<ApiResponse> {
    return this.get('getClasses');
  }

  async getTemplates(): Promise<ApiResponse> {
    return this.get('getHexTemplates');
  }

  async getCurriculum(): Promise<ApiResponse> {
    return this.get('getCurriculumConfig');
  }

  async whoAmI(): Promise<ApiResponse> {
    return this.get('getCurrentUser');
  }

  async assignMapToClass(mapId: string, classId: string): Promise<ApiResponse> {
    return this.post('assignMap', { mapId, classId });
  }

  async assignMapToStudents(mapId: string, emails: string[]): Promise<ApiResponse> {
    return this.post('assignMap', { mapId, emails });
  }
}

// Export singleton instance
export const apiService = new ApiService();