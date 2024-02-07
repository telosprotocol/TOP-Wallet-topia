import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import Nav from '../components/Nav'
import { onAccountAuth } from '../lib/appPort'
import { useStore } from '../store'
import styles from '../styles/connect.module.scss'
import { observer } from 'mobx-react-lite'
import FormatMessage from '../store/FormatMessage'

function Connect() {
  const { accountStore } = useStore()

  let [searchParams] = useSearchParams()

  const [loading] = useState(false)

  async function onCancel(b: boolean) {
    try {
      await onAccountAuth({
        isAuth: b,
        sequence_id: searchParams.get('sequence_id'),
      })
    } catch (error) {}
    window.close()
  }

  return (
    <>
      <main>
        <Nav showBack={false}>
          <FormatMessage id="UseXXWalletToConnect"></FormatMessage>
        </Nav>
        <div className={styles.connect}>
          <div className="">
            <div className={styles.item}>
              <div className={styles.t1}>
                <FormatMessage id="SelectAccount"></FormatMessage>
              </div>
              <div className={styles.t2}>
                <FormatMessage id="ConnectingTheWebsite"></FormatMessage>
              </div>
            </div>
            <div className={styles.item2}>
              <div className={styles.t21}>
                {accountStore.currentAccount.name}
              </div>
              <div className={styles.t22}>
                {accountStore.hideAccountAddress}
              </div>
            </div>
          </div>
          <div className={styles.btns}>
            <div>
              <Button
                onClick={() => onCancel(true)}
                type="primary"
                loading={loading}
              >
                <FormatMessage id="OK"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button onClick={() => onCancel(false)} type="default">
                <FormatMessage id="Cancel"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default observer(Connect)
