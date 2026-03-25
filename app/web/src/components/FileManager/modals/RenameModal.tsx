import { Modal, Input } from 'antd'

interface RenameModalProps {
  open: boolean
  onOk: () => void
  onCancel: () => void
  name: string
  onNameChange: (value: string) => void
}

export default function RenameModal({
  open,
  onOk,
  onCancel,
  name,
  onNameChange,
}: RenameModalProps) {
  return (
    <Modal title="Rename" open={open} onOk={onOk} onCancel={onCancel} okText="Rename">
      <Input
        placeholder="New name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onPressEnter={onOk}
      />
    </Modal>
  )
}
