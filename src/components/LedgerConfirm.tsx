import { observer } from 'mobx-react-lite'
import FormatMessage from '../store/FormatMessage'
import styles from '../styles/ledgerConfirm.module.scss'
import alert from '../assets/images/before_confrm.svg'
import { useStore } from '../store'

export type ILedgerConfirmProps = {}

function LedgerConfirm() {
  const { chainStore } = useStore()
  return (
    <div className={styles.lc}>
      <img src={alert} alt=""></img>
      {chainStore.chainType === 'FIL' ? (
        <FormatMessage id="BeforeConfirmingFil"></FormatMessage>
      ) : (
        <FormatMessage id="BeforeConfirming"></FormatMessage>
      )}
    </div>
  )
}

export default observer(LedgerConfirm)
