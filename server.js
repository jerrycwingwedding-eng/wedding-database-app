import fs from 'fs';
import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import {google} from 'googleapis';
import {fileURLToPath} from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GOOGLE_SHEETS_SCOPE = ['https://www.googleapis.com/auth/spreadsheets'];
const VENDOR_HEADERS = [
  'id',
  'name',
  'category',
  'cost',
  'pricingModel',
  'guestCountMultiplier',
  'serviceDetails',
  'image',
  'contact',
  'rating',
  'isSelected',
  'status',
  'notes',
  'tags',
  'createdAt',
];
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function resolveServiceAccountPath() {
  const customPath = String(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '').trim();
  if (customPath) {
    return path.resolve(__dirname, customPath);
  }
  return path.resolve(__dirname, 'wedding-sheet-db-fa09f2fdbec3.json');
}

function getSheetsClient() {
  const jsonCredentials = String(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '').trim();
  let auth;

  if (jsonCredentials) {
    let parsed;
    try {
      parsed = JSON.parse(jsonCredentials);
    } catch {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.');
    }
    auth = new google.auth.GoogleAuth({
      credentials: parsed,
      scopes: GOOGLE_SHEETS_SCOPE,
    });
  } else {
    const keyPath = resolveServiceAccountPath();
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Service account key file not found: ${keyPath}`);
    }
    auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: GOOGLE_SHEETS_SCOPE,
    });
  }

  return google.sheets({version: 'v4', auth});
}

function getSirvConfig() {
  const clientId = String(process.env.SIRV_CLIENT_ID || '').trim();
  const clientSecret = String(process.env.SIRV_CLIENT_SECRET || '').trim();
  const cdnHostRaw = String(process.env.SIRV_CDN_HOST || '').trim();
  const defaultFolder = String(process.env.SIRV_FOLDER || 'wedding-vendors').trim();

  if (!clientId || !clientSecret) {
    throw new Error('Sirv env is incomplete. Set SIRV_CLIENT_ID and SIRV_CLIENT_SECRET.');
  }
  if (!cdnHostRaw) {
    throw new Error('Sirv CDN host is missing. Set SIRV_CDN_HOST, for example your-account.sirv.com');
  }

  const cdnHost = cdnHostRaw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return {clientId, clientSecret, cdnHost, defaultFolder};
}

async function getSirvAccessToken(clientId, clientSecret) {
  const response = await fetch('https://api.sirv.com/v2/token', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({clientId, clientSecret}),
  });
  const json = await response.json();
  if (!response.ok || !json?.token) {
    throw new Error(json?.message || 'Failed to get Sirv access token.');
  }
  return String(json.token);
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image payload format.');
  }
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return {mimeType, buffer};
}

function extFromMime(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'bin';
}

function toVendorRows(vendors) {
  return vendors.map((vendor) => [
    vendor.id || '',
    vendor.name || '',
    vendor.category || '',
    String(vendor.cost ?? 0),
    vendor.pricingModel || 'fixed',
    vendor.guestCountMultiplier === undefined || vendor.guestCountMultiplier === null
      ? ''
      : String(vendor.guestCountMultiplier),
    vendor.serviceDetails || '',
    vendor.image || '',
    JSON.stringify(vendor.contact || {}),
    String(vendor.rating ?? 5),
    String(Boolean(vendor.isSelected)),
    vendor.status || 'considering',
    vendor.notes || '',
    JSON.stringify(vendor.tags || []),
    String(vendor.createdAt ?? Date.now()),
  ]);
}

const app = express();
app.use(express.json({limit: '12mb'}));

app.get('/api/health', (_req, res) => {
  res.json({ok: true});
});

app.post('/api/sirv/upload-image', async (req, res) => {
  try {
    const body = req.body || {};
    const customFolder = String(body.folder || '').trim();
    const dataUrl = String(body.dataUrl || '').trim();
    const fileNameRaw = String(body.fileName || 'vendor-image').trim();
    const {clientId, clientSecret, cdnHost, defaultFolder} = getSirvConfig();
    const uploadFolder = (customFolder || defaultFolder).replace(/^\/+|\/+$/g, '');

    if (!dataUrl) {
      return res.status(400).json({success: false, message: 'Image data payload is required.'});
    }

    const {mimeType, buffer} = parseDataUrl(dataUrl);
    const finalMimeType = mimeType || 'application/octet-stream';
    if (!finalMimeType.startsWith('image/')) {
      return res.status(400).json({success: false, message: 'Only image uploads are allowed.'});
    }
    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return res.status(400).json({success: false, message: 'Image exceeds 8MB limit.'});
    }

    const token = await getSirvAccessToken(clientId, clientSecret);
    const ext = extFromMime(finalMimeType);
    const safeBase = fileNameRaw.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `/${uploadFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeBase}.${ext}`;

    const uploadResponse = await fetch(
      `https://api.sirv.com/v2/files/upload?filename=${encodeURIComponent(filePath)}`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': finalMimeType,
        },
        body: buffer,
      }
    );

    const uploadText = await uploadResponse.text();
    if (!uploadResponse.ok) {
      throw new Error(uploadText || 'Sirv upload failed.');
    }

    const publicUrl = `https://${cdnHost}${filePath}`;
    return res.json({success: true, imageUrl: publicUrl});
  } catch (error) {
    return res.status(500).json({success: false, message: error?.message || 'Sirv upload failed'});
  }
});

app.post('/api/google-sheets/test', async (req, res) => {
  try {
    const spreadsheetId = String(req.body?.spreadsheetId || '').trim();
    const sheetName = String(req.body?.sheetName || '').trim();
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({success: false, message: 'spreadsheetId and sheetName are required.'});
    }
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A1:O1`,
    });
    return res.json({success: true, message: 'Connected to Google Sheets successfully.'});
  } catch (error) {
    return res.status(500).json({success: false, message: error?.message || 'Google Sheets API error'});
  }
});

app.post('/api/google-sheets/vendors/fetch', async (req, res) => {
  try {
    const spreadsheetId = String(req.body?.spreadsheetId || '').trim();
    const sheetName = String(req.body?.sheetName || '').trim();
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({success: false, message: 'spreadsheetId and sheetName are required.'});
    }
    const sheets = getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:O`,
    });
    const values = result.data.values || [];
    const [, ...rows] = values;
    return res.json({success: true, rows});
  } catch (error) {
    return res.status(500).json({success: false, message: error?.message || 'Google Sheets API error'});
  }
});

app.post('/api/google-sheets/vendors/sync', async (req, res) => {
  try {
    const spreadsheetId = String(req.body?.spreadsheetId || '').trim();
    const sheetName = String(req.body?.sheetName || '').trim();
    const vendors = Array.isArray(req.body?.vendors) ? req.body.vendors : [];
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({success: false, message: 'spreadsheetId and sheetName are required.'});
    }

    const sheets = getSheetsClient();
    const vendorRows = toVendorRows(vendors);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:O1`,
      valueInputOption: 'RAW',
      requestBody: {values: [VENDOR_HEADERS]},
    });

    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetName}!A2:O5000`,
      requestBody: {},
    });

    if (vendorRows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A2:O${vendorRows.length + 1}`,
        valueInputOption: 'RAW',
        requestBody: {values: vendorRows},
      });
    }

    return res.json({
      success: true,
      message: `Synced ${vendorRows.length} vendor rows to Google Sheets.`,
    });
  } catch (error) {
    return res.status(500).json({success: false, message: error?.message || 'Google Sheets API error'});
  }
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

const port = Number(process.env.PORT || 3000);
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
