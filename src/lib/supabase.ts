import { Vendor } from '../types';

export interface SupabaseConfig {
  spreadsheetId: string;
  sheetName: string;
  sirvFolder: string;
  autoSync: boolean;
}

const STORAGE_KEY_CONFIG = 'wedding_google_sheets_config_v1';
const DEFAULT_SPREADSHEET_ID = '1IF-15JCvxSF_Uy6kl-f7CgmAG473gkveoLPkMZ54S-I';
const DEFAULT_SHEET_NAME = '工作表1';
const DEFAULT_SIRV_FOLDER = 'wedding-vendors';

export const getSupabaseConfig = (): SupabaseConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        spreadsheetId: parsed.spreadsheetId || parsed.url || DEFAULT_SPREADSHEET_ID,
        sheetName: parsed.sheetName || parsed.anonKey || DEFAULT_SHEET_NAME,
        sirvFolder: parsed.sirvFolder || parsed.cloudinaryFolder || parsed.bucketName || DEFAULT_SIRV_FOLDER,
        autoSync: parsed.autoSync !== false,
      };
    }
  } catch (e) {
    console.error('Error loading Google Sheets config from localStorage', e);
  }

  const env = (import.meta as any).env || {};
  return {
    spreadsheetId: env.VITE_GOOGLE_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
    sheetName: env.VITE_GOOGLE_SHEET_NAME || DEFAULT_SHEET_NAME,
    sirvFolder: env.VITE_SIRV_FOLDER || DEFAULT_SIRV_FOLDER,
    autoSync: true,
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
};

export const uploadVendorImage = async (
  file: File
): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  const config = getSupabaseConfig();
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Failed to read image file.'));
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    });

    const response = await postSheetsApi<{ success: boolean; imageUrl: string }>(
      '/api/sirv/upload-image',
      {
        dataUrl,
        folder: config.sirvFolder,
        fileName: file.name || 'vendor-image',
      }
    );

    return { success: true, imageUrl: response.imageUrl };
  } catch (e: any) {
    return { success: false, error: e.message || 'Image upload failed.' };
  }
};

async function postSheetsApi<T = any>(path: string, payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || 'Google Sheets API request failed');
  }
  return json as T;
}

function mapRowToVendor(row: string[]): Vendor {
  return {
    id: row[0] || `v-${Date.now()}`,
    name: row[1] || 'Unnamed Vendor',
    category: row[2] || 'Other',
    cost: Number(row[3]) || 0,
    pricingModel: (row[4] as Vendor['pricingModel']) || 'fixed',
    guestCountMultiplier: row[5] ? Number(row[5]) : undefined,
    serviceDetails: row[6] || '',
    image: row[7] || '',
    contact: (() => {
      try {
        return row[8] ? JSON.parse(row[8]) : {};
      } catch {
        return {};
      }
    })(),
    rating: Number(row[9]) || 5,
    isSelected: String(row[10]).toLowerCase() === 'true',
    status: (row[11] as Vendor['status']) || 'considering',
    notes: row[12] || '',
    tags: (() => {
      try {
        return row[13] ? JSON.parse(row[13]) : [];
      } catch {
        return [];
      }
    })(),
    createdAt: Number(row[14]) || Date.now(),
  };
}

function mapVendorToPlain(vendor: Vendor) {
  return {
    id: vendor.id,
    name: vendor.name,
    category: vendor.category,
    cost: vendor.cost,
    pricingModel: vendor.pricingModel,
    guestCountMultiplier: vendor.guestCountMultiplier ?? null,
    serviceDetails: vendor.serviceDetails,
    image: vendor.image,
    contact: vendor.contact || {},
    rating: vendor.rating,
    isSelected: vendor.isSelected,
    status: vendor.status,
    notes: vendor.notes || '',
    tags: vendor.tags || [],
    createdAt: vendor.createdAt,
  };
}

export const testSupabaseConnection = async (
  spreadsheetId: string,
  sheetName: string
): Promise<{ success: boolean; message: string }> => {
  if (!spreadsheetId || !sheetName) {
    return { success: false, message: 'Please provide both Spreadsheet ID and Sheet Name.' };
  }
  try {
    const result = await postSheetsApi<{ success: boolean; message: string }>('/api/google-sheets/test', {
      spreadsheetId,
      sheetName,
    });
    return result;
  } catch (e: any) {
    return { success: false, message: e.message || 'Connection failed.' };
  }
};

export const syncVendorsToSupabase = async (
  vendors: Vendor[]
): Promise<{ success: boolean; error?: string }> => {
  const config = getSupabaseConfig();
  if (!config.spreadsheetId || !config.sheetName) {
    return { success: false, error: 'Google Sheets config not set' };
  }
  try {
    await postSheetsApi('/api/google-sheets/vendors/sync', {
      spreadsheetId: config.spreadsheetId,
      sheetName: config.sheetName,
      vendors: vendors.map(mapVendorToPlain),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};

export const fetchVendorsFromSupabase = async (): Promise<{ vendors: Vendor[] | null; error?: string }> => {
  const config = getSupabaseConfig();
  if (!config.spreadsheetId || !config.sheetName) {
    return { vendors: null, error: 'Google Sheets config not set' };
  }
  try {
    const response = await postSheetsApi<{ success: boolean; rows: string[][] }>(
      '/api/google-sheets/vendors/fetch',
      {
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
      }
    );
    const vendors = (response.rows || [])
      .filter((row) => Array.isArray(row) && row.length > 0 && row[0])
      .map((row) => mapRowToVendor(row));
    return { vendors };
  } catch (e: any) {
    return { vendors: null, error: e.message };
  }
};

export const deleteVendorFromSupabase = async (vendorId: string): Promise<boolean> => {
  // Google Sheets mode uses full resync after local delete.
  return Boolean(vendorId);
};

export const SUPABASE_SQL_SCHEMA = `Google Sheets mode does not require SQL.
Configure Spreadsheet ID + Sheet Name + Sirv folder in settings.

Required server env for local dev:
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./wedding-sheet-db-fa09f2fdbec3.json
SIRV_CLIENT_ID=your_sirv_client_id
SIRV_CLIENT_SECRET=your_sirv_client_secret
SIRV_CDN_HOST=your-account.sirv.com
VITE_SIRV_FOLDER=wedding-vendors`;
