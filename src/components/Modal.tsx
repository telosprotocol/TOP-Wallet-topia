import ReactModal from 'react-modal'
import styles from '../styles/modal.module.scss'
import close from '../assets/images/close.svg'

function Modal({
  shouldCloseOnOverlayClick = false,
  open,
  onClose,
  title,
  children,
  showClose = true,
  customerContentStyle = {},
}: any) {
  return (
    <ReactModal
      isOpen={open}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
      style={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1200,
        },
        content: {
          inset: '50% 20px auto 20px',
          transform: 'translateY(-50%)',
          overflow: 'visible',
          padding: 0,
          maxWidth: '365px',
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 1200,
        },
      }}
    >
      <div className={styles.modal}>
        {showClose && (
          <img
            onClick={onClose}
            className={styles.close}
            src={close}
            alt="close"
          ></img>
        )}
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.content} style={customerContentStyle}>
          {children}
        </div>
      </div>
    </ReactModal>
  )
}

export default Modal
