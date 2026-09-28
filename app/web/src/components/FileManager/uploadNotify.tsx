import { Progress, notification } from 'antd'
import { uploadFiles } from '../../api/client'
import { getApiErrorMessage } from '../../utils/errors'

/** Upload one file with a sticky progress notification. */
export async function uploadFileWithProgress(dirPath: string, file: File): Promise<void> {
  const key = `upload-${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const showProgress = (percent: number) => {
    notification.open({
      key,
      message: `Uploading ${file.name}`,
      description: <Progress percent={percent} size="small" status="active" />,
      duration: 0,
      placement: 'bottomRight',
    })
  }

  showProgress(0)
  try {
    await uploadFiles(dirPath, [file], {
      onUploadProgress: showProgress,
    })
    notification.success({
      key,
      message: `${file.name} uploaded`,
      duration: 2,
      placement: 'bottomRight',
    })
  } catch (e: unknown) {
    notification.error({
      key,
      message: `Failed to upload ${file.name}`,
      description: getApiErrorMessage(e),
      duration: 4,
      placement: 'bottomRight',
    })
    throw e
  }
}

/** Upload files sequentially with per-file progress notifications. Continues after failures. */
export async function uploadFilesWithProgress(dirPath: string, files: File[]): Promise<void> {
  for (const file of files) {
    try {
      await uploadFileWithProgress(dirPath, file)
    } catch {
      /* notified; continue remaining files */
    }
  }
}
