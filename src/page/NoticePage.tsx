import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from '../styles/NoticePage.module.scss'
import Button from '../components/Button'
import { useStore } from '../store'
import { topialog } from '../lib/log'

function NoticePage() {
  let navigate = useNavigate()

  const { localeStore } = useStore()

  const [searchParams] = useSearchParams()

  topialog('searchParams', searchParams, searchParams.get('next'))

  async function handleNext() {
    navigate('/' + (searchParams.get('next') || 'welcome'))
  }

  return (
    <>
      <main>
        {localeStore.isCN ? (
          <div className={styles.content}>
            <div className={styles.tip1} style={{ marginBottom: '20px' }}>
              Topia不会在该应用中收集用户数据。
            </div>
            <div className={styles.tip1} style={{ marginBottom: '26px' }}>
              Topia会...
            </div>
            <div className={styles.tip2} style={{ marginBottom: '20px' }}>
              • 总是允许任何帐户容易地退出
              <br />
              • 总是允许你通过设置菜单退出
              <br />• 进行匿名的点击和浏览
            </div> 
            <div className={styles.tip2} style={{ marginBottom: '8px' }}>
              • <span>永远不会</span>
              收集密钥、地址、交易、余额、哈希或任何个人信息
            </div>
            <div className={styles.tip2} style={{ marginBottom: '30px' }}>
              • <span>永远不会</span>收集完整的IP地址
            </div>
            <div className={styles.btns}>
              <div>
                <Button onClick={handleNext} type="primary">
                  Got it！
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.tip1} style={{ marginBottom: '20px' }}>
              Topia will not gather usage data from the extension program.
            </div>
            <div className={styles.tip1} style={{ marginBottom: '26px' }}>
              Topia will..
            </div>
            <div className={styles.tip2} style={{ marginBottom: '20px' }}>
              • Always allow any account to opt-out easily
              <br />
              • Always allow you to out-out via Settings
              <br />• Send anonymized click {'&'} pageview events
            </div>
            <div className={styles.tip2} style={{ marginBottom: '8px' }}>
              • <span>Never</span> collect keys, addresses, transactions,
              balances, hashes, or any personal information
            </div>
            <div className={styles.tip2} style={{ marginBottom: '30px' }}>
              • <span>Never</span> collect your full IP address
            </div>
            <div className={styles.btns}>
              <div>
                <Button onClick={handleNext} type="primary">
                  Got it!
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}

export default NoticePage
