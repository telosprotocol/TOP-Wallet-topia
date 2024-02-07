import { useState } from 'react'
import Button from '../components/Button'
import Nav from '../components/Nav'
import styles from '../styles/backUpMnemonic.module.scss'
import { useNavigate } from 'react-router-dom'
import { copyToClipboard } from '../lib'
import { useWordList } from '../hooks/useWordList'
import FormatMessage from '../store/FormatMessage'

function BackUpMnemonic1() {
  let navigate = useNavigate()
  const wordsList = useWordList()
  const [copyText, setCopyText] = useState('CopyMnemonicPhrases')

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="BackupMnemonicPhrases"></FormatMessage>
        </Nav>
        <div className={styles.container}>
          <div className={styles.mccontainer}>
            {wordsList.map((item, index) => {
              return <div key={item + index}>{item}</div>
            })}
          </div>
          <div>
            <Button
              onClick={() => {
                copyToClipboard(wordsList.join(' '))
                setCopyText('Copied')
                setTimeout(() => {
                  setCopyText('CopyMnemonicPhrases')
                }, 1000)
              }}
              type="default"
            >
              <FormatMessage id={copyText}></FormatMessage>
            </Button>
          </div>
          <div className={styles.tips}>
            <FormatMessage id="DoNotTakeScreenshotsOrShare"></FormatMessage>
            <br />
            <FormatMessage id="CheckYourSurroundings"></FormatMessage>
          </div>
          <div>
            <Button onClick={() => navigate('/backUpMnemonic2')} type="primary">
              <FormatMessage id="Next1"></FormatMessage>
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

export default BackUpMnemonic1
