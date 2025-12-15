
/**
 * API Service - Connects to Google Apps Script Backend
 * 
 * This service handles all communication with the backend.
 * The API URL is stored in localStorage and persists across sessions.
 */

import { LearningMap, HexProgress, Course, Unit, ClassGroup, HexTemplate, CurriculumConfig, User } from '../types';

// Types
export interface ApiResponse {
  success: boolean;
  error?: string;
  code?: number;
  [key: string]: any;
}

export interface StatusResponse extends ApiResponse {
  configured: boolean;
  needsSetup: boolean;
  schemaVersion?: number;
  spreadsheetId?: string;
  spreadsheetName?: string;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error' | 'needs_setup';

export interface ConnectionInfo {
  state: ConnectionState;
  apiUrl: string | null;
  lastCheck: Date | null;
  error: string | null;
  spreadsheetName?: string;
  schemaVersion?: number;
  userRole?: string;
}

// Storage Keys - THESE MAKE THE CONNECTION PERSIST!
const STORAGE_KEY_API_URL = 'learning_map_api_url';
const STORAGE_KEY_CONNECTION = 'learning_map_connection';

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
    this.loadSavedState();
  }

  private loadSavedState(): void {
    try {
      const savedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
      if (savedUrl) {
        this.apiUrl = savedUrl;
        this.connectionInfo.apiUrl = savedUrl;
      }
      
      const savedConn = localStorage.getItem(STORAGE_KEY_CONNECTION);
      if (savedConn) {
        const parsed = JSON.parse(savedConn);
        this.connectionInfo = {
          ...this.connectionInfo,
          ...parsed,
          lastCheck: parsed.lastCheck ? new Date(parsed.lastCheck) : null
        };
      }
    } catch (e) {
      console.warn('Could not load saved API state:', e);
    }
  }

  private saveState(): void {
    try {
      if (this.apiUrl) {
        localStorage.setItem(STORAGE_KEY_API_URL, this.apiUrl);
      }
      localStorage.setItem(STORAGE_KEY_CONNECTION, JSON.stringify({
        ...this.connectionInfo,
        lastCheck: this.connectionInfo.lastCheck?.toISOString()
      }));
    } catch (e) {
      console.warn('Could not save API state:', e);
    }
  }

  private updateConnectionInfo(updates: Partial<ConnectionInfo>): void {
    this.connectionInfo = { ...this.connectionInfo, ...updates };
    this.listeners.forEach(fn => fn(this.connectionInfo));
    this.saveState();
  }

  getApiUrl(): string | null { return this.apiUrl; }
  
  setApiUrl(url: string): void {
    let cleanUrl = url.trim();
    if (!cleanUrl.includes('script.google.com')) {
      throw new Error('Invalid URL. Must be a Google Apps Script web app URL.');
    }
    this.apiUrl = cleanUrl;
    this.updateConnectionInfo({ apiUrl: cleanUrl, state: 'disconnected', error: null });
    this.saveState();
  }

  clearSavedUrl(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_API_URL);
      localStorage.removeItem(STORAGE_KEY_CONNECTION);
      this.apiUrl = null;
      this.updateConnectionInfo({ state: 'disconnected', apiUrl: null, error: null });
    } catch (e) {}
  }

  isConfigured(): boolean { return this.apiUrl !== null && this.apiUrl.length > 0; }
  getConnectionInfo(): ConnectionInfo { return { ...this.connectionInfo }; }
  subscribe(listener: (info: ConnectionInfo) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async request<T extends ApiResponse = ApiResponse>(action: string, params: Record<string, any> = {}): Promise<T> {
    if (!this.apiUrl) return { success: false, error: 'API URL not configured' } as T;

    try {
      const url = new URL(this.apiUrl);
      url.searchParams.set('action', action);
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });

      console.log('API:', action);
      const response = await fetch(url.toString(), { method: 'GET', redirect: 'follow' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return JSON.parse(await response.text()) as T;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Network error';
      console.error('API Error (' + action + '):', msg);
      return { success: false, error: msg } as T;
    }
  }

  async checkStatus(): Promise<StatusResponse> {
    this.updateConnectionInfo({ state: 'connecting' });
    const result = await this.request<StatusResponse>('status');
    
    if (!result.success && result.error) {
      this.updateConnectionInfo({ state: 'error', error: result.error, lastCheck: new Date() });
      return { success: false, configured: false, needsSetup: true, error: result.error };
    }

    if (result.needsSetup) {
      this.updateConnectionInfo({ state: 'needs_setup', error: null, lastCheck: new Date() });
    } else if (result.configured) {
      this.updateConnectionInfo({ 
        state: 'connected', error: null, lastCheck: new Date(),
        spreadsheetName: result.spreadsheetName, schemaVersion: result.schemaVersion
      });
    }
    return result;
  }

  async createBackend(name?: string): Promise<ApiResponse> {
    const result = await this.request('create', name ? { name } : {});
    if (result.success) await this.checkStatus();
    return result;
  }

  async attachBackend(sheetId: string): Promise<ApiResponse> {
    let cleanId = sheetId.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) cleanId = match[1];
    const result = await this.request('attach', { sheetId: cleanId });
    if (result.success) await this.checkStatus();
    return result;
  }

  async clearConfig(): Promise<ApiResponse> {
    const result = await this.request('clearConfig');
    if (result.success) await this.checkStatus();
    return result;
  }

  async whoAmI(): Promise<ApiResponse> { return this.request('getCurrentUser'); }
  async getMaps(): Promise<ApiResponse> { return this.request('getMaps'); }
  async getMap(mapId: string): Promise<ApiResponse> { return this.request('getMap', { mapId }); }
  async saveMap(map: LearningMap): Promise<ApiResponse> {
    return this.request('saveMap', {
      mapId: map.mapId, title: map.title, courseId: map.courseId, unitId: map.unitId,
      teacherEmail: map.teacherEmail, hexes: map.hexes, ubdData: map.ubdData, meta: map.meta
    });
  }
  async duplicateMap(sourceId: string, newTitle: string): Promise<ApiResponse> { return this.request('duplicateMap', { sourceId, newTitle }); }
  async getCourses(): Promise<ApiResponse> { return this.request('getCourses'); }
  async getUnits(): Promise<ApiResponse> { return this.request('getUnits'); }
  async getClasses(): Promise<ApiResponse> { return this.request('getClasses'); }
  async getTemplates(): Promise<ApiResponse> { return this.request('getHexTemplates'); }
  async getCurriculum(): Promise<ApiResponse> { return this.request('getCurriculumConfig'); }
  async saveProgress(mapId: string, hexId: string, status: HexProgress, score?: number): Promise<ApiResponse> { return this.request('updateProgress', { mapId, hexId, status, score }); }
  async getProgress(mapId: string): Promise<ApiResponse> { return this.request('getStudentProgress', { mapId }); }
  async assignMapToClass(mapId: string, classId: string): Promise<ApiResponse> { return this.request('assignMap', { mapId, classId }); }
  async assignMapToStudents(mapId: string, emails: string[]): Promise<ApiResponse> { return this.request('assignMap', { mapId, emails: emails.join(',') }); }
}

export const apiService = new ApiService();