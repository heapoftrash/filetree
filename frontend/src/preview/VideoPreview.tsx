interface Props {
  src: string
  name: string
}

export default function VideoPreview({ src }: Props) {
  return (
    <div style={{ textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        src={src}
        controls
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  )
}
