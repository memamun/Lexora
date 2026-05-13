import React, { createContext, useState, useContext, useEffect } from 'react';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const headers = { 'X-App-Id': appParams.appId };
      if (appParams.token) headers['Authorization'] = `Bearer ${appParams.token}`;
      const resp = await fetch(`/api/apps/public/prod/public-settings/by-id/${appParams.appId}`, { headers });

      if (!resp.ok) {
        const contentType = resp.headers.get('content-type');
        const errData = (contentType && contentType.includes('application/json'))
          ? await resp.json().catch(() => ({ body: '' }))
          : { message: `HTTP Error ${resp.status}` };
        const reason = errData?.extra_data?.reason;
        if (reason === 'auth_required' || resp.status === 401) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        } else if (reason === 'user_not_registered') {
          setAuthError({ type: 'user_not_registered', message: 'User not registered for this app' });
        } else {
          setAuthError({ type: reason || 'unknown', message: errData?.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      const contentTypeOk = resp.headers.get('content-type')?.includes('application/json');
      const publicSettings = contentTypeOk ? await resp.json() : {};
      setAppPublicSettings(publicSettings);

      if (appParams.token) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      console.error('App state check failed:', appError);
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await db.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      if (error?.status === 401 || error?.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      db.auth.logout(window.location.href);
    } else {
      db.auth.logout();
    }
  };

  const navigateToLogin = () => {
    db.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings,
      authError, appPublicSettings, authChecked, logout, navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};