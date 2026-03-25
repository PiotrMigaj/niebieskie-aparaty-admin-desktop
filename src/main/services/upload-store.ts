export interface UploadedData {
  fileName: string;
  compressedFileName: string;
  eventId: string;
  username: string;
  originalFileObjectKey: string;
  originalFilePresignedUrl: string;
  compressedFileObjectKey: string;
  compressedFilePresignedUrl: string;
  compressedFileWidth: string;
  compressedFileHeight: string;
  presignDateTime: string;
}

const store = new Map<string, UploadedData[]>();

export function saveUploadedData(data: UploadedData): void {
  const list = store.get(data.eventId) ?? [];
  list.push(data);
  store.set(data.eventId, list);
}

export function getByEventId(eventId: string): UploadedData[] {
  return store.get(eventId) ?? [];
}

export function deleteByEventId(eventId: string): void {
  if (!store.has(eventId)) {
    throw new Error(`No upload data found for eventId: ${eventId}`);
  }
  store.delete(eventId);
}
