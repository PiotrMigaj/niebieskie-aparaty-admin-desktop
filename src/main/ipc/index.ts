import { registerEventsHandlers } from './events.handler';
import { registerUploadHandlers } from './upload.handler';
import { registerDialogHandlers } from './dialog.handler';
import { registerSelectionHandlers } from './selection.handler';

export function registerAllIpcHandlers(): void {
  registerEventsHandlers();
  registerUploadHandlers();
  registerDialogHandlers();
  registerSelectionHandlers();
}
