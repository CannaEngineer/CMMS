import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

export type ViewType = 'card' | 'table' | 'list' | 'kanban' | 'tree';

export interface ViewPreference {
  desktop: ViewType;
  mobile: ViewType;
}

export interface ViewState {
  currentView: ViewType;
  preferences: Record<string, ViewPreference>;
  isLoading: boolean;
}

export interface ViewContextType {
  // Current view state
  currentView: ViewType;
  
  // Set view for current component
  setView: (view: ViewType) => void;
  
  // Get saved preference for a component
  getPreference: (componentKey: string) => ViewPreference | null;
  
  // Save preference for a component
  savePreference: (componentKey: string, preference: ViewPreference) => void;
  
  // Check if device is mobile
  isMobile: boolean;
  
  // Check if reduced motion is preferred
  prefersReducedMotion: boolean;
  
  // Reset all preferences
  resetPreferences: () => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

const STORAGE_KEY = 'cmms_view_preferences';
const CURRENT_VIEW_KEY = 'cmms_current_view';

const defaultPreferences: Record<string, ViewPreference> = {
  assets: { desktop: 'card', mobile: 'card' },
  workOrders: { desktop: 'table', mobile: 'card' },
  parts: { desktop: 'table', mobile: 'list' },
  locations: { desktop: 'tree', mobile: 'list' },
  pm: { desktop: 'table', mobile: 'card' },
};

interface ViewProviderProps {
  children: ReactNode;
  componentKey?: string;
  defaultView?: ViewType;
  availableViews?: ViewType[];
}

export const ViewProvider: React.FC<ViewProviderProps> = ({
  children,
  componentKey = 'default',
  defaultView = 'card',
  availableViews = ['card', 'table'],
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  const [state, setState] = useState<ViewState>({
    currentView: defaultView,
    preferences: defaultPreferences,
    isLoading: true,
  });

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(STORAGE_KEY);
      const savedCurrentView = localStorage.getItem(`${CURRENT_VIEW_KEY}_${componentKey}`);
      
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setState(prev => ({
          ...prev,
          preferences: { ...defaultPreferences, ...parsed },
          isLoading: false,
        }));
      }
      
      if (savedCurrentView && availableViews.includes(savedCurrentView as ViewType)) {
        setState(prev => ({
          ...prev,
          currentView: savedCurrentView as ViewType,
          isLoading: false,
        }));
      } else {
        // Auto-select appropriate view based on device and preferences
        const componentPreference = state.preferences[componentKey];
        if (componentPreference) {
          const autoView = isMobile ? componentPreference.mobile : componentPreference.desktop;
          if (availableViews.includes(autoView)) {
            setState(prev => ({
              ...prev,
              currentView: autoView,
              isLoading: false,
            }));
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load view preferences:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [componentKey, isMobile, availableViews]);

  // Save preferences when they change
  const savePreferences = (preferences: Record<string, ViewPreference>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save view preferences:', error);
    }
  };

  const setView = (view: ViewType) => {
    setState(prev => ({ ...prev, currentView: view }));
    
    // Save current view
    try {
      localStorage.setItem(`${CURRENT_VIEW_KEY}_${componentKey}`, view);
    } catch (error) {
      console.warn('Failed to save current view:', error);
    }
  };

  const getPreference = (key: string): ViewPreference | null => {
    return state.preferences[key] || null;
  };

  const savePreference = (key: string, preference: ViewPreference) => {
    const newPreferences = { ...state.preferences, [key]: preference };
    setState(prev => ({ ...prev, preferences: newPreferences }));
    savePreferences(newPreferences);
  };

  const resetPreferences = () => {
    setState(prev => ({ ...prev, preferences: defaultPreferences }));
    savePreferences(defaultPreferences);
    
    // Clear all stored current views
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CURRENT_VIEW_KEY)) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset preferences:', error);
    }
  };

  // Auto-adjust view when screen size changes
  useEffect(() => {
    const componentPreference = state.preferences[componentKey];
    if (componentPreference && !state.isLoading) {
      const preferredView = isMobile ? componentPreference.mobile : componentPreference.desktop;
      if (availableViews.includes(preferredView) && state.currentView !== preferredView) {
        setView(preferredView);
      }
    }
  }, [isMobile, componentKey, state.preferences, state.isLoading, availableViews]);

  const contextValue: ViewContextType = {
    currentView: state.currentView,
    setView,
    getPreference,
    savePreference,
    isMobile,
    prefersReducedMotion,
    resetPreferences,
  };

  return (
    <ViewContext.Provider value={contextValue}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error('useView must be used within a ViewProvider');
  }
  return context;
};

// Hook for component-specific view management
export const useComponentView = (
  componentKey: string,
  defaultDesktopView: ViewType = 'table',
  defaultMobileView: ViewType = 'card'
) => {
  const { getPreference, savePreference, isMobile } = useView();
  
  const preference = getPreference(componentKey) || {
    desktop: defaultDesktopView,
    mobile: defaultMobileView,
  };
  
  const updatePreference = (desktop?: ViewType, mobile?: ViewType) => {
    savePreference(componentKey, {
      desktop: desktop || preference.desktop,
      mobile: mobile || preference.mobile,
    });
  };
  
  return {
    preference,
    updatePreference,
    recommendedView: isMobile ? preference.mobile : preference.desktop,
  };
};