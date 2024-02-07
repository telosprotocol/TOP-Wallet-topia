import { useEffect, useState } from 'react'
import Button from '../components/Button'
import Nav from '../components/Nav'
import styles from '../styles/backUpMnemonic.module.scss'
import { useNavigate } from 'react-router-dom'
import mclose from '../assets/images/m_close.svg'
import { useWordList } from '../hooks/useWordList'
import { store } from '../store'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex

  // While there remain elements to shuffle...
  while (currentIndex !== 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--

    // And swap it with the current element.
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }

  return array
}

function BackUpMnemonic2() {
  let navigate = useNavigate()
  const wordsList = useWordList()

  const [shuffleWordsList, setShuffleWordsList] = useState([])

  useEffect(() => {
    const tmpWordsList = [...wordsList]
    setShuffleWordsList(
      shuffle(tmpWordsList).map((item) => {
        return {
          w: item,
          isSelect: false,
        }
      })
    )
  }, [wordsList])

  const [userWordsList, setUserWordsList] = useState([])

  const [backError, setBackError] = useState('')

  function handleContinue() {
    if (userWordsList.map((item) => item.w).join(' ') !== wordsList.join(' ')) {
      setBackError(getLocaleMessage({ id: 'IncorrectSequence' }))
      return
    }
    store.globalStore.updateBackupStatus()
    navigate('/recoveryTip')
  }

  function removeWords(index) {
    const tmp = [...userWordsList]
    const item = tmp.splice(index, 1)
    setUserWordsList(tmp)
    const tmp2 = [...shuffleWordsList]
    tmp2[item[0].index].isSelect = false
    setShuffleWordsList(tmp2)
    setBackError('')
  }

  function handleSelect(index) {
    const tmp = [...shuffleWordsList]
    if (!tmp[index].isSelect) {
      userWordsList.push({
        w: tmp[index].w,
        index,
      })
      setUserWordsList([...userWordsList])
      setBackError('')
    }
    tmp[index].isSelect = true
    setShuffleWordsList(tmp)
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="VerifyMnemonicPhrases"></FormatMessage>
        </Nav>
        <div className={styles.container}>
          <div className={styles.t1}>
            <FormatMessage id="ClickOnTheWordsToPutThemInTheCorrectOrder"></FormatMessage>
          </div>
          <div className={styles.mccontainer1}>
            {userWordsList.map((item, index) => {
              return (
                <div onClick={() => removeWords(index)} key={item + index}>
                  {item.w}
                  <img src={mclose} alt="close"></img>
                </div>
              )
            })}
          </div>
          <div className={styles.t2}>{backError}</div>
          <div className={styles.mccontainer}>
            {shuffleWordsList.map((item, index) => {
              return (
                <div
                  onClick={() => handleSelect(index)}
                  className={item.isSelect ? styles.isSelect : ''}
                  key={item.w + index}
                >
                  {item.w}
                </div>
              )
            })}
          </div>
          <div>
            <Button onClick={handleContinue} type="primary">
              <FormatMessage id="Next1"></FormatMessage>
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}

export default BackUpMnemonic2
