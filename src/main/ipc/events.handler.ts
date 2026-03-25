import { ipcMain } from 'electron';
import { getAllEvents } from '../services/dynamo-events.service';

export function registerEventsHandlers(): void {
  ipcMain.handle('events:getAll', async () => {
    return await getAllEvents();
  });
}
