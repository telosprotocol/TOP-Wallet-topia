import { observer } from 'mobx-react-lite'
import { Select } from '../components/Select'
import styles from '../styles/setting.module.scss'
import Language from '../assets/images/Language.svg'
import Currencyunit from '../assets/images/Currencyunit.svg'
import show_mm from '../assets/images/show_mm.svg'
import clear from '../assets/images/clear.svg'
import link_forward from '../assets/images/link_forward.svg'
import Nav from '../components/Nav'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { clearCache } from '../app/utils'
import Modal from '../components/Modal'
import { useState } from 'react'
import Button from '../components/Button'
import { toast } from 'react-toastify'
import useFormatMessage from '../store/useFormatMessage'

function Setting() {
  const { globalStore, accountStore, localeStore } = useStore()
  let navigate = useNavigate()

  const success1 = useFormatMessage({ id: 'success1' })

  async function handleClearClick() {
    await clearCache()
    accountStore.updateTxList()
    toast.success(success1)
    setShowResetModal(false)
  }

  const [showResetModal, setShowResetModal] = useState(false)

  return (
    <div className={styles.setting}>
      <Nav>
        <FormatMessage id="Settings"></FormatMessage>
      </Nav>
      <div className={styles.setItem}>
        <div className={styles.setLeft}>
          <img alt="Language" src={Language}></img>
          <FormatMessage id="Language"></FormatMessage>
        </div>
        <Select
          value={localeStore.lan}
          onChange={(v) => localeStore.toogleLan(v, true)}
          options={[
            { label: '简体中文', value: 'zh_CN' },
            { label: 'English', value: 'en' },
          ]}
        ></Select>
      </div>
      <div className={styles.setItem}>
        <div className={styles.setLeft}>
          <img alt="Currencyunit" src={Currencyunit}></img>
          <FormatMessage id="CurrencyUnit"></FormatMessage>
        </div>
        <Select
          value={globalStore.currency}
          onChange={(v) => globalStore.updateCurrency(v)}
          options={[
            { label: 'USD', value: 'USD' },
            { label: 'CNY', value: 'CNY' },
          ]}
        ></Select>
      </div>
      <div
        className={styles.setItem + ' ' + styles.link}
        onClick={() => navigate('/mnemonicPhrases')}
      >
        <div className={styles.setLeft}>
          <img alt="Show mnemonic phrases" src={show_mm}></img>
          <FormatMessage id="ShowMnemonicPhrases"></FormatMessage>
        </div>
        <img alt="link" src={link_forward}></img>
      </div>
      <div className={styles.setItem}>
        <div className={styles.setLeft}>
          <img alt="Clear cache" src={clear}></img>
          <FormatMessage id="ClearCache"></FormatMessage>
        </div>
        <span
          className={styles.clearBtn}
          onClick={() => setShowResetModal(true)}
        >
          <FormatMessage id="Clear"></FormatMessage>
        </span>
      </div>
      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        showClose={true}
        title={getLocaleMessage('ResetAccount')}
      >
        <div>
          <div className="" style={{ fontSize: '16px' }}>
            <FormatMessage id="ResettingAccount"></FormatMessage>
          </div>
          <div className={styles.btns}>
            <Button type="default" onClick={() => setShowResetModal(false)}>
              <FormatMessage id="Nevermind"></FormatMessage>
            </Button>
            <Button onClick={handleClearClick}>
              <FormatMessage id="Reset1"></FormatMessage>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default observer(Setting)
