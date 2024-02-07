import { useRef, useState } from 'react'
import styles from '../styles/Select.module.scss'
import { useClickAway } from 'react-use'
import selectDown from '../assets/images/selectDown.svg'

export function Select({ value, onChange, options }) {
  const [showSelect, setShowSelect] = useState(false)

  const ref = useRef(null)
  useClickAway(ref, () => {
    setShowSelect(false)
  })

  return (
    <div className={styles.select} ref={ref}>
      {showSelect && (
        <div className={styles.options}>
          {options.map((item) => {
            return (
              <div
                className={styles.optionItem}
                onClick={() => {
                  onChange(item.value)
                  setShowSelect(false)
                }}
                key={item.value}
              >
                {item.label}
              </div>
            )
          })}
        </div>
      )}
      <div className={styles.value} onClick={() => setShowSelect((c) => !c)}>
        {options.filter((item) => item.value === value)[0].label}
        <img src={selectDown} alt="select"></img>
      </div>
    </div>
  )
}
