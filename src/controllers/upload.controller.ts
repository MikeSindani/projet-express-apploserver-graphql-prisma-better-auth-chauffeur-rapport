import log from "@/lib/log";

export const UploadController = {
    uploadFile: async (file: File,folder:string,organizationId:string) => {
        log("🔵 uploadFile mutation called");

        const filename = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uniqueFilename = `${Date.now()}-${filename}`;
        const path = require('path');
        const fs = require('fs');

        const uploadDir = path.join(process.cwd(), 'media', 'image', folder, organizationId);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, uniqueFilename);
        fs.writeFileSync(filePath, buffer);

        log(`✅ File saved to: ${filePath}`);
        return `/media/image/${folder}/${organizationId}/${uniqueFilename}`;
    }
}