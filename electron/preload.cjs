const { contextBridge, ipcRenderer } = require('electron');

// Expose safe desktop API to renderer window
contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  maximize: () => ipcRenderer.invoke('app:maximize'),
  close: () => ipcRenderer.invoke('app:close'),
  print: (options) => ipcRenderer.invoke('app:print', options)
});
