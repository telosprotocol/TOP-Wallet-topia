import styles from '../styles/AccountDetails.module.scss'
import edit from '../assets/images/edit.svg'
import ad_back from '../assets/images/ad_back.svg'
import confirm from '../assets/images/confirm.svg'
import { useStore } from '../store'
import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { observer } from 'mobx-react-lite'
import Button from './Button'
import { copyToClipboard } from '../lib'
import Input from './Input'
import { getPrivateKeyByPass } from '../lib/appPort'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import BlockieIdenticon from './BlockieIdenticon'
import CopyToast from './CopyToast'
import { updateName } from '../app/utils'

function AccountDetails({ onClose }: { onClose: () => void }) {
  const { accountStore } = useStore()

  const [showEdit, setShowEdit] = useState(false)

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  const [pass, setPass] = useState('')
  const [passError, setPassError] = useState('')

  const [step, setStep] = useState(1)

  const [privateKey, setPrivateKey] = useState('')

  const [copyText, setCopyText] = useState('Copy')

  const [exportType, setExportType] = useState<'mnemonic' | 'privateKey'>(
    'mnemonic'
  )

  async function handleLognClick() {
    if (pass.length < 6 || pass.length > 16) {
      setPassError(getLocaleMessage('PleaseEnterA616DigitPassword'))
      return
    }
    const res = await getPrivateKeyByPass({ pass, exportType })
    if (!res) {
      setPassError(getLocaleMessage('IncorrectPassword'))
      return
    }
    if (exportType === 'mnemonic') {
      setPrivateKey(res as string)
    } else {
      setPrivateKey((res as string).replace(/^0x/, ''))
    }
    setPass('')
  }

  useEffect(() => {
    setNameError('')
  }, [name])
  useEffect(() => {
    setPassError('')
  }, [pass])

  function copyWithToast(text: string) {
    copyToClipboard(text)
  }

  async function handleConfirmClick() {
    if (name.length < 1 || name.length > 20) {
      setNameError(getLocaleMessage('PleaseEnterTheWalletName'))
      return
    }
    await updateName({ name })
    accountStore.updateAccount(name)
    setShowEdit(false)
  }

  useEffect(() => {
    if (accountStore.currentAccount.address && step === 1) {
      setTimeout(() => {
        QRCode.toCanvas(
          document.getElementById('ad_canvas'),
          accountStore.currentAccount.address,
          {
            width: 195,
          }
        )
      }, 100)
    }
  }, [accountStore.currentAccount.address, step])

  return (
    <div className={styles.accountDetails}>
      <div className={styles.avatar}>
        <BlockieIdenticon
          diameter="60"
          address={accountStore.currentAccount.address}
        ></BlockieIdenticon>
      </div>
      {step === 1 ? (
        <div>
          {!showEdit && (
            <div className={styles.ad_edit}>
              <div>
                {accountStore.currentAccount.name}
                <img
                  src={edit}
                  alt="edit"
                  onClick={() => {
                    setName(accountStore.currentAccount.name || '')
                    setShowEdit(true)
                  }}
                ></img>
              </div>
            </div>
          )}

          {showEdit && (
            <div className={styles.ad_edit1}>
              <Input
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                onKeyPress={(e: any) => {
                  if (e.code.toLowerCase() === 'enter') {
                    handleConfirmClick()
                  }
                }}
              ></Input>
              <img
                className={styles.confirm}
                src={confirm}
                alt="confirm"
                onClick={handleConfirmClick}
              ></img>
              <div className={styles.error}>{nameError}</div>
            </div>
          )}

          <div className={styles.qrWrap}>
            <canvas id="ad_canvas" height={160} width={160}></canvas>
          </div>
          <div className={styles.addressWrap}>
            <div className={styles.address}>
              {accountStore.currentAccount.address}
            </div>
            <CopyToast
              onClick={() => copyWithToast(accountStore.currentAccount.address)}
            ></CopyToast>
          </div>
          <div
            className={
              accountStore.currentAccount.importType !== 1 ? styles.btns2 : ''
            }
          >
            {accountStore.currentAccount.importType !== 1 && (
              <Button
                onClick={() => {
                  setExportType('mnemonic')
                  setShowEdit(false)
                  setStep(2)
                }}
              >
                <FormatMessage id="ExportMnemonicPhrases1"></FormatMessage>
              </Button>
            )}

            <Button
              onClick={() => {
                setExportType('privateKey')
                setShowEdit(false)
                setStep(2)
              }}
            >
              <FormatMessage id="ExportPrivateKey1"></FormatMessage>
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <img
            onClick={() => {
              setPass('')
              setPrivateKey('')
              setStep(1)
            }}
            className={styles.ad_back}
            src={ad_back}
            alt="ad_back"
          ></img>
          <div className={styles.ad_edit3}>
            <div>{accountStore.currentAccount.name}</div>
          </div>
          <div className={styles.address2}>
            {accountStore.currentAccount.address}
          </div>
          {!privateKey ? (
            <div className={styles.formItem}>
              <div className={styles.label}>
                <FormatMessage id="Password"></FormatMessage>:
              </div>
              <Input
                placeholder={getLocaleMessage('PleaseEnterThePassword')}
                value={pass}
                type="password"
                onChange={(e: any) => setPass(e.target.value)}
                onKeyPress={(e: any) => {
                  if (e.code.toLowerCase() === 'enter') {
                    handleLognClick()
                  }
                }}
              ></Input>
              <div className={styles.fiError}>{passError}</div>
            </div>
          ) : (
            <div>
              {exportType === 'privateKey' ? (
                <div className={styles.privateWrap}>
                  {privateKey}
                  <CopyToast
                    className={styles.privatecopy}
                    onClick={() => copyWithToast(privateKey)}
                  ></CopyToast>
                </div>
              ) : (
                <div className={styles.mnWrap}>
                  <div className={styles.words}>
                    {privateKey.split(' ').map((item) => (
                      <div key={item}>{item}</div>
                    ))}
                  </div>
                  <div>
                    <Button
                      type="default"
                      onClick={() => {
                        copyWithToast(privateKey)
                        setCopyText('Copied')
                        setTimeout(() => {
                          setCopyText('Copy')
                        }, 1000)
                      }}
                    >
                      <FormatMessage id={copyText}></FormatMessage>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className={styles.note}>
            <FormatMessage
              id={
                exportType === 'privateKey'
                  ? 'NoteNeverMakeYourPrivateKeyPublic'
                  : 'NoteNeverMakeYourPrivateKeyPublic2'
              }
            ></FormatMessage>
          </div>
          {!privateKey ? (
            <div className={styles.btns}>
              <Button type="default" onClick={() => setStep(1)}>
                <FormatMessage id="Cancel"></FormatMessage>
              </Button>
              <Button onClick={handleLognClick}>
                <FormatMessage id="OK"></FormatMessage>
              </Button>
            </div>
          ) : (
            <div>
              <Button onClick={onClose}>
                <FormatMessage id="Finish"></FormatMessage>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default observer(AccountDetails)
