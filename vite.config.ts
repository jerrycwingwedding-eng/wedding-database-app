import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {google} from 'googleapis';

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

type JsonBody = Record<string, unknown>;
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

function sendJson(res: any, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: any): Promise<JsonBody> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function resolveServiceAccountPath(env: Record<string, string>) {
  const customPath = String(env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '');
  if (customPath && customPath.trim()) {
    return path.resolve(__dirname, customPath);
  }
  return path.resolve(__dirname, 'wedding-sheet-db-fa09f2fdbec3.json');
}

function getSheetsClient(env: Record<string, string>) {
  const keyPath = resolveServiceAccountPath(env);
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Service account key file not found: ${keyPath}`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: GOOGLE_SHEETS_SCOPE,
  });
  return google.sheets({version: 'v4', auth});
}

function getSirvConfig(env: Record<string, string>) {
  const clientId = String(env.SIRV_CLIENT_ID || process.env.SIRV_CLIENT_ID || '').trim();
  const clientSecret = String(env.SIRV_CLIENT_SECRET || process.env.SIRV_CLIENT_SECRET || '').trim();
  const cdnHostRaw = String(env.SIRV_CDN_HOST || process.env.SIRV_CDN_HOST || '').trim();
  const defaultFolder = String(env.SIRV_FOLDER || process.env.SIRV_FOLDER || 'wedding-vendors').trim();

  if (!clientId || !clientSecret) {
    throw new Error('Sirv env is incomplete. Set SIRV_CLIENT_ID and SIRV_CLIENT_SECRET.');
  }
  if (!cdnHostRaw) {
    throw new Error('Sirv CDN host is missing. Set SIRV_CDN_HOST, for example your-account.sirv.com');
  }

  const cdnHost = cdnHostRaw.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return {clientId, clientSecret, cdnHost, defaultFolder};
}

async function getSirvAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const response = await fetch('https://api.sirv.com/v2/token', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      clientId,
      clientSecret,
    }),
  });
  const json = await response.json();
  if (!response.ok || !json?.token) {
    throw new Error(json?.message || 'Failed to get Sirv access token.');
  }
  return String(json.token);
}

function parseDataUrl(dataUrl: string): {mimeType: string; buffer: Buffer} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image payload format.');
  }
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  return {mimeType, buffer};
}

function extFromMime(mimeType: string): string {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'bin';
}

function toVendorRows(vendors: any[]) {
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

export default defineConfig(({mode}) => {
  const loadedEnv = loadEnv(mode, process.cwd(), '');
  const serverEnv = {...(process.env as Record<string, string>), ...loadedEnv};

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'google-sheets-bridge',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url || !req.method) return next();
            const method = req.method.toUpperCase();
            const endpoint = req.url.split('?')[0];
            if (method !== 'POST') return next();
            if (
              endpoint !== '/api/google-sheets/test' &&
              endpoint !== '/api/google-sheets/vendors/fetch' &&
              endpoint !== '/api/google-sheets/vendors/sync' &&
              endpoint !== '/api/sirv/upload-image'
            ) {
              return next();
            }

            try {
              if (endpoint === '/api/sirv/upload-image') {
                const body = await readJsonBody(req);
                const customFolder = String(body.folder || '').trim();
                const dataUrl = String(body.dataUrl || '').trim();
                const fileNameRaw = String(body.fileName || 'vendor-image').trim();
                const {clientId, clientSecret, cdnHost, defaultFolder} = getSirvConfig(serverEnv);
                const uploadFolder = (customFolder || defaultFolder).replace(/^\/+|\/+$/g, '');

                if (!dataUrl) {
                  return sendJson(res, 400, {
                    success: false,
                    message: 'Image data payload is required.',
                  });
                }

                const {mimeType, buffer} = parseDataUrl(dataUrl);
                const finalMimeType = mimeType || 'application/octet-stream';
                if (!finalMimeType.startsWith('image/')) {
                  return sendJson(res, 400, {
                    success: false,
                    message: 'Only image uploads are allowed.',
                  });
                }
                if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
                  return sendJson(res, 400, {
                    success: false,
                    message: 'Image exceeds 8MB limit.',
                  });
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
                return sendJson(res, 200, {
                  success: true,
                  imageUrl: publicUrl,
                });
              }

              const body = await readJsonBody(req);
              const spreadsheetId = String(body.spreadsheetId || '').trim();
              const sheetName = String(body.sheetName || '').trim();
              if (!spreadsheetId || !sheetName) {
                return sendJson(res, 400, {
                  success: false,
                  message: 'spreadsheetId and sheetName are required.',
                });
              }

              const sheets = getSheetsClient(serverEnv);
              const headerRange = `${sheetName}!A1:O1`;
              const fullRange = `${sheetName}!A:O`;

              if (endpoint === '/api/google-sheets/test') {
                await sheets.spreadsheets.values.get({
                  spreadsheetId,
                  range: headerRange,
                });
                return sendJson(res, 200, {success: true, message: 'Connected to Google Sheets successfully.'});
              }

              if (endpoint === '/api/google-sheets/vendors/fetch') {
                const result = await sheets.spreadsheets.values.get({
                  spreadsheetId,
                  range: fullRange,
                });
                const values = result.data.values || [];
                const [, ...rows] = values;
                return sendJson(res, 200, {success: true, rows});
              }

              const vendors = Array.isArray(body.vendors) ? body.vendors : [];
              const vendorRows = toVendorRows(vendors);

              await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: headerRange,
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

              return sendJson(res, 200, {
                success: true,
                message: `Synced ${vendorRows.length} vendor rows to Google Sheets.`,
              });
            } catch (error: any) {
              return sendJson(res, 500, {
                success: false,
                message: error?.message || 'Google Sheets API error',
              });
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
