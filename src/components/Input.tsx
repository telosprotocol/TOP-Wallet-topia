import styles from '../styles/input.module.scss'

export type IInputProps = {
  type?: string
  value: any
  onChange?: any
  placeholder?: any
  onKeyPress?: any
  style?: any
  disabled?: boolean
  onBlur?: any
}

function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  onKeyPress,
  style = {},
  disabled = false,
  onBlur,
}: IInputProps) {
  return (
    <input
      disabled={disabled}
      type={type}
      onKeyPress={onKeyPress}
      placeholder={placeholder}
      className={styles.input}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      style={style}
    ></input>
  )
}

export default Input
