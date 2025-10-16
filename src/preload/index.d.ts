import { ElectronAPI } from '@electron-toolkit/preload'

interface AppData {
  categories: {
    DIRECT: {
      label: string
      groups: {
        [key: string]: Array<{ id: string; label: string }>
      }
    }
    INDIRECT: {
      label: string
      items: Array<{ id: string; label: string }>
    }
  }
  lastProjectName?: string
  projectNames?: string[]
}

interface CustomElectronAPI {
  platform: string
  saveData: (data: AppData) => Promise<{ success: boolean; error?: string }>
  loadData: () => Promise<AppData | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    electronAPI: CustomElectronAPI
  }
}
