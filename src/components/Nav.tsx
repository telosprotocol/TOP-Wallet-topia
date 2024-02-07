import styles from '../styles/nav.module.scss'
import back from '../assets/images/back.svg'
import { useNavigate } from 'react-router-dom'

function Nav({ children, showBack = true, right, backCallback }: any) {
  let navigate = useNavigate()
  function handleBackClick() {
    if (showBack) {
      if (backCallback && typeof backCallback === 'function') {
        backCallback()
      } else {
        navigate(-1)
      }
    }
  }
  return (
    <div className={styles.navWrap}>
      <div className={`${styles.nav} maxWidth`}>
        <div className={styles.left} onClick={handleBackClick}>
          {showBack && <img src={back} alt="back"></img>}
        </div>
        <div className={styles.center}>{children}</div>
        <div className={styles.right}>{right}</div>
      </div>
    </div>
  )
}

export default Nav
