const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 650,
    title: 'شامل لإدارة مراكز وفروع التجميل والعناية ERP',
    backgroundColor: '#f8fafc',
    icon: path.join(__dirname, 'public', 'vite.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'electron', 'preload.cjs')
    }
  });

  // Remove default menu for a clean modern desktop look
  Menu.setApplicationMenu(null);

  // In development, load dev server; in production, load dist/index.html
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC communication bridges
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('app:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle('app:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.handle('app:close', () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.handle('app:print', async (event, options = {}) => {
  if (!mainWindow) return false;
  return new Promise((resolve) => {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      ...options
    }, (success, failureReason) => {
      resolve({ success, failureReason });
    });
  });
});
