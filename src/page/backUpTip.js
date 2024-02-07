import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import styles from '../styles/backUpTip.module.scss'
import backuptip_bg from '../assets/images/backuptip.png'
import Nav from '../components/Nav'
import FormatMessage from '../store/FormatMessage'
import { useStore } from '../store'

function BackUpTip() {
  const { globalStore } = useStore()
  let navigate = useNavigate()
  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="Reminder"></FormatMessage>
        </Nav>
        <div className={styles.imgWrap}>
          <img src={backuptip_bg} alt="welcome"></img>
        </div>
        <div className={styles.content}>
          <div className={styles.t1}>
            <FormatMessage id="PleaseBackupYourWallet"></FormatMessage>
          </div>
          <div className={styles.t2}>
            <FormatMessage id="InTheNextStep"></FormatMessage>
          </div>
          <div className={styles.t3}>
            <FormatMessage id="IfYourMnemonicPhrasesAreLost"></FormatMessage>
            <br />
            <FormatMessage id="IfYourMnemonicPhrasesAreCompromised"></FormatMessage>
            <br />
            <FormatMessage id="YouHaveTheResponsibilityToKeep"></FormatMessage>
            <br />
            <FormatMessage id="TopiaIsADecentralizedWallet"></FormatMessage>
          </div>
        </div>
        <div className={styles.btns}>
          <div>
            <Button onClick={() => navigate('/backUpMnemonic1')} type="primary">
              <FormatMessage id="Next"></FormatMessage>
            </Button>
          </div>
          <div>
            <Button
              onClick={() => {
                globalStore.setShowBackupModal(true)
                navigate('/')
              }}
              type="default"
            >
              <FormatMessage id="Later"></FormatMessage>
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

export default BackUpTip
