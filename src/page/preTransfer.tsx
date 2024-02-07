import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import styles from '../styles/PreTransfer.module.scss'
import { useEffect, useState } from 'react'
import Input from '../components/Input'
import {
  appPortisLogin,
  appPortlogin,
  onAccountChange,
  onChainChange,
} from '../lib/appPort'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import useFormatMessage from '../store/useFormatMessage'
import hide from '../assets/images/hide.svg'
import show from '../assets/images/show.svg'
import Nav from '../components/Nav'
import { useStore } from '../store'

function PreTransfer() {
  const { globalStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()
  const next = searchParams.get('next')
  useEffect(() => {
    if (next) {
      appPortisLogin().then((d) => {
        if (d) {
          globalStore.setTmpData(d as string)
          navigate(next ? decodeURIComponent(next) : '/transfer', {
            replace: true,
          })
        }
      })
    }
  }, [next, navigate, globalStore])

  useEffect(() => {
    function handleChange() {
      navigate('/')
    }
    const clear1 = onAccountChange(handleChange)
    const clear2 = onChainChange(handleChange)
    return () => {
      clear1()
      clear2()
    }
  }, [navigate])

  const [showPass, setShowPass] = useState(false)

  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState('')

  async function handleLoginClick() {
    const res = await appPortlogin(pass)
    if (!res) {
      setPassError(getLocaleMessage({ id: 'IncorrectPassword' }))
      return
    }
    globalStore.setTmpDataWithMd5(pass)
    const next = searchParams.get('next')
    navigate(next ? decodeURIComponent(next) : '/transfer', { replace: true })
  }

  function handleCancelClick() {
    navigate('/')
  }

  const PleaseEnterA616DigitPassword = useFormatMessage({
    id: 'PleaseEnterPassword',
  })

  function handleChangeShowPassClick() {
    setShowPass((p) => !p)
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="Transfer"></FormatMessage>
        </Nav>
        <div className={styles.btns}>
          <p>
            For security reasons, please enter your password to unlock{' '}
            {next?.startsWith('/personal_sign') ? 'sign' : 'transfer'}:
          </p>
          <div>
            <div className={styles.formitem}>
              <div className={styles.inputWrap}>
                <Input
                  value={pass}
                  onChange={(e: any) => {
                    if (e.target.value.length < 17) {
                      setPass(e.target.value)
                      setPassError('')
                    }
                  }}
                  onKeyPress={(e: any) => {
                    if (e.code.toLowerCase() === 'enter') {
                      handleLoginClick()
                    }
                  }}
                  type={!showPass ? 'password' : 'text'}
                  placeholder={PleaseEnterA616DigitPassword}
                ></Input>
                {!showPass ? (
                  <img
                    src={show}
                    alt="show"
                    onClick={handleChangeShowPassClick}
                  ></img>
                ) : (
                  <img
                    src={hide}
                    alt="hide"
                    onClick={handleChangeShowPassClick}
                  ></img>
                )}
              </div>
              <div className={styles.error}>{passError}</div>
            </div>
          </div>
          <div className={`${styles.fixBottom} maxWidth maxCenter`}>
            <div>
              <Button onClick={handleLoginClick} type="primary">
                <FormatMessage id="Unlock"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button onClick={handleCancelClick} type="default">
                <FormatMessage id="Cancel"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default PreTransfer
