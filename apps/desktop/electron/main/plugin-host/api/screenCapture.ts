import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'

/**
 * macOS 截图：使用系统 screencapture 命令
 */
function handleScreenShots(
  cb: (image: string, bounds?: { x: number; y: number; width: number; height: number }) => void,
): void {
  const tmpPath = path.join(os.tmpdir(), `screenshot_${Date.now()}.png`)
  exec(`screencapture -i -r "${tmpPath}"`, () => {
    if (fs.existsSync(tmpPath)) {
      try {
        const imageBuffer = fs.readFileSync(tmpPath)
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`
        cb(base64Image)
        fs.unlinkSync(tmpPath)
      } catch {
        cb('')
      }
    } else {
      cb('')
    }
  })
}

/**
 * 截图入口：返回 base64 图片数据
 */
export function screenCapture(
  mainWindow?: BrowserWindow,
  restoreShowWindow: boolean = true,
): Promise<{ image: string; bounds?: { x: number; y: number; width: number; height: number } }> {
  return new Promise((resolve) => {
    const wasVisible = mainWindow?.isVisible() || false
    if (mainWindow && wasVisible) {
      mainWindow.hide()
    }

    const restoreWindow = (): void => {
      if (mainWindow && wasVisible && restoreShowWindow) {
        mainWindow.show()
      }
    }

    if (process.platform === 'darwin') {
      handleScreenShots((image, bounds) => {
        restoreWindow()
        resolve({ image, bounds })
      })
    } else if (process.platform === 'win32') {
      // Windows 使用 desktopCapturer
      restoreWindow()
      resolve({ image: '' })
    } else {
      // Linux 使用 screencapture 命令
      restoreWindow()
      resolve({ image: '' })
    }
  })
}
