import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_ROOT = path.join(__dirname, '../../media');
const PROFILE_IMAGES_DIR = 'image/profil';

export const saveImage = (base64Data: string): string => {
  try {
    // Check if it matches data URI scheme
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      // If it's already a URL (e.g. from update), return as is
      if (base64Data.startsWith('/media/')) return base64Data;
      
      console.warn("Invalid base64 string, saving as is");
      return base64Data;
    }

    const type = matches[1] || 'image/jpeg';
    const buffer = Buffer.from(matches[2] || '', 'base64');
    
    // Determine extension
    let extension = 'jpg';
    if (type.includes('png')) extension = 'png';
    else if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
    
    const filename = `profile-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    const relativePath = path.join(PROFILE_IMAGES_DIR, filename);
    const fullPath = path.join(MEDIA_ROOT, relativePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);
    console.log(`✅ Image saved to ${fullPath}`);
    
    // Return relative URL for frontend
    return `/media/${PROFILE_IMAGES_DIR.replace(/\\/g, '/')}/${filename}`;
  } catch (error) {
    console.error("❌ Error saving image:", error);
    return base64Data; // Fallback
  }
};