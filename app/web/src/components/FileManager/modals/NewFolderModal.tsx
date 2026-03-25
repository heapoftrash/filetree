import { Modal, Input } from 'antd'

interface NewFolderModalProps {
  open: boolean
  onOk: () => void
  onCancel: () => void
  name: string
  onNameChange: (value: string) => void
}

export default function NewFolderModal({
  open,
  onOk,
  onCancel,
  name,
  onNameChange,
}: NewFolderModalProps) {
  return (
    <Modal title="New folder" open={open} onOk={onOk} onCancel={onCancel} okText="Create">
      <Input
        placeholder="Folder name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onPressEnter={onOk}
      />
    </Modal>
  )
}
