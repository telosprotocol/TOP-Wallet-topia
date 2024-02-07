import { observer } from 'mobx-react-lite'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { onAccountChange, onChainChange, onDataSuccess } from '../lib/appPort'
import { useEffect, useState } from 'react'
import styles from '../styles/PersonalSign.module.scss'
import Button from '../components/Button'

import { useStore } from '../store'
import FormatMessage from '../store/FormatMessage'
import { toast } from 'react-toastify'
import { topialog } from '../lib/log'
import LedgerConfirm from '../components/LedgerConfirm'
import { ethPersonalSign } from '../eth'
import faviconV2 from '../assets/images/faviconV2.png'

function PersonalSign() {
  const { accountStore, globalStore, chainStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()

  const [txParams, setTxParams] = useState<any>('')
  const [origin, setOrigin] = useState<any>('')

  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    const sequence_id = searchParams.get('sequence_id')
    const params = searchParams.get('params') || ''
    const origin1 = searchParams.get('origin') || ''
    if (sequence_id) {
      const tmpParma = JSON.parse(decodeURIComponent(params) || '[]')[0]
      setTxParams(tmpParma)
      setOrigin(origin1)
    }
  }, [searchParams])

  async function onCancel() {
    const sequence_id = searchParams.get('sequence_id')
    await onDataSuccess({
      sequence_id,
      data: {
        code: 4001,
        message: 'Cancel, User Rejected Request',
        data: 'Cancel, User Rejected Request',
      },
    })
    window.close()
  }

  async function handleConfirmClick() {
    setLoading(true)
    try {
      const res = await ethPersonalSign(txParams, globalStore.tmpData)
      const sequence_id = searchParams.get('sequence_id')
      await onDataSuccess({ sequence_id, data: res })
      window.close()
    } catch (error) {
      toast.error((error as any).message)
      topialog(error)
      setLoading(false)
    }
  }
  return (
    <>
      <main>
        <div className={styles.PersonalSign}>
          <div className={styles.top}>
            <div className={styles.topInner}>
              <span className={styles.status}></span>
              <div>{chainStore.selectChainDetail.name}</div>
              <span></span>
            </div>
          </div>
          <div className={styles.account}>
            <div className={styles.accountName}>
              {accountStore.currentAccount.name}
            </div>
            <div className={styles.websiteInfo}>
              <div className={styles.wiInner}>
                {origin && (
                  <img
                    src={origin + '/favicon.ico'}
                    alt=""
                    onError={(event: any) => {
                      event.target.src = faviconV2
                      event.onerror = null
                    }}
                  ></img>
                )}
                {origin}
              </div>
            </div>
            <div>
              <div className={styles.sr}>
                <FormatMessage id="SignatureRequest"></FormatMessage>
              </div>
              <div className={styles.srC}>
                <FormatMessage id="SignatureRequestDesc"></FormatMessage>
              </div>
            </div>
          </div>
          <div>
            <div className={styles.yourSign}>
              <FormatMessage id="Youaresigning"></FormatMessage>
            </div>
            <div className={styles.message}>
              <div className={styles.mTitle}>
                <FormatMessage id="Message"></FormatMessage>:{' '}
              </div>
              <div className={styles.breakAll}>{txParams}</div>
            </div>
          </div>
          {accountStore.currentAccount.isLedger && (
            <div className={styles.ledger}>
              <LedgerConfirm></LedgerConfirm>
            </div>
          )}
          <div className={styles.btns}>
            <div>
              <Button onClick={onCancel} type="default">
                <FormatMessage id="Reject"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button
                type="primary"
                loading={loading}
                onClick={handleConfirmClick}
              >
                <FormatMessage id="Sign"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default observer(PersonalSign)
