import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_ROOT = path.join(__dirname, '../../media');

export const saveFile = async (file: File, folder: string = 'vehicule'): Promise<string> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const extension = file.type.split('/')[1] || 'jpg';
    const filename = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    const relativePath = path.join(folder, filename);
    const fullPath = path.join(MEDIA_ROOT, relativePath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);
    return `/media/${folder.replace(/\\/g, '/')}/${filename}`;
  } catch (error) {
    console.error("❌ Error saving file:", error);
    throw error;
  }
};

export const saveImage = (base64Data: string, folder: string = 'profil'): string => {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      if (base64Data.startsWith('/media/') || base64Data.startsWith('http')) return base64Data;
      return base64Data;
    }

    const type = matches[1] || 'image/jpeg';
    const buffer = Buffer.from(matches[2] || '', 'base64');
    
    let extension = 'jpg';
    if (type.includes('png')) extension = 'png';
    else if (type.includes('jpeg') || type.includes('jpg')) extension = 'jpg';
    
    const filename = `img-${Date.now()}-${Math.floor(Math.random() * 1000)}.${extension}`;
    const relativePath = path.join(folder, filename);
    const fullPath = path.join(MEDIA_ROOT, relativePath);

    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);
    return `/media/${folder.replace(/\\/g, '/')}/${filename}`;
  } catch (error) {
    console.error("❌ Error saving image:", error);
    return base64Data;
  }
};