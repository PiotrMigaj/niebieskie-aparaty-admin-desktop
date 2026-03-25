import * as fs from 'fs/promises';
import * as path from 'path';

export interface MoveResult {
  message: string;
  movedFiles: string[];
  count: number;
}

export async function moveSelectedImages(
  directoryPath: string,
  imageNames: string[]
): Promise<MoveResult> {
  const targetDir = path.join(directoryPath, 'wybrane');
  await fs.mkdir(targetDir, { recursive: true });

  const movedFiles: string[] = [];

  for (const name of imageNames) {
    const fileName = name.endsWith('.jpg') ? name : `${name}.jpg`;
    const src = path.join(directoryPath, fileName);
    const dest = path.join(targetDir, fileName);

    try {
      await fs.rename(src, dest);
      movedFiles.push(fileName);
    } catch {
      console.warn(`File not found, skipping: ${src}`);
    }
  }

  return {
    message: 'Selection processed successfully',
    movedFiles,
    count: movedFiles.length,
  };
}
