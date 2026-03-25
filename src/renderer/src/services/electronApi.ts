import type { Event, Selection, MoveResult } from '../types';

declare global {
  interface Window {
    electronAPI: {
      getEvents: () => Promise<Event[]>;
      selectFiles: () => Promise<string[]>;
      selectDirectory: () => Promise<string | null>;
      uploadFile: (filePath: string, eventId: string, username: string) => Promise<{ success: boolean }>;
      completeUpload: (eventId: string, imagesAmount: number) => Promise<string>;
      onUploadProgress: (callback: (data: { filePath: string; progress: number }) => void) => void;
      removeUploadProgressListener: () => void;
      getSelections: () => Promise<Selection[]>;
      processSelection: (selectionId: string, directoryPath: string) => Promise<MoveResult>;
    };
  }
}

export const electronApi = {
  getEvents: () => window.electronAPI.getEvents(),
  selectFiles: () => window.electronAPI.selectFiles(),
  selectDirectory: () => window.electronAPI.selectDirectory(),
  uploadFile: (filePath: string, eventId: string, username: string) =>
    window.electronAPI.uploadFile(filePath, eventId, username),
  completeUpload: (eventId: string, imagesAmount: number) =>
    window.electronAPI.completeUpload(eventId, imagesAmount),
  onUploadProgress: (callback: (data: { filePath: string; progress: number }) => void) =>
    window.electronAPI.onUploadProgress(callback),
  removeUploadProgressListener: () => window.electronAPI.removeUploadProgressListener(),
  getSelections: () => window.electronAPI.getSelections(),
  processSelection: (selectionId: string, directoryPath: string) =>
    window.electronAPI.processSelection(selectionId, directoryPath),
};
