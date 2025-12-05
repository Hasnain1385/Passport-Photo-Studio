const { contextBridge } = require('electron');

// Securely expose APIs to the renderer process if needed
contextBridge.exposeInMainWorld('electron', {
  // Add any specific Electron features here in the future
});

window.addEventListener('DOMContentLoaded', () => {
    // DOM content loaded
});