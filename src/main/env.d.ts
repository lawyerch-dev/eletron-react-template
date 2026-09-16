/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VSCODE_DEBUG?: 'true'
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬ out
     * │ ├─┬ electron
     * │ │ ├─┬ main
     * │ │ │ └── main.js     > Electron-Main
     * │ │ └─┬ preload
     * │ │   └── index.mjs   > Preload-Scripts
     * │ └─┬ renderer
     * │   └── src/renderer/index.html  > Electron-Renderer
     * ```
     */
    APP_ROOT: string
    /** /out/renderer/ or /src/renderer/public/ */
    VITE_PUBLIC: string
  }
}
