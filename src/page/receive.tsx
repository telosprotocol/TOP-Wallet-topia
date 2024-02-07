import Button from '../components/Button'
import Nav from '../components/Nav'
import { useStore } from '../store'
import styles from '../styles/receive.module.scss'
import { copyToClipboard } from '../lib'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import FormatMessage from '../store/FormatMessage'
import { useSearchParams } from 'react-router-dom'

function Receive() {
  const [copyText, setCopyText] = useState('CopyAddress')

  const [receiveAddress, setReceiveAddress] = useState('')

  let [searchParams] = useSearchParams()

  const { accountStore } = useStore()

  const canvasRef = useRef<any>()

  function handleCopyClick() {
    copyToClipboard(receiveAddress)
    setCopyText('Copied')
    setTimeout(() => {
      setCopyText('CopyAddress')
    }, 1000)
  }

  useEffect(() => {
    const address = searchParams.get('address')
    if (address) {
      setReceiveAddress(address)
    } else {
      setReceiveAddress(accountStore.currentAccount.address)
    }
  }, [searchParams, accountStore.currentAccount.address])

  useEffect(() => {
    if (canvasRef.current && receiveAddress) {
      QRCode.toCanvas(canvasRef.current, receiveAddress, {
        width: 195,
        // height: 195,
      })
    }
  }, [canvasRef, receiveAddress])

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="Receive"></FormatMessage>
        </Nav>
        <div className={styles.content}>
          <div>
            <canvas height={160} width={160} ref={canvasRef}></canvas>
          </div>
          <div className={styles.receiveAddress}>
            <div className={styles.t1}>
              <FormatMessage id="ReceiveAddress"></FormatMessage>
            </div>
            <div className={styles.t2}>{receiveAddress}</div>
          </div>
        </div>
        <div className={styles.btns}>
          <Button onClick={handleCopyClick}>
            <FormatMessage id={copyText}></FormatMessage>
          </Button>
        </div>
      </main>
    </>
  )
}

export default Receive
