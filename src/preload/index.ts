import { contextBridge, ipcRenderer } from 'electron';

export interface ProgressData {
  filePath: string;
  progress: number;
}

export interface ElectronAPI {
  getEvents: () => Promise<unknown[]>;
  selectFiles: () => Promise<string[]>;
  selectDirectory: () => Promise<string | null>;
  uploadFile: (filePath: string, eventId: string, username: string) => Promise<{ success: boolean }>;
  completeUpload: (eventId: string, imagesAmount: number) => Promise<string>;
  onUploadProgress: (callback: (data: ProgressData) => void) => void;
  removeUploadProgressListener: () => void;
  getSelections: () => Promise<unknown[]>;
  processSelection: (selectionId: string, directoryPath: string) => Promise<{ message: string; movedFiles: string[]; count: number }>;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getEvents: () =>
    ipcRenderer.invoke('events:getAll'),

  selectFiles: () =>
    ipcRenderer.invoke('dialog:selectFiles'),

  uploadFile: (filePath: string, eventId: string, username: string) =>
    ipcRenderer.invoke('upload:file', { filePath, eventId, username }),

  completeUpload: (eventId: string, imagesAmount: number) =>
    ipcRenderer.invoke('upload:complete', { eventId, imagesAmount }),

  onUploadProgress: (callback: (data: ProgressData) => void) => {
    ipcRenderer.on('upload:progress', (_event, data: ProgressData) => callback(data));
  },

  removeUploadProgressListener: () => {
    ipcRenderer.removeAllListeners('upload:progress');
  },

  selectDirectory: () =>
    ipcRenderer.invoke('dialog:selectDirectory'),

  getSelections: () =>
    ipcRenderer.invoke('selections:getAll'),

  processSelection: (selectionId: string, directoryPath: string) =>
    ipcRenderer.invoke('selections:process', { selectionId, directoryPath }),
} satisfies ElectronAPI);
