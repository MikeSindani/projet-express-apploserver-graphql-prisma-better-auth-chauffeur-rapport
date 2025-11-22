import fs from 'fs';
import type { FileUpload } from 'graphql-upload';
import path from 'path';



 const savePhoto = async (file: FileUpload,pathPhoto: string): Promise<string> => {
  const { createReadStream, filename } = await file;
  const uniqueName = `${Date.now()}-${filename}`;
  const uploadPath = path.join(__dirname, `../uploads/${pathPhoto}`, uniqueName);

  await new Promise((resolve, reject) => {
    createReadStream()
      .pipe(fs.createWriteStream(uploadPath))
      .on('finish', resolve)
      .on('error', reject);
  });

  return `/uploads/${pathPhoto}/${uniqueName}`;
};

export default savePhoto;