import { useState, useEffect } from 'react';

interface Settings {
  currency: string;
  fxRate: string;
  notaryFees: number;
  anthropicModel: string;
  anthropicKey: string;
  gmapsKey: string;
  promptImmo: string;
  promptPE: string;
}

const defaultSettings: Settings = {
  currency: 'EUR',
  fxRate: '',
  notaryFees: 8.00,
  anthropicModel: '',
  anthropicKey: '',
  gmapsKey: '',
  promptImmo: '',
  promptPE: ''
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('familyOfficeSettings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (error) {
          console.error('Error parsing settings:', error);
          setSettings(defaultSettings);
        }
      }
    };

    loadSettings();

    // Écouter les changements du localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'familyOfficeSettings') {
        loadSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Écouter les changements dans la même fenêtre
    const handleCustomEvent = () => {
      loadSettings();
    };

    window.addEventListener('settingsUpdated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleCustomEvent);
    };
  }, []);

  return settings;
}