import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 1100,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // IPC handlers for data persistence
  const dataFilePath = join(app.getPath('userData'), 'app-data.json')

  // Default data structure
  const defaultData = {
    categories: {
      DIRECT: {
        label: 'KOSZTY BEZPOŚREDNIE',
        groups: {
          WYNAGRODZENIA: [
            { id: '1.1', label: 'WYNAGRODZENIA ETATOWE' },
            { id: '1.2', label: 'WYNAGRODZENIA DODATKOWE' },
            { id: '1.3', label: 'STYPENDIA' }
          ],
          APARATURA: [{ id: '2', label: 'APARATURA' }],
          INNE: [
            { id: '3.1', label: 'LAPTOPY DLA ZESPOŁU' },
            { id: '3.2', label: 'Moviesens Software' },
            { id: '3.3', label: 'PAVLOVIA PLATFORM LICENCE' },
            { id: '3.4', label: 'FIRMA REKRUTACYJNA (USŁUGI OBCE)' },
            { id: '3.5', label: 'DYSK ZEWNĘTRZNY' },
            { id: '3.6', label: 'KONFERENCJE' },
            { id: '3.7', label: 'PROGRAMING EXP. (USŁUGI OBCE)' },
            { id: '3.8', label: 'WYKONAWCY ZBIOROWI' },
            { id: '3.9', label: 'MATERIAŁY BIUROWE' }
          ]
        }
      },
      INDIRECT: {
        label: 'KOSZTY POŚREDNIE',
        items: [
          { id: 'P1', label: 'Koszty OA' },
          { id: 'P2', label: 'Koszty 15% kierownika' },
          { id: 'P3', label: 'Koszty pośrednie IP' }
        ]
      }
    },
    lastProjectName: '',
    projectNames: []
  }

  ipcMain.handle('save-data', async (_, data) => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Error saving data:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('load-data', async () => {
    try {
      if (fs.existsSync(dataFilePath)) {
        const data = fs.readFileSync(dataFilePath, 'utf-8')
        return JSON.parse(data)
      }
      return defaultData
    } catch (error) {
      console.error('Error loading data:', error)
      return defaultData
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
