interface Props {
  src: string
  name: string
}

export default function AudioPreview({ src }: Props) {
  return (
    <div style={{ padding: 24 }}>
      <audio src={src} controls style={{ width: '100%' }}>
        Your browser does not support the audio tag.
      </audio>
    </div>
  )
}
