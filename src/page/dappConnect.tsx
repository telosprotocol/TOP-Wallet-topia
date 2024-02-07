import { useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import styles from '../styles/DappConnect.module.scss'
import { useEffect, useState } from 'react'
import { onAccountAuth } from '../lib/appPort'
import FormatMessage from '../store/FormatMessage'
import hide from '../assets/images/hide.svg'
import checkbox from '../assets/images/checkbox.svg'
import checkbox_s from '../assets/images/checkbox_s.svg'
import { useStore } from '../store'
import BlockieIdenticon from '../components/BlockieIdenticon'
import { IBaAccount, IChainType } from '../types'
import { accuracy, formatAddress, formatBalance } from '../lib'
import { toast } from 'react-toastify'
import { getAuthAccount, getChainTypeDecimals } from '../app/utils'
import { getAddressBalance } from '../app/account'

type IAuthAccount = IBaAccount & {
  checked: boolean
}

const balanceCache: { [key: string]: number } = {}

function getBalance(l: IAuthAccount[], chainType: IChainType, setList: any) {
  l.forEach((item) => {
    if (typeof balanceCache[item.address + chainType] !== 'undefined') {
      return
    }
    balanceCache[item.address + chainType] = 0
    getAddressBalance(item.address, chainType).then((v) => {
      balanceCache[item.address + chainType] = v
      if (v === 0) {
        return
      }
      setList((l1: IAuthAccount[]) => {
        const tmpList = [...l1]
        const tItem = tmpList.filter(
          (tItem) => tItem.address === item.address
        )[0]
        if (tItem) {
          tItem.balance = formatBalance(
            accuracy(v, getChainTypeDecimals(chainType), 6)
          )
          return tmpList
        } else {
          return l1
        }
      })
    })
  })
}

function DappConnect() {
  const { accountStore } = useStore()

  const [list, setList] = useState<IAuthAccount[]>([])

  const [authedList, setAuthedList] = useState<string[]>([])

  useEffect(() => {
    const tmpList = accountStore.accountList[
      accountStore.chainType
    ].accountList.map((item) => {
      return {
        ...item,
        checked: authedList.includes(item.address),
      }
    })
    getBalance(tmpList, accountStore.chainType, setList)
    setList(tmpList)
  }, [accountStore.chainType, accountStore.accountList, authedList])

  let [searchParams] = useSearchParams()

  const origin = searchParams.get('origin')

  useEffect(() => {
    async function init() {
      if (origin) {
        const res = await getAuthAccount(origin)
        setAuthedList(res)
      }
    }
    init()
  }, [origin])

  const [loading, setLoading] = useState(false)

  async function onCancel(b: boolean) {
    try {
      setLoading(true)
      await onAccountAuth({
        isAuth: b,
        list: list
          .filter((item) => item.checked)
          .map((item) => {
            return {
              address: item.address,
              chainType: accountStore.chainType,
            }
          }),
        sequence_id: searchParams.get('sequence_id'),
      })
      setLoading(false)
    } catch (error) {
      setLoading(false)
      toast.error((error as any).message)
    }
    window.close()
  }

  function handleCheckClick(toState: boolean, index: number) {
    list[index].checked = toState
    setList([...list])
  }

  const [imgError, setImgError] = useState(false)

  return (
    <>
      <main>
        <div className={styles.dappConnect}>
          <div className={styles.host}>
            <div>
              {!imgError && (
                <img
                  src={origin + '/favicon.ico'}
                  onError={() => setImgError(true)}
                  alt=""
                ></img>
              )}
              {origin}
            </div>
          </div>
          <div className={styles.ConnectwithTopia}>
            <div className={styles.cwt1}>Connect with Topia</div>
            <div className={styles.cwt2}>
              Select the account(s) to use on this site to allow it see address,
              account balance, activity and suggest transactions to approve
            </div>
          </div>
          <div className={styles.list}>
            {list.map((item, index) => {
              return (
                <div
                  className={styles.item}
                  onClick={() => {
                    handleCheckClick(!item.checked, index)
                  }}
                >
                  <div className={styles.itemLeft}>
                    <div className={styles.imgWrap}>
                      <BlockieIdenticon
                        address={item.address}
                        diameter={'40px'}
                        alt="avatar"
                        borderRadius="50%"
                      ></BlockieIdenticon>
                    </div>
                    <div>
                      <div className={styles.accountName}>
                        {item.name}
                        <span>({formatAddress(item.address)})</span>
                      </div>
                      <div className={styles.balance}>
                        {formatBalance(item.balance)}{' '}
                        {accountStore.chainType === 'FIL' ? 'FIL' : 'TOP'}
                      </div>
                    </div>
                  </div>
                  {item.checked ? (
                    <img src={checkbox_s} alt="checkbox_s"></img>
                  ) : (
                    <img src={checkbox} alt="checkbox"></img>
                  )}
                </div>
              )
            })}
          </div>
          <div className={styles.fixBottom}>
            <p>Only connect with sites you trust.</p>
            <div>
              <div>
                <Button
                  loading={loading}
                  onClick={() => onCancel(false)}
                  type="default"
                >
                  <FormatMessage id="Cancel"></FormatMessage>
                </Button>
              </div>
              <div>
                <Button
                  loading={loading}
                  onClick={() => onCancel(true)}
                  type="primary"
                >
                  <FormatMessage id="Connect"></FormatMessage>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default DappConnect
