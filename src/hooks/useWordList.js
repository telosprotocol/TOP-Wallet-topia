import { useEffect, useState } from 'react'
import { getMnemonicWords } from '../lib/appPort'

export function useWordList() {
  const [wordsList, setWordsList] = useState([])

  useEffect(() => {
    async function init() {
      const res = await getMnemonicWords()
      setWordsList(res)
    }
    init()
  }, [])

  return wordsList
}
