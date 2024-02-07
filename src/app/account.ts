import BigNumber from 'bignumber.js'
import TopJs from 'top-sdk-js-v2'

import { getFilBalance } from '../fil'
import { storageGet } from '../lib/storage'
import { IBaAccount, IChainType } from '../types'
import { ethRpcFetch } from './ethRpc'
import { getAccountList, getCurrentChain } from './utils'

export const getTopJs = async () => {
  const chain = await getCurrentChain()
  const _topJs = new TopJs(chain.topRpc)
  return _topJs
}

export const getBasicAccount = async (): Promise<IBaAccount> => {
  const aList = await getAccountList()
  const ba = aList.accountList.filter(
    (item) => (item.address === aList.selectAccount)
  )[0]
  ba.address = ba.address.match(/^T(6|8)/)
    ? ba.address.toLowerCase().replace(/^t/, 'T')
    : ba.address
  return ba
}

export const getAccount = async (
  cb?: (a: IBaAccount) => void,
  v2?: boolean
) => {
  const topJs = await getTopJs()
  const ba = await getBasicAccount()
  if (!ba) {
    return {}
  }
  if (typeof cb === 'function') {
    cb(ba)
  }
  const res = await storageGet<{
    chainType: IChainType
  }>(['chainType'])
  let accountInfo
  if (res.chainType === 'TOP' || (v2 && res.chainType === 'TOPEVM')) {
    accountInfo = await topJs.getAccount({
      address: ba.address, //firstAccount.address
    })
  } else if (
    res.chainType === 'FEVM' ||
    res.chainType === 'TOPEVM' ||
    res.chainType === 'BSC' ||
    res.chainType === 'ETH'
  ) {
    const balanceRes = await getAddressBalance(ba.address, res.chainType)
    accountInfo = {
      data: { balance: balanceRes },
      errno: 0,
    }
  } else {
    const balance = await getFilBalance(ba.address)
    accountInfo = {
      data: { balance },
      errno: 0,
    }
  }

  if (accountInfo.errno === 0) {
    return {
      ...accountInfo.data,
      ...ba,
    }
  } else {
    return {
      ...ba,
      balance: 0,
    }
  }
}

export async function getAddressBalance(
  address: string,
  chainType: IChainType
) {
  if (chainType !== 'FIL') {
    if (chainType === 'TOP' || chainType === 'TOPEVM') {
      const topJs = await getTopJs()
      const accountInfo = await topJs.getAccount({
        address,
      })
      if (accountInfo.errno === 0 && accountInfo.data) {
        return accountInfo.data.balance || '0'
      } else {
        return '0'
      }
    } else {
      const balanceRes = await ethRpcFetch({
        jsonrpc: '2.0',
        method: 'eth_getBalance',
        params: [address, 'latest'],
        id: 1,
      })
      return new BigNumber(balanceRes.result).toFixed()
    }
  } else {
    const balance = await getFilBalance(address)
    return balance
  }
}
