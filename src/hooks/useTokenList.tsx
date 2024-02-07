import { useEffect, useState } from 'react'
import { getTokenInfo } from '../eth'
import { accuracy, formatBalance } from '../lib'
import { useStore } from '../store'
import { ITokenItem } from '../types'

function useTokenList() {
  const { accountStore, chainStore } = useStore()

  const [list, setList] = useState<Record<string, ITokenItem>>({})

  useEffect(() => {
    setList({})
  }, [chainStore.chainType, accountStore.currentAccount.address])

  useEffect(() => {
    if (accountStore.currentAccount.address) {
      accountStore.tokenList.forEach((item) => {
        const address1 = accountStore.currentAccount.address
        getTokenInfo(item.address, accountStore.currentAccount.address).then(
          (d) => {
            if (address1 === accountStore.currentAccount.address) {
              setList((c) => {
                return {
                  ...c,
                  [item.address]: {
                    isHide: item.isHide,
                    chainType: item.chainType,
                    address: item.address,
                    symbol: item.symbol,
                    decimals: item.decimals,
                    balance: d.balance,
                    accBalance: formatBalance(
                      accuracy(d.balance, item.decimals, 6)
                    ),
                    accBalance1: accuracy(d.balance, item.decimals, 6),
                  },
                }
              })
            }
          }
        )
      })
    }
  }, [accountStore.currentAccount.address, accountStore.tokenList])
  const ret: ITokenItem[] = []
  accountStore.tokenList.forEach((item) => {
    if (list[item.address]) {
      ret.push({
        ...item,
        ...list[item.address],
      })
    } else {
      ret.push({
        ...item,
        balance: '0',
        accBalance: '0',
        accBalance1: 0,
      })
    }
  })
  return ret
}

export default useTokenList
