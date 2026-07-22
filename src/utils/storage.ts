import { Vendor, WeddingSettings } from '../types';
import { INITIAL_VENDORS, INITIAL_WEDDING_SETTINGS } from '../data/initialVendors';

const STORAGE_KEYS = {
  VENDORS: 'wedding_planner_vendors_v1',
  SETTINGS: 'wedding_planner_settings_v1',
};

export function loadStoredVendors(): Vendor[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VENDORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load vendors from localStorage:', err);
  }
  return INITIAL_VENDORS;
}

export function saveStoredVendors(vendors: Vendor[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  } catch (err) {
    console.error('Failed to save vendors to localStorage:', err);
  }
}

export function loadStoredSettings(): WeddingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...INITIAL_WEDDING_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load settings from localStorage:', err);
  }
  return INITIAL_WEDDING_SETTINGS;
}

export function saveStoredSettings(settings: WeddingSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function exportDataAsJSON(vendors: Vendor[], settings: WeddingSettings): void {
  const exportPayload = {
    app: 'Wedding Vendor Planner',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings,
    vendors,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const fileName = `wedding-vendor-plan-${settings.coupleNames.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function resetToInitialData(): { vendors: Vendor[]; settings: WeddingSettings } {
  localStorage.removeItem(STORAGE_KEYS.VENDORS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  return {
    vendors: INITIAL_VENDORS,
    settings: INITIAL_WEDDING_SETTINGS,
  };
}
