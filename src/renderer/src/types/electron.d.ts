// Typy dla Electron API dostępnego w rendererze

export interface AppData {
  categories: {
    DIRECT: {
      label: string
      groups: {
        [key: string]: Array<{ id: string; label: string }>
      }
    }
    INDIRECT: {
      label: string
      groups: {
        [key: string]: Array<{ id: string; label: string }>
      }
    }
  }
  lastProjectName?: string
  projectNames?: string[]
}

export interface ElectronAPI {
  platform: string
  saveData: (data: AppData) => Promise<{ success: boolean; error?: string }>
  loadData: () => Promise<AppData | null>
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
