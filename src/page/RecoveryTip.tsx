import { useNavigate } from 'react-router-dom'
import styles from '../styles/RecoveryTip.module.scss'
import Button from '../components/Button'
import { useStore } from '../store'
import { useWordList } from '../hooks/useWordList'

function RecoveryTip() {
  let navigate = useNavigate()

  const wordsList = useWordList()

  const { localeStore } = useStore()

  async function handleNext() {
    navigate('/')
  }

  function download() {
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(wordsList.join(' '))
    )
    element.setAttribute('download', 'download.txt')

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }

  return (
    <>
      <main>
        {localeStore.isCN ? (
          <div className={styles.content}>
            <div className={styles.tip1} style={{ marginBottom: '25px' }}>
              您的助记词会使得账户的备份和恢复非常容易，所以，千万不要在任何情况下向任何人分享！
            </div>

            <div className={styles.tip2} style={{ marginBottom: '30px' }}>
              提示：
              <br />
              • 将助记词存储在密码管理器中。
              <br />
              • 把助记词写在纸上，保存在安全的地方。
              <br />• 记住助记词。
              <br />• <span>下载助记词文件，</span>
              把它保存在一个安全的外部加密硬盘，或者其他存储介质中。
            </div>
            <div className={styles.btns}>
              <div>
                <Button onClick={download} type="primary">
                  下载文件
                </Button>
              </div>
              <div>
                <Button onClick={handleNext} type="default">
                  稍后提醒
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.tip1} style={{ marginBottom: '25px' }}>
              Your secret recovery phrase makes it easy to back up and restore
              your account. Never share it in any context with anyone!
            </div>

            <div className={styles.tip2} style={{ marginBottom: '30px' }}>
              Tips:
              <br />
              • Store this phrase in a password manager.
              <br />
              • Write this phrase on a piece of paper and store in a secure
              location.
              <br />• Memorize this phrase.
              <br />• <span>Download this secret recovery phrase</span> and keep
              it stored safely on an external encrypted hard drive or storage
              medium.
            </div>
            <div className={styles.btns}>
              <div>
                <Button onClick={download} type="primary">
                  Download
                </Button>
              </div>
              <div>
                <Button onClick={handleNext} type="default">
                  Remind me later
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default RecoveryTip
