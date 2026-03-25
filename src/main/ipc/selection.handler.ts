import { ipcMain } from 'electron';
import { getBlockedSelections, getSelectedImageNames } from '../services/dynamo-selection.service';
import { moveSelectedImages } from '../services/file-move.service';

export function registerSelectionHandlers(): void {
  ipcMain.handle('selections:getAll', async () => {
    return await getBlockedSelections();
  });

  ipcMain.handle(
    'selections:process',
    async (_event, { selectionId, directoryPath }: { selectionId: string; directoryPath: string }) => {
      const imageNames = await getSelectedImageNames(selectionId);
      return await moveSelectedImages(directoryPath.trim(), imageNames);
    }
  );
}
