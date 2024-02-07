import { createFilAccount } from '../lib/appPort'
import { topialog } from '../lib/log'
import { storageGet, storageSet } from '../lib/storage'
import {
  IAccountList,
  IAllTokenList,
  IAuthOrigin,
  IChainSubList,
  IChainType,
  ICurrency,
  ITokenItem,
} from '../types'
import { getBasicAccount } from './account'
import { defaultData } from './background'
import { getSelectChainKey, removeTx } from './tx'

export async function clearCache() {
  const removeAccount = await getBasicAccount()
  await removeTx(removeAccount.address)
  topialog('Cleared')
  return true
}

export async function changeCurrency({ currency }: { currency: ICurrency }) {
  await storageSet<{ currency: ICurrency }>({ currency })
  return true
}

export async function updateName({ name }: { name: string }) {
  const res = await storageGet<{
    accountList: IAccountList
    chainType: IChainType
  }>(['accountList', 'chainType'])
  const accList = res.accountList[res.chainType]
  accList.accountList.filter(
    (item) => item.address === accList.selectAccount
  )[0].name = name
  await storageSet<{ accountList: IAccountList }>({
    accountList: res.accountList,
  })
  return true
}

export async function getAccountList() {
  const res = await getAllAccountList()
  const accList = res.accountList[res.chainType] || {
    selectAccount: '',
    accountList: [],
  }
  return accList
}

export async function getAllAccountList() {
  storageSet<{ accTime: number }>({ accTime: Date.now() })
  const res = await storageGet<{
    accountList: IAccountList
    chainType: IChainType
  }>(['accountList', 'chainType'])
  return res
}

export async function getChainType(): Promise<IChainType> {
  const res = await storageGet<{
    chainType: IChainType
  }>(['chainType'])
  return res.chainType
}

export async function getChain(): Promise<IChainSubList> {
  const res = await storageGet<{
    chainType: IChainType
  }>(['chainType'])
  return defaultData.chainList[res.chainType]
}

export const getCurrentChain = async () => {
  const res = await getChain()
  return res?.chainList[0]
}

export const upgrade = async () => {
  const res = await storageGet<{
    currency: string
    needLogin: boolean
    accountList: IAccountList
  }>(['currency', 'needLogin', 'accountList'])
  topialog(res.currency)
  if (!res.currency) {
    await storageSet(defaultData)
    return
  }
  // 1.1.0
  if (typeof res.needLogin !== 'boolean') {
    await storageSet({
      needLogin: false,
      hasCreateFilAccount: false,
    })
  }
  // FEVM
  if (!res.accountList.FEVM) {
    res.accountList.FEVM = {
      selectAccount: '',
      accountList: [],
    }
    await storageSet({
      accountList: res.accountList,
    })
  }

  // selectAccount
  if (
    res.accountList.TOP.accountList.length > 0 &&
    !res.accountList.TOP.selectAccount
  ) {
    const chainTyleList: IChainType[] = [
      'TOP',
      'FIL',
      'FEVM',
      'TOPEVM',
      'ETH',
      'BSC',
    ]

    chainTyleList.forEach((type) => {
      if (
        res.accountList[type] &&
        res.accountList[type].accountList &&
        res.accountList[type].accountList.length > 0 &&
        !res.accountList[type].selectAccount
      ) {
        res.accountList[type].selectAccount =
          res.accountList[type].accountList[0].address
      }
    })
    await storageSet({
      accountList: res.accountList,
    })
  }
  await storageSet({ needLogin: true })
}

export const getToken = async (): Promise<ITokenItem[]> => {
  const list = await getAllToken()
  return list.filter((item) => !item.isHide)
}

export const getAllToken = async (): Promise<ITokenItem[]> => {
  const res = await storageGet<{
    allTokenList: IAllTokenList
    chainType: IChainType
  }>(['allTokenList', 'chainType'])
  const ba = await getBasicAccount()
  const skey = await getSelectChainKey()
  const key = `${skey}-${ba.address}`
  if (!res.allTokenList[key]) {
    res.allTokenList[key] = []
  }
  return res.allTokenList[key]
}

export const addToken = async (token: ITokenItem) => {
  const res = await storageGet<{
    allTokenList: IAllTokenList
    chainType: IChainType
  }>(['allTokenList', 'chainType'])

  const ba = await getBasicAccount()
  const skey = await getSelectChainKey() // 'TOP_0'
  const key = `${skey}-${ba.address}`
  if (!res.allTokenList[key]) {
    res.allTokenList[key] = []
  }
  res.allTokenList[key].push(token)
  await storageSet<{
    allTokenList: IAllTokenList
  }>({
    allTokenList: res.allTokenList,
  })
}

export const getAllTokens = async (): Promise<ITokenItem[]> => {
  const res = await storageGet<{
    allTokenList: IAllTokenList
    chainType: IChainType
  }>(['allTokenList', 'chainType'])
  // `${res.chainType}_0`
  const ba = await getBasicAccount()
  let ret: ITokenItem[] = []
  Object.keys(defaultData.chainList).forEach((cType) => {
    const key = `${cType}_0}-${ba.address}`
    if (res.allTokenList[key]) {
      ret = [...ret, ...res.allTokenList[key]]
    }
  })
  return ret
}

export const hideOrShowToken = async (
  list: ITokenItem[],
  chainType: IChainType
) => {
  const res = await storageGet<{
    allTokenList: IAllTokenList
  }>(['allTokenList'])

  const ba = await getBasicAccount()
  const key = `${chainType}_0}-${ba.address}`
  res.allTokenList[key] = list
  await storageSet<{
    allTokenList: IAllTokenList
  }>({
    allTokenList: res.allTokenList,
  })
}

export const hideToken = async (address: string) => {
  const res = await storageGet<{
    allTokenList: IAllTokenList
    chainType: IChainType
  }>(['allTokenList', 'chainType'])

  const ba = await getBasicAccount()
  const skey = await getSelectChainKey()
  const key = `${skey}-${ba.address}`
  const newTokenList = res.allTokenList[key].filter(
    (item) => item.address !== address
  )
  res.allTokenList[key] = newTokenList
  await storageSet<{
    allTokenList: IAllTokenList
  }>({
    allTokenList: res.allTokenList,
  })
}

export const getHasCreateFilAccount = async () => {
  const res = await storageGet<{
    hasCreateFilAccount: boolean
  }>(['hasCreateFilAccount'])
  return res.hasCreateFilAccount
}

export const setHasCreateFilAccount = async () => {
  // first has filecon account
  const res = await storageGet<{
    accountList: IAccountList
  }>(['accountList'])
  if (!res.accountList.FIL) {
    // create
    const isSuccess = await createFilAccount()
    if (!isSuccess) {
      throw new Error('Error')
    }
  }
  await storageSet<{
    hasCreateFilAccount: boolean
  }>({
    hasCreateFilAccount: true,
  })
}

export const typeToEvmChainId = (type: IChainType): string => {
  if (process.env.REACT_APP_REPORT_ENV === 'dn') {
    if (type === 'TOPEVM') {
      return '0x3ff'
      // return '0x3ff'
    }
    if (type === 'ETH') {
      return '0xaa36a7'
    }
    if (type === 'BSC') {
      return '0x61'
    }
  } else {
    // if (type === 'FEVM') {
    //   return '0x38'
    // }
    if (type === 'TOPEVM') {
      return '0x3d4'
    }
    if (type === 'ETH') {
      return '0x1'
    }
    if (type === 'BSC') {
      return '0x38'
    }
  }
  return ''
}

export const evmChainIdToChainType = (
  chainId: string
): IChainType | undefined => {
  if (process.env.REACT_APP_REPORT_ENV === 'dn') {
    if (chainId === '0x3ff') {
      return 'TOPEVM'
    }
    if (chainId === '0x3ff') {
      return 'TOPEVM'
    }
    if (chainId === '0xaa36a7') {
      return 'ETH'
    }
    if (chainId === '0x61') {
      return 'BSC'
    }
  } else {
    // if (chainId === '0x38') {
    //   return 'FEVM'
    // }
    if (chainId === '0x3d4') {
      return 'TOPEVM'
    }
    if (chainId === '0x1') {
      return 'ETH'
    }
    if (chainId === '0x38') {
      return 'BSC'
    }
  }
  return undefined
}

export const getChainTypeDecimals = (type: IChainType) => {
  if (type === 'TOP' || type === 'TOPEVM') {
    return 6
  }
  return 18
}

export const getAuthAccount = async (origin: string) => {
  const res = await storageGet<{
    authOrigin: IAuthOrigin
    chainType: IChainType
  }>(['authOrigin', 'chainType'])
  let authOrigin = res.authOrigin || {}
  return (authOrigin[origin] || [])
    .filter((item) => item.chainType === res.chainType)
    .map((item) => item.address)
}

export const createNewWindow = ({
  url,
  prevLeft,
  setPrevLeft,
  waitPromise,
  sequence_id,
}: any) => {
  chrome.windows.getCurrent((w) => {
    if (prevLeft === 0) {
      prevLeft = (w.width || 1500) - 400
      setPrevLeft(prevLeft)
    }
    if (prevLeft <= 0) {
      return
    }
    chrome.windows.create(
      {
        url,
        type: 'popup',
        width: 380,
        top: 10,
        left: prevLeft,
        height: 651,
      },
      ({ id }: any) => {
        waitPromise[sequence_id].windowId = id
      }
    )
  })
}

export function topAddressToEth(address: string) {
  return address.replace(/^T60004/, '0x')
}

export function ethAddressToTop(address: string) {
  if (address.startsWith('0x')) {
    return address.toLowerCase().replace(/^0x/, 'T60004')
  }
  return address
}

export function ethAddressToT8Top(address: string) {
  if (address.startsWith('0x')) {
    return address.toLowerCase().replace(/^0x/, 'T80000')
  }
  return address
}

export function t8TopToEthAddress(address: string) {
  return address.replace(/^T80000/, '0x')
}
