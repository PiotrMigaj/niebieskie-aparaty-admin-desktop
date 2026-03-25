export interface Event {
  event_id: string;
  date: string;
  username: string;
  title: string;
}

export interface FileEntry {
  path: string;
  name: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export interface Selection {
  selection_id: string;
  blocked: boolean;
  event_id: string;
  event_title: string;
  username: string;
}

export interface MoveResult {
  message: string;
  movedFiles: string[];
  count: number;
}
