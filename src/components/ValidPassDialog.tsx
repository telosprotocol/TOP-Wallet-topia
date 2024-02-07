import { ReactElement, useEffect, useState } from 'react'
import Input from './Input'
import Modal from './Modal'
import styles from '../styles/ValidPassDialog.module.scss'
import Button from './Button'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { isValidDwef } from '../app/background'
import useFormatMessage from '../store/useFormatMessage'

type IValidProps = {
  title: string | ReactElement
  des: string | ReactElement
  btnText: string | ReactElement
  onClose: () => any
  value: boolean
  onSuccess: (p: string) => any
}
function ValidPassDialog({
  value,
  onClose,
  onSuccess,
  title,
  des,
  btnText,
}: IValidProps) {
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const incorrectPassword = useFormatMessage({ id: 'IncorrectPassword' })

  useEffect(() => {
    setError('')
  }, [pass])

  useEffect(() => {
    setPass('')
  }, [value])

  async function handleValidClick() {
    setLoading(true)
    const isSuccess = await isValidDwef(pass)
    if (!isSuccess) {
      setLoading(false)
      setError(incorrectPassword)
      return
    }
    onSuccess(pass)
    setLoading(false)
    setPass('')
    setError('')
  }

  if (!value) {
    return null
  }
  return (
    <Modal open={value} onClose={() => onClose()} title={title}>
      <div>
        <div className={styles.des}>{des}</div>
        <div>
          <Input
            type="password"
            placeholder={getLocaleMessage('PleaseEnterThePassword')}
            value={pass}
            onChange={(e: any) => setPass(e.target.value)}
            onKeyPress={(e: any) => {
              if (e.code.toLowerCase() === 'enter') {
                handleValidClick()
              }
            }}
          />
          <div className={styles.error}>{error}</div>
        </div>
        <div className={styles.btns}>
          <Button onClick={onClose} type="default">
            <FormatMessage id="Cancel" />
          </Button>
          <Button onClick={handleValidClick} type="primary" loading={loading}>
            {btnText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
export default ValidPassDialog
