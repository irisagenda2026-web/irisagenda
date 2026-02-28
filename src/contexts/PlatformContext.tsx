import React, { createContext, useContext, useState, useEffect } from 'react';
import { getPlatformSettings } from '../services/db';
import { PlatformSettings } from '../types/firebase';

interface PlatformContextType {
  settings: PlatformSettings;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: PlatformSettings = {
  platformName: 'Iris Agenda',
  logoUrl: '',
  faviconUrl: ''
};

const PlatformContext = createContext<PlatformContextType>({ 
  settings: defaultSettings, 
  refreshSettings: async () => {} 
});

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);

  const refreshSettings = async () => {
    try {
      const data = await getPlatformSettings();
      if (data) {
        const newSettings = { ...defaultSettings, ...data };
        setSettings(newSettings);
        
        // Update Favicon
        if (newSettings.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = newSettings.faviconUrl;
        }
        
        // Update Title
        if (newSettings.platformName) {
          document.title = newSettings.platformName;
        }
      }
    } catch (error) {
      console.error("Error loading platform settings:", error);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <PlatformContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </PlatformContext.Provider>
  );
}

export const usePlatform = () => useContext(PlatformContext);
