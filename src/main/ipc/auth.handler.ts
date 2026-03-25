import { ipcMain } from 'electron';
import { getConfig } from '../config';

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', (_event, { email, password }: { email: string; password: string }) => {
    const { auth } = getConfig();
    const storedPassword = auth.users.get(email);
    if (!storedPassword || storedPassword !== password) {
      throw new Error('Invalid username or password');
    }
    return email;
  });

  ipcMain.handle('auth:logout', () => {
    // No server-side session; state is managed in renderer
  });
}
