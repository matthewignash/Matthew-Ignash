
/**
 * User Authentication Context
 * 
 * Provides user info and role throughout the app.
 * Handles the logic of what features to show based on role.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiService } from '../services/api';
import { getStorageMode, subscribeToModeChanges } from '../services/storage';

// ============================================================
// TYPES
// ============================================================

export interface UserInfo {
  email: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export interface AuthState {
  // User info
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  
  // Connection state
  isConnected: boolean;
  isLocalMode: boolean;
  
  // Computed permissions
  canEdit: boolean;        // Can use builder mode, edit hexes
  canCreate: boolean;      // Can create new maps
  canDelete: boolean;      // Can delete maps
  canAssign: boolean;      // Can assign maps to students/classes
  canViewAllMaps: boolean; // Can see all maps (not just assigned)
  canManageUsers: boolean; // Can add/remove users (admin only)
  
  // Actions
  refreshUser: () => Promise<void>;
  logout: () => void;
}

// ============================================================
// DEFAULT STATE
// ============================================================

const defaultAuthState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isConnected: false,
  isLocalMode: true,
  canEdit: false,
  canCreate: false,
  canDelete: false,
  canAssign: false,
  canViewAllMaps: false,
  canManageUsers: false,
  refreshUser: async () => {},
  logout: () => {}
};

// ============================================================
// CONTEXT
// ============================================================

const AuthContext = createContext<AuthState>(defaultAuthState);

// ============================================================
// PROVIDER
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(true);

  // Fetch user info from backend
  const refreshUser = useCallback(async () => {
    const mode = getStorageMode();
    const isMock = mode === 'mock';
    setIsLocalMode(isMock);
    
    if (isMock || !apiService.isConfigured()) {
      // Local mode - use mock teacher
      setUser({
        email: 'local@demo.mode',
        name: 'Demo User',
        role: 'teacher',
        isAdmin: true,
        isTeacher: true,
        isStudent: false
      });
      setIsConnected(false);
      setLoading(false);
      return;
    }

    // API mode - fetch real user
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.whoAmI();
      
      if (response.success && response.user) {
        const u = response.user as any;
        setUser({
          email: u.email,
          name: u.name || u.email.split('@')[0],
          role: (u.role as any) || 'student',
          isAdmin: u.isAdmin || u.role === 'admin',
          isTeacher: u.isTeacher || u.role === 'teacher' || u.role === 'admin',
          isStudent: u.isStudent || u.role === 'student'
        });
        setIsConnected(true);
        setError(null);
      } else {
        setUser(null);
        setIsConnected(false);
        setError(response.error || 'Failed to authenticate');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setUser(null);
      setIsConnected(false);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout / disconnect
  const logout = useCallback(() => {
    apiService.clearSavedUrl();
    setUser(null);
    setIsConnected(false);
    setIsLocalMode(true);
    // Reset to demo mode
    setUser({
      email: 'local@demo.mode',
      name: 'Demo User',
      role: 'teacher',
      isAdmin: true,
      isTeacher: true,
      isStudent: false
    });
  }, []);

  // Subscribe to mode changes
  useEffect(() => {
    const unsubscribe = subscribeToModeChanges((newMode) => {
      if (newMode === 'api') {
        refreshUser();
      } else {
        // Switched to local mode
        setIsLocalMode(true);
        setIsConnected(false);
        setUser({
          email: 'local@demo.mode',
          name: 'Demo User',
          role: 'teacher',
          isAdmin: true,
          isTeacher: true,
          isStudent: false
        });
      }
    });

    return () => unsubscribe();
  }, [refreshUser]);

  // Initial load
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Compute permissions based on user role
  const canEdit = !!(user?.isTeacher || user?.isAdmin || isLocalMode);
  const canCreate = !!(user?.isTeacher || user?.isAdmin || isLocalMode);
  const canDelete = !!(user?.isTeacher || user?.isAdmin || isLocalMode);
  const canAssign = !!(user?.isTeacher || user?.isAdmin || isLocalMode);
  const canViewAllMaps = !!(user?.isTeacher || user?.isAdmin || isLocalMode);
  const canManageUsers = !!(user?.isAdmin || isLocalMode);

  const value: AuthState = {
    user,
    loading,
    error,
    isConnected,
    isLocalMode,
    canEdit,
    canCreate,
    canDelete,
    canAssign,
    canViewAllMaps,
    canManageUsers,
    refreshUser,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// HOOK
// ============================================================

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================
// PERMISSION GUARD COMPONENT
// ============================================================

interface RequireRoleProps {
  role: 'admin' | 'teacher' | 'student';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Only renders children if user has required role
 * 
 * Usage:
 * <RequireRole role="teacher">
 *   <BuilderModeToggle />
 * </RequireRole>
 */
export const RequireRole: React.FC<RequireRoleProps> = ({ role, children, fallback = null }) => {
  const { user, isLocalMode } = useAuth();
  
  // Local mode = full access for testing
  if (isLocalMode) {
    return <>{children}</>;
  }
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  // Check role hierarchy: admin > teacher > student
  const roleHierarchy = { admin: 3, teacher: 2, student: 1 };
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[role] || 0;
  
  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

/**
 * Only renders children if user can edit (teacher or admin)
 */
export const RequireEditor: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ children, fallback = null }) => {
  const { canEdit } = useAuth();
  return canEdit ? <>{children}</> : <>{fallback}</>;
};

/**
 * Only renders children if user is admin
 */
export const RequireAdmin: React.FC<{ children: ReactNode; fallback?: ReactNode }> = ({ children, fallback = null }) => {
  const { canManageUsers } = useAuth();
  return canManageUsers ? <>{children}</> : <>{fallback}</>;
};

export default AuthContext;