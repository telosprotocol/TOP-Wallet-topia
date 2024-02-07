import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from '../styles/ImportOldWallet.module.scss'
import Input from '../components/Input'
import { useEffect, useState } from 'react'
import Button from '../components/Button'
import { Select } from '../components/Select'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { appPortImportOldWallet } from '../lib/appPort'
import {
  ERROR_INCORRECT_MNEMONIC_FORMAT,
  ERROR_INCORRECT_PASSWORD,
  ERROR_INCORRECT_PRIVATEKEY_FORMAT,
  ERROR_MNEMONIC_EXIST,
  ERROR_PRIVATEKEY_EXIST,
} from '../app/errorCode'
import { IChainType, IImportType } from '../types'
import { track } from '../lib/track'

function ImportOldWallet() {
  let navigate = useNavigate()

  const [mnemonic, setMnemonic] = useState('')
  const [pass, setPass] = useState('')

  const [passError, setPassError] = useState('')
  const [mnemonicError, setMnemonicError] = useState('')

  const [loading, setLoading] = useState(false)

  const [importType, setImportType] = useState<IImportType>(1)

  const [searchParams] = useSearchParams()
  const selectChainType = searchParams.get('selectChainType') as IChainType

  const [topAddressType, setTopAddressType] = useState('T8')

  useEffect(() => {
    setPassError('')
  }, [pass])

  useEffect(() => {
    setMnemonicError('')
  }, [mnemonic, importType])

  async function handleNext() {
    let hasError = false
    if (pass.length < 6 || pass.length > 16) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPassword'))
    }
    if (importType === 1 && !mnemonic.match(/^[a-fA-F\d]{64}$/)) {
      hasError = true
      setMnemonicError(getLocaleMessage('IncorrectPrivateKey'))
    }
    if (importType === 2 && mnemonic.split(' ').length !== 12) {
      hasError = true
      setMnemonicError(getLocaleMessage('IncorrectMnemonicPhrases'))
    }
    if (hasError) {
      return
    }
    setLoading(true)
    try {
      await appPortImportOldWallet({
        topAddressType,
        pass,
        name: '',
        mnemonic: mnemonic ? mnemonic : '123',
        importType,
        selectChainType,
      })
      navigate('/')
      track({ event: 'create' })
    } catch (error: any) {
      setLoading(false)
      if (error.errorCode === ERROR_INCORRECT_PASSWORD.errorCode) {
        setPassError(getLocaleMessage('IncorrectPassword'))
      } else if (
        error.errorCode === ERROR_INCORRECT_MNEMONIC_FORMAT.errorCode ||
        error.errorCode === ERROR_INCORRECT_PRIVATEKEY_FORMAT.errorCode ||
        error.errorCode === ERROR_MNEMONIC_EXIST.errorCode ||
        error.errorCode === ERROR_PRIVATEKEY_EXIST.errorCode
      ) {
        // setMnemonicError(error.errorMessage)
        setMnemonicError(getLocaleMessage(error.errorMessage))
      }
    }
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="ImportWallet1"></FormatMessage>
        </Nav>
        <div className={styles.InitWallet}>
          <div className={styles.tip1}>
            <FormatMessage id="ImportedAccountsWillNot"></FormatMessage>
          </div>
          <div className={styles.formwrap}>
            <div className={styles.formitem}>
              <div className={`${styles.label} ${styles.labelWithSelect}`}>
                <FormatMessage id="Type"></FormatMessage>:
                <Select
                  value={importType}
                  onChange={setImportType}
                  options={[
                    { label: getLocaleMessage('PrivateKey'), value: 1 },
                    { label: getLocaleMessage('MnemonicPhrases'), value: 2 },
                  ]}
                ></Select>
              </div>
              <div className={`${styles.inputWrap} ${styles.content}`}>
                <textarea
                  value={mnemonic}
                  onChange={(e) => {
                    setMnemonic(e.target.value)
                  }}
                  placeholder={
                    importType === 1
                      ? getLocaleMessage('PleaseEnterYourPrivateKey')
                      : getLocaleMessage('PleaseEnterYour12')
                  }
                ></textarea>
                {/* <span onClick={handlePaste}>
                  <FormatMessage id="Paste"></FormatMessage>
                </span> */}
              </div>
              <div className={styles.error}>{mnemonicError}</div>
            </div>
            {selectChainType === 'TOP' && (
              <div className={styles.formitem}>
                <span
                  onClick={() => setTopAddressType('T8')}
                  className={`${styles.addressItem} ${
                    topAddressType === 'T8' ? styles.addressItemSelect : ''
                  }`}
                >
                  <FormatMessage id="T8Address"></FormatMessage>
                </span>
                <span
                  onClick={() => setTopAddressType('T0')}
                  className={`${styles.addressItem} ${
                    topAddressType === 'T0' ? styles.addressItemSelect : ''
                  }`}
                >
                  <FormatMessage id="T0Address"></FormatMessage>
                </span>
              </div>
            )}
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Password1"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input
                  value={pass}
                  onChange={(e: any) => setPass(e.target.value)}
                  type={'password'}
                  placeholder={getLocaleMessage('PleaseEnterPassword')}
                  onKeyPress={(e: any) => {
                    if (e.code.toLowerCase() === 'enter') {
                      handleNext()
                    }
                  }}
                ></Input>
              </div>
              <div className={styles.error}>{passError}</div>
            </div>
          </div>
          <div className={styles.btns}>
            <div>
              <Button onClick={handleNext} type="primary" loading={loading}>
                <FormatMessage id="Import"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ImportOldWallet
