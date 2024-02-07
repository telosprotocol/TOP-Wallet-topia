import { renderIcon } from '@download/blockies'
import { useEffect, useRef, useState } from 'react'

const BlockieIdenticon = ({
  address = '',
  diameter,
  alt = '',
  borderRadius = '50%',
}) => {
  const [dataUrl, setDataUrl] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!address) {
      return
    }
    const canvas = canvasRef.current
    renderIcon({ seed: address.toLowerCase() }, canvas)
    const updatedDataUrl = canvas.toDataURL()

    if (updatedDataUrl !== dataUrl) {
      setDataUrl(updatedDataUrl)
    }
  }, [dataUrl, address])

  if (!address) {
    return null
  }

  return (
    <>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <img
        src={dataUrl}
        height={diameter}
        width={diameter}
        style={{
          borderRadius,
        }}
        alt={alt}
      />
    </>
  )
}

export default BlockieIdenticon
