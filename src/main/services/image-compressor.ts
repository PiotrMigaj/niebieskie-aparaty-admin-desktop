import * as path from 'path';
import { getConfig } from '../config';

export interface CompressionResult {
  compressedBuffer: Buffer;
  compressedFileName: string;
  width: number;
  height: number;
}

export async function compressImage(
  inputBuffer: Buffer,
  originalFileName: string
): Promise<CompressionResult> {
  const sharp = require('sharp');
  const { compression } = getConfig();

  const metadata = await sharp(inputBuffer).metadata();
  const originalWidth = metadata.width ?? 0;
  const originalHeight = metadata.height ?? 0;

  let newWidth: number;
  let newHeight: number;

  if (originalWidth <= compression.maxWidth) {
    newWidth = originalWidth;
    newHeight = originalHeight;
  } else {
    newWidth = compression.maxWidth;
    newHeight = Math.round((originalHeight * compression.maxWidth) / originalWidth);
  }

  const compressedBuffer: Buffer = await sharp(inputBuffer)
    .resize(newWidth, newHeight)
    .webp({ quality: compression.quality })
    .toBuffer();

  const ext = path.extname(originalFileName);
  const compressedFileName = originalFileName.slice(0, -ext.length) + '.webp';

  return {
    compressedBuffer,
    compressedFileName,
    width: newWidth,
    height: newHeight,
  };
}
