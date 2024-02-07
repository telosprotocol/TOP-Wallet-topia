import { useRef, useState } from 'react'
import styles from '../styles/Select2.module.scss'
import { useClickAway } from 'react-use'
import selectDown from '../assets/images/selectDown.svg'
import { topialog } from '../lib/log'

export function Select2({ value, onChange, options }: any) {
  const [showSelect, setShowSelect] = useState(false)

  topialog(options)

  const ref = useRef(null)
  useClickAway(ref, () => {
    setShowSelect(false)
  })

  return (
    <div className={styles.select} ref={ref}>
      {showSelect && (
        <div className={styles.options}>
          {options.map((item: any) => {
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
        {options.filter((item: any) => item.value === value)[0].label}
        <img src={selectDown} alt="select"></img>
      </div>
    </div>
  )
}
