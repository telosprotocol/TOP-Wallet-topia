import Nav from '../components/Nav'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/ImportOldWallet.module.scss'
import Input from '../components/Input'
import { useEffect, useState } from 'react'
import Button from '../components/Button'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { appPortlogin } from '../lib/appPort'

import { useWordList } from '../hooks/useWordList'
import { copyToClipboard } from '../lib'

function MnemonicPhrases() {
  const [copyText, setCopyText] = useState('Copy')

  let navigate = useNavigate()
  const wordsList = useWordList()

  const [showWords, setShowWords] = useState(false)

  const [pass, setPass] = useState('')

  const [passError, setPassError] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setPassError('')
  }, [pass])

  async function handleNext() {
    let hasError = false
    if (pass.length < 6 || pass.length > 16) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPassword'))
    }
    if (hasError) {
      return
    }
    setLoading(true)
    try {
      const res = await appPortlogin(pass)
      setLoading(false)
      if (!res) {
        setPassError(getLocaleMessage('IncorrectPassword'))
      } else {
        setShowWords(true)
      }
    } catch (error) {
      setLoading(false)
    }
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="MnemonicPhrases"></FormatMessage>
        </Nav>
        <div className={styles.InitWallet}>
          <div className={styles.tip1 + ' ' + styles.errorColor}>
            <FormatMessage id="DontShowThisAccountMnemonicToAnyone"></FormatMessage>
            <FormatMessage id="ThisAccountMnemonicCanBe"></FormatMessage>
          </div>
          {showWords ? (
            <>
              <div className={styles.mccontainer}>
                {wordsList.map((item, index) => {
                  return <div key={item + index}>{item}</div>
                })}
              </div>
              <div className={styles.btns}>
                <div>
                  <Button
                    onClick={() => {
                      copyToClipboard(wordsList.join(' '))
                      setCopyText('Copied')
                      setTimeout(() => {
                        setCopyText('Copy')
                      }, 1000)
                    }}
                    type="primary"
                    loading={loading}
                  >
                    <FormatMessage id={copyText}></FormatMessage>
                  </Button>
                </div>
                <div>
                  <Button
                    onClick={() => navigate(-1)}
                    type="default"
                    loading={loading}
                  >
                    <FormatMessage id="Close"></FormatMessage>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.formwrap}>
                <div className={styles.formitem}>
                  <div className={styles.label}>
                    <FormatMessage id="Password1"></FormatMessage>
                  </div>
                  <div className={styles.inputWrap}>
                    <Input
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      type={'password'}
                      placeholder={getLocaleMessage('PleaseEnterPassword')}
                      onKeyPress={(e) => {
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
                    <FormatMessage id="OK"></FormatMessage>
                  </Button>
                </div>
                <div>
                  <Button
                    onClick={() => navigate(-1)}
                    type="default"
                    loading={loading}
                  >
                    <FormatMessage id="Cancel"></FormatMessage>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default MnemonicPhrases
