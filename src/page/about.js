import styles from '../styles/setting.module.scss'
import Privacypolicy from '../assets/images/Privacypolicy.svg'
import Termsofuse from '../assets/images/Termsofuse.svg'
import link_forward from '../assets/images/link_forward.svg'
import version from '../assets/images/version.svg'
import Nav from '../components/Nav'
import manifest from '../app/manifest.json'
import FormatMessage from '../store/FormatMessage'
import { openNewTab } from '../lib/appPort'

function About() {
  return (
    <div className={styles.setting}>
      <Nav>
        <FormatMessage id="AboutUs"></FormatMessage>
      </Nav>
      <div className={styles.setItem}>
        <div className={styles.setLeft}>
          <img alt="version" src={version}></img>
          <FormatMessage id="Version"></FormatMessage>
        </div>
        <span className={styles.rightText}>{manifest.version}</span>
      </div>
      <div
        className={styles.setItem + ' ' + styles.link}
        onClick={() =>
          openNewTab('https://www.topiawallet.io/Privacy_Policy.html')
        }
      >
        <div className={styles.setLeft}>
          <img alt="Privacy policy" src={Privacypolicy}></img>
          <FormatMessage id="PrivacyPolicy"></FormatMessage>
        </div>
        <img alt="link" src={link_forward}></img>
      </div>
      <div
        className={styles.setItem + ' ' + styles.link}
        onClick={() =>
          openNewTab('https://www.topiawallet.io/Terms_of_Use.html')
        }
      >
        <div className={styles.setLeft}>
          <img alt="Termsofuse" src={Termsofuse}></img>
          <FormatMessage id="TermsOfUse"></FormatMessage>
        </div>
        <img alt="link" src={link_forward}></img>
      </div>
    </div>
  )
}

export default About
