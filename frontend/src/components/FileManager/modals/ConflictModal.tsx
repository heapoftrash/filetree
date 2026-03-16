import { Modal, Button } from 'antd'

interface ConflictModalProps {
  open: boolean
  onOverwrite: () => void
  onKeepBoth: () => void
  onCancel: () => void
}

export default function ConflictModal({
  open,
  onOverwrite,
  onKeepBoth,
  onCancel,
}: ConflictModalProps) {
  return (
    <Modal
      title="File already exists"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="keep" onClick={onKeepBoth}>
          Keep both
        </Button>,
        <Button key="overwrite" type="primary" danger onClick={onOverwrite}>
          Overwrite
        </Button>,
      ]}
    >
      <p>A file or folder with this name already exists. Overwrite or keep both?</p>
    </Modal>
  )
}
