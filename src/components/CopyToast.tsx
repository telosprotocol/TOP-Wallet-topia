import copy from '../assets/images/copy.svg'
import ReactTooltip from 'react-tooltip'
import { useEffect, useState } from 'react'
import { getLocaleMessage } from '../store/FormatMessage'

export default function CopyToast({
  onClick = () => {},
  changeText = true,
  className,
}: any) {
  const [id] = useState(Math.random() + '')
  const [text, setText] = useState('')
  useEffect(() => {
    setText(getLocaleMessage('Copy'))
  }, [])
  function handleCopyClick() {
    if (changeText) {
      setText(getLocaleMessage('Copied'))
    }
    onClick()
    setTimeout(() => {
      setText(getLocaleMessage('Copy'))
    }, 1000)
  }
  return (
    <>
      <img
        data-for={id}
        className={className}
        onClick={handleCopyClick}
        src={copy}
        alt="copy"
        data-tip={text}
      ></img>
      <ReactTooltip
        id={id}
        effect="solid"
        getContent={() => text}
      ></ReactTooltip>
    </>
  )
}
