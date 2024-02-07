export type IImportType = 1 | 2 | 3

export type IBaAccount = {
  address: string
  mnemonic?: string
  privateKey?: string
  type?: 'AES'
  importType?: IImportType
  accountIndex?: number
  name?: string
  isSeed?: boolean
  balance?: number
  isLedger?: boolean
  pathIndex?: number
  hidden?: boolean
}

export type IAllTokenList = Record<string, ITokenItem[]>

export type IAccountSubList = {
  selectAccount: string
  accountList: IBaAccount[]
}

export type IAccountList = Record<IChainType, IAccountSubList>

export type IIsBackupMnemonic = boolean
export type ICurrency = 'USD' | 'CNY'
export type ILocale = 'en' | 'zh_CN'
export type IChainType = 'TOP' | 'TOPEVM' | 'FIL' | 'FEVM' | 'BSC' | 'ETH'
export type ICHainItem = {
  rpc: string
  name: string
  browser: string
  topRpc: string
  symbol: string
  chainType: IChainType
}
export type IChainSubList = {
  chainList: ICHainItem[]
}

export type IChainList = Record<IChainType, IChainSubList>

export type ITxStatus = 'sending' | 'failure' | 'success'

export type ITxItem = {
  status: ITxStatus
  txHash: string
  time: number
  amount: number
  amountShow?: number
  to: string
  realTo: string
  from: string
  note?: string
  fee?: number | string
  symbol: string
  mainSymbol?: string
  address: string
  type: IChainType
  txMethod?: string
  txMethod2?: string
  params?: string
  v?: 'v2'
}

export type ITxList = {
  [key: string]: ITxItem[]
}

export type ITokenItem = {
  chainType: IChainType
  address: string
  symbol: string
  decimals: number
  isHide: boolean
  balance?: string
  accBalance?: string | number
  accBalance1?: string | number
}

export type IdefaultData = {
  needLogin: boolean
  isBackupMnemonic: IIsBackupMnemonic
  salt: string
  hasCreateFilAccount: boolean
  locale: ILocale
  currency: ICurrency
  txList: ITxList
  chainType: IChainType
  accountList: IAccountList
  chainList: IChainList
  allTokenList: IAllTokenList
}

export type IAuthOrigin = {
  [key: string]: { address: string; chainType: IChainType }[]
}
