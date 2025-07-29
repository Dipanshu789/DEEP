// This file exports the base64 string of the deep.png logo for embedding in email templates.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Read the image and export as base64 string, fallback to empty string if not found
let logoBase64 = '';
try {
  const logoPath = path.join(__dirname, '../deep.png');
  logoBase64 = fs.readFileSync(logoPath).toString('base64');
  console.log('[logoBase64] First 100 chars:', logoBase64.slice(0, 100));
} catch (e) {
  console.warn('[logoBase64] deep.png not found or failed to load:', (e as Error)?.message || e);
}

export default logoBase64;
