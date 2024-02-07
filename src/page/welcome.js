import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import styles from '../styles/welcome.module.scss'
import welcome_bg from '../assets/images/welcome_bg.png'
import FormatMessage from '../store/FormatMessage'

function Welcome() {
  let navigate = useNavigate()
  return (
    <>
      <main>
        <div className={styles.imgWrap}>
          <img src={welcome_bg} alt="welcome"></img>
        </div>
        <div className={styles.btns}>
          <p>
            <FormatMessage id="CreateYourTOPDigitalWallet"></FormatMessage>
          </p>
          <div>
            <Button
              onClick={() => navigate('/noticePage?next=createNewWallet')}
              type="primary"
            >
              <FormatMessage id="CreateWallet1"></FormatMessage>
            </Button>
          </div>
          <div>
            <Button
              onClick={() => navigate('/noticePage?next=importNewWallet')}
              type="default"
            >
              <FormatMessage id="ImportWallet1"></FormatMessage>
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

export default Welcome
