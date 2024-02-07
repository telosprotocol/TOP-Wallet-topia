import styles from '../styles/button.module.scss'
import loadingImg from '../assets/images/loading.svg'

function Button({
  disabled = false,
  children,
  type = 'primary',
  onClick,
  loading = false,
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`${styles.button} ${styles[type]} ${
        loading ? styles.loading : ''
      }`}
      onClick={onClick}
    >
      {loading ? (
        <img className={styles.rotating} src={loadingImg} alt="loading"></img>
      ) : (
        children
      )}
    </button>
  )
}

export default Button
