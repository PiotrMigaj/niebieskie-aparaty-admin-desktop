import { ipcMain, BrowserWindow } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { compressImage } from '../services/image-compressor';
import { uploadOriginalToS3, uploadCompressedToS3 } from '../services/s3-upload.service';
import { saveUploadedData, getByEventId, deleteByEventId } from '../services/upload-store';
import { saveGalleryItem, updateEventWithCamelGallery } from '../services/dynamo-gallery.service';

export function registerUploadHandlers(): void {
  ipcMain.handle(
    'upload:file',
    async (
      event,
      { filePath, eventId, username }: { filePath: string; eventId: string; username: string }
    ) => {
      const sender = event.sender;
      const fileName = path.basename(filePath);

      sender.send('upload:progress', { filePath, progress: 10 });

      const fileBuffer = await fs.readFile(filePath);

      sender.send('upload:progress', { filePath, progress: 25 });

      const [originalResult, compressionResult] = await Promise.all([
        uploadOriginalToS3(fileBuffer, fileName, eventId, username),
        compressImage(fileBuffer, fileName).then(async (compressed) => {
          const s3Result = await uploadCompressedToS3(
            compressed.compressedBuffer,
            compressed.compressedFileName,
            eventId,
            username
          );
          return { ...compressed, ...s3Result };
        }),
      ]);

      sender.send('upload:progress', { filePath, progress: 90 });

      const now = new Date();
      const presignDateTime = now.toISOString().replace('T', 'T').slice(0, 19);

      saveUploadedData({
        fileName,
        compressedFileName: compressionResult.compressedFileName,
        eventId,
        username,
        originalFileObjectKey: originalResult.objectKey,
        originalFilePresignedUrl: originalResult.presignedUrl,
        compressedFileObjectKey: compressionResult.objectKey,
        compressedFilePresignedUrl: compressionResult.presignedUrl,
        compressedFileWidth: String(compressionResult.width),
        compressedFileHeight: String(compressionResult.height),
        presignDateTime,
      });

      sender.send('upload:progress', { filePath, progress: 100 });

      return { success: true };
    }
  );

  ipcMain.handle(
    'upload:complete',
    async (_event, { eventId, imagesAmount }: { eventId: string; imagesAmount: number }) => {
      const uploadedList = getByEventId(eventId);

      if (uploadedList.length !== imagesAmount) {
        throw new Error(
          `Images amount from request (${imagesAmount}) differs from actual uploaded (${uploadedList.length})`
        );
      }

      await Promise.all(uploadedList.map((item) => saveGalleryItem(item)));
      await updateEventWithCamelGallery(eventId);
      deleteByEventId(eventId);

      return 'Upload completed successfully';
    }
  );
}
