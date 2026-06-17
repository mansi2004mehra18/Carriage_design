import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';


// Trigger initialization when the page is completely loaded
document.addEventListener('DOMContentLoaded', () => {
  initEstimatesModule();
});

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { 
      nodeIntegration: true,
      contextIsolation: false // Often required if nodeIntegration is true
    }
  });

  win.loadFile('index.html'); 
}

app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});