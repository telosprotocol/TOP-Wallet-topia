import Button from '../components/Button'
import Nav from '../components/Nav'
import { createAccount, IcreateAccount, openNewTab, updatePass } from '../lib/appPort'
import { store, useStore } from '../store'
import styles from '../styles/importNewMnemonic.module.scss'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'

function ImportNewMnemonic() {
  let navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [mnemonic, setMnemonic] = useState('')

  const [error, setError] = useState('')

  const { chainStore } = useStore()

  useEffect(() => {
    setError('')
  }, [mnemonic])

  async function handleNextClick() {
    setLoading(true)
    try {
      const res = await createAccount({
        ...store.globalStore._data,
        isBackupMnemonic: true,
        mnemonic: mnemonic ? mnemonic : '123',
        selectChainType: chainStore.chainType,
      } as IcreateAccount)
      if (res) {
        navigate('/')
      } else {
        setLoading(false)
      }
    } catch (error) {
      setLoading(false)
      setError(getLocaleMessage('IncorrectMnemonicPhrases'))
    }
  }

  // async function handlePaste() {
  //   clipboard.readText().then((text) => {
  //     setMnemonic(text)
  //   })
  // }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="ImportWallet1"></FormatMessage>
        </Nav>
        <div className={styles.content}>
          <div className={styles.tab}>
            <div className={styles.i1}>
              <FormatMessage id="MnemonicPhrases"></FormatMessage>
            </div>
            <div
              className={styles.i2}
              onClick={async () => {
                await updatePass(store.globalStore._data.pass || '')
                openNewTab(`/index.html#/connectHardwareWallet`)
              }}
            >
              <FormatMessage id="HardwareWallet"></FormatMessage>
            </div>
          </div>
          <textarea
            value={mnemonic}
            onChange={(e) => {
              setMnemonic(e.target.value)
            }}
            placeholder={getLocaleMessage('PleaseEnterYour12')}
            onKeyPress={(e) => {
              if (e.code.toLowerCase() === 'enter') {
                handleNextClick()
              }
            }}
          ></textarea>
          {/* <span onClick={handlePaste}>
            <FormatMessage id="Paste"></FormatMessage>
          </span> */}
          {error && <div className={styles.error}>{error}</div>}
        </div>
        <div className={styles.btns}>
          <Button loading={loading} onClick={handleNextClick}>
            <FormatMessage id="Next1"></FormatMessage>
          </Button>
        </div>
      </main>
    </>
  )
}

export default ImportNewMnemonic
