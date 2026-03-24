interface Props {
  src: string
  name: string
}

export default function PdfPreview({ src, name }: Props) {
  return (
    <div style={{ height: '100%', minHeight: '70vh' }}>
      <iframe
        src={src}
        title={name}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  )
}
