import { useEffect, useState } from 'react'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import styles from '../styles/InitWallet.module.scss'
import Button from './Button'
import Input from './Input'
import checkboxS from '../assets/images/checkbox_s.svg'
import checkbox from '../assets/images/checkbox.svg'
import { openNewTab } from '../lib/appPort'
import { toast } from 'react-toastify'

function InitWallet({ onCancel, onNext, cancelText, loading = false }) {
  const [name, setName] = useState('')
  const [pass, setPass] = useState('')
  const [pass1, setPass1] = useState('')

  const [nameError, setNameError] = useState('')
  const [passError, setPassError] = useState('')
  const [pass1Error, setPass1Error] = useState('')

  const [isCheck, setIsCheck] = useState(false)

  useEffect(() => {
    setNameError('')
  }, [name])

  useEffect(() => {
    setPassError('')
  }, [pass])

  useEffect(() => {
    setPass1Error('')
  }, [pass, pass1])

  function handleNextClick() {
    let hasError = false
    if (!isCheck) {
      // "IHaveRead": { "message": "I have read and agree to the " },
      // "TermOfUse": { "message": "Term of Use" }

      toast(getLocaleMessage('PleaseAgreeTermOfUse'))
      return
    }
    if (name.length > 20) {
      hasError = true
      setNameError(getLocaleMessage('PleaseEnterTheWalletName'))
    }
    // 8~16 characters.
    if (pass.length < 8 || pass.length > 16) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPasswordErr'))
    }
    // At least one upper case character.
    if (pass.match(/^[^A-Z]+$/)) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPasswordErr'))
    }
    // At least one digit.
    if (pass.match(/^[^\d]+$/)) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPasswordErr'))
    }
    // At least one symbol.
    if (pass.match(/^[0-9a-zA-Z]+$/)) {
      hasError = true
      setPassError(getLocaleMessage('PleaseEnterA616DigitPasswordErr'))
    }
    if (pass !== pass1) {
      hasError = true
      setPass1Error(getLocaleMessage('TheTwoPasswordsDoNotMatch'))
    }
    if (hasError) {
      return
    }
    onNext({
      name,
      pass,
    })
  }

  return (
    <div className={styles.InitWallet}>
      <div className={styles.formwrap}>
        <div className={styles.formitem}>
          <div className={styles.label}>
            <FormatMessage id="WalletName"></FormatMessage>
          </div>
          <div className={styles.inputWrap}>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              onChange={(e) => setPass(e.target.value)}
              type={'password'}
              placeholder={getLocaleMessage('PleaseEnterA616DigitPassword')}
            ></Input>
          </div>
          <div className={styles.error}>{passError}</div>
        </div>
        <div className={styles.formitem}>
          <div className={styles.label}>
            <FormatMessage id="RepeatPassword1"></FormatMessage>
          </div>
          <div className={styles.inputWrap}>
            <Input
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
              type={'password'}
              placeholder={getLocaleMessage('RepeatPassword')}
              onKeyPress={(e) => {
                if (e.code.toLowerCase() === 'enter') {
                  handleNextClick()
                }
              }}
            ></Input>
          </div>
          <div className={styles.error}>{pass1Error}</div>
        </div>
        <div className={styles.formitem + ' ' + styles.tou}>
          <img
            onClick={() => setIsCheck((c) => !c)}
            src={isCheck ? checkboxS : checkbox}
            alt="checkbox"
          />
          <FormatMessage id="IHaveRead"></FormatMessage>
          <span
            onClick={() =>
              openNewTab('https://www.topiawallet.io/Terms_of_Use.html')
            }
          >
            <FormatMessage id="TermOfUse"></FormatMessage>
          </span>
        </div>
      </div>
      <div className={styles.btns}>
        <div>
          <Button onClick={handleNextClick} type="primary" loading={loading}>
            <FormatMessage id="Next"></FormatMessage>
          </Button>
        </div>
        <div>
          <Button onClick={onCancel} type="default">
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default InitWallet
