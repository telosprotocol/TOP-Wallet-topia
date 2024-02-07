import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from '../styles/ImportOldWallet.module.scss'
import Input from '../components/Input'
import { useEffect, useState } from 'react'
import Button from '../components/Button'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { createAccount } from '../lib/appPort'
import { IChainType } from '../types'
import { ERROR_INCORRECT_PASSWORD } from '../app/errorCode'
import { track } from '../lib/track'

function CreateOldWallet() {
  let navigate = useNavigate()

  const [name, setName] = useState('')
  const [pass, setPass] = useState('')

  const [nameError, setNameError] = useState('')
  const [passError, setPassError] = useState('')

  const [loading, setLoading] = useState(false)

  const [searchParams] = useSearchParams()
  const selectChainType = searchParams.get('selectChainType') as IChainType

  useEffect(() => {
    setNameError('')
  }, [name])

  useEffect(() => {
    setPassError('')
  }, [pass])

  async function handleNext() {
    let hasError = false
    if (name.length > 20) {
      hasError = true
      setNameError(getLocaleMessage('PleaseEnterTheWalletName'))
    }
    if (pass.length < 6 || pass.length > 16) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPassword'))
    }
    if (hasError) {
      return
    }
    setLoading(true)
    try {
      await createAccount({
        pass,
        name,
        selectChainType,
      })
      navigate('/')
      track({ event: 'create' })
    } catch (error: any) {
      setLoading(false)
      if (error.errorCode === ERROR_INCORRECT_PASSWORD.errorCode) {
        setPassError(getLocaleMessage('IncorrectPassword'))
      }
    }
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="CreateWallet1"></FormatMessage>
        </Nav>
        <div className={styles.InitWallet}>
          <div className={styles.tip1}>
            <FormatMessage id="TheNewAccountWillBeBasedOn"></FormatMessage>
          </div>
          <div className={styles.formwrap}>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="WalletName"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  placeholder={getLocaleMessage('PleaseEnter120Characters')}
                ></Input>
              </div>
              <div className={styles.error}>{nameError}</div>
            </div>
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
          <div className={styles.btns + ' ' + styles.createOldbtns}>
            <div>
              <Button onClick={handleNext} type="primary" loading={loading}>
                <FormatMessage id="Create"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button onClick={() => navigate(-1)} type="default">
                <FormatMessage id="Cancel"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default CreateOldWallet
