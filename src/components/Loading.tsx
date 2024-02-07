import styles from '../styles/loading.module.scss'
import loadingImg from '../assets/images/loading2.svg'

function Loading() {
  return <img className={styles.rotating} src={loadingImg} alt="loading"></img>
}

export default Loading
