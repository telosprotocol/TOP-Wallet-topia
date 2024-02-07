import jazzicon from '@metamask/jazzicon'
import { useEffect, useRef } from 'react'
function TokenLogo({ address, width }: { address: string; width: number }) {
  const elRef = useRef<any>()
  useEffect(() => {
    if (address && elRef.current) {
      var el = jazzicon(width, parseInt(address) / 10 ** 40)
      elRef.current?.appendChild(el)
    }
    return () => {
      if (elRef.current) {
      }
    }
  }, [address, elRef, width])
  return (
    <div
      ref={elRef}
      style={{ width: width + 'px', height: width + 'px' }}
    ></div>
  )
}

export default TokenLogo
