import { useEffect, useRef } from 'react'
import styles from '../styles/input.module.scss'

export type ITextareaProps = {
  value: any
  onChange?: any
  placeholder?: any
  onKeyPress?: any
  style?: any
  disabled?: boolean
  onBlur?: any
}

function Textarea({
  value,
  onChange,
  placeholder,
  onKeyPress,
  style = {},
  disabled = false,
  onBlur,
}: ITextareaProps) {
  const ref = useRef<any>(null)
  function onValueChange(e: any) {
    onChange(e)
    resizeTextarea()
  }

  function resizeTextarea() {
    if (ref.current) {
      ref.current.style.height = '5px'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }

  useEffect(() => {
    resizeTextarea()
  }, [value])

  return (
    <textarea
      ref={ref}
      disabled={disabled}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      className={styles.input}
      value={value}
      onChange={onValueChange}
      onBlur={onBlur}
      style={style}
    ></textarea>
  )
}

export default Textarea
