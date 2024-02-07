import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import styles from '../styles/welcome.module.scss'
import login_bg from '../assets/images/login_bg.png'
import Modal from '../components/Modal'
import { useState } from 'react'
import Input from '../components/Input'
import { appPortlogin, clearData, onAccountAuth } from '../lib/appPort'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import useFormatMessage from '../store/useFormatMessage'
import { track } from '../lib/track'
import { useStore } from '../store'

function Login() {
  let navigate = useNavigate()

  const { globalStore } = useStore()

  let [searchParams] = useSearchParams()

  const [showModal, setShowModal] = useState(false)
  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState('')

  async function handleLoginClick() {
    const res = await appPortlogin(pass)
    if (!res) {
      setPassError(getLocaleMessage({ id: 'IncorrectPassword' }))
      return
    }
    track({ event: 'login' })
    const sequence_id = searchParams.get('sequence_id')
    if (sequence_id) {
      await onAccountAuth({
        isAuth: true,
        sequence_id,
      })
      window.close()
      return
    } else {
      const next = searchParams.get('next') || globalStore._data
      globalStore.updateTmpData('')
      navigate(next ? next : '/')
    }
  }

  function handleResetClick() {
    setShowModal(true)
  }

  async function reset() {
    await clearData()
  }

  const PleaseEnterA616DigitPassword = useFormatMessage({
    id: 'PleaseEnterPassword',
  })

  return (
    <>
      <main>
        <div className={styles.imgWrap}>
          <img src={login_bg} alt="login"></img>
        </div>
        <div className={styles.btns}>
          <p>
            <FormatMessage id="Welcome"></FormatMessage>
          </p>
          <div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Password"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input
                  value={pass}
                  onChange={(e: any) => {
                    setPass(e.target.value)
                    setPassError('')
                  }}
                  onKeyPress={(e: any) => {
                    if (e.code.toLowerCase() === 'enter') {
                      handleLoginClick()
                    }
                  }}
                  type={'password'}
                  placeholder={PleaseEnterA616DigitPassword}
                ></Input>
              </div>
              <div className={styles.error}>{passError}</div>
            </div>
          </div>
          <div>
            <Button onClick={handleLoginClick} type="primary">
              <FormatMessage id="LogIn"></FormatMessage>
            </Button>
          </div>
          <div>
            <Button onClick={handleResetClick} type="default">
              <FormatMessage id="ResetWallet"></FormatMessage>
            </Button>
          </div>
        </div>
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          showClose={false}
        >
          <div className={styles.modalContent}>
            <div className={styles.desc}>
              <FormatMessage id="IfTheWalletIsReset"></FormatMessage>
            </div>
            <div className={styles.modalBtns}>
              <Button type="default" onClick={() => setShowModal(false)}>
                <FormatMessage id="Cancel"></FormatMessage>
              </Button>
              <Button type="primary" onClick={reset}>
                <FormatMessage id="Reset"></FormatMessage>
              </Button>
            </div>
          </div>
        </Modal>
      </main>
    </>
  )
}

export default Login
