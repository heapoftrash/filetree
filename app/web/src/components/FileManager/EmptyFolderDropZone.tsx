import { Button, Upload, theme } from 'antd'
import { InboxOutlined, UploadOutlined } from '@ant-design/icons'

interface EmptyFolderDropZoneProps {
  searchQuery?: string
  onUpload?: (file: File) => boolean | Promise<boolean>
}

export default function EmptyFolderDropZone({ searchQuery, onUpload }: EmptyFolderDropZoneProps) {
  const { token } = theme.useToken()
  if (searchQuery) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center', color: token.colorTextSecondary }}>
        No matching files
      </div>
    )
  }
  return (
    <div
      style={{
        margin: '24px 8px',
        padding: '40px 24px',
        textAlign: 'center',
        borderRadius: 12,
        border: `2px dashed ${token.colorBorder}`,
        background: token.colorFillAlter,
        color: token.colorTextSecondary,
      }}
    >
      <InboxOutlined style={{ fontSize: 40, color: token.colorPrimary, marginBottom: 12 }} />
      <div style={{ fontSize: 15, fontWeight: 600, color: token.colorText, marginBottom: 6 }}>
        Drop files to upload
      </div>
      <div style={{ fontSize: 13, marginBottom: 16 }}>
        This folder is empty. Drag files here or choose files to upload.
      </div>
      {onUpload && (
        <Upload beforeUpload={onUpload} showUploadList={false} multiple>
          <Button icon={<UploadOutlined />}>Choose files</Button>
        </Upload>
      )}
    </div>
  )
}
