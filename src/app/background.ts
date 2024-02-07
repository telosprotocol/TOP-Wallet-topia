import { storageSet, storageGet, storageClear } from '../lib/storage'
import { getAccount, getTopJs, getBasicAccount } from './account'
import { getTxList, removeTx, send } from './tx'
import md5 from 'md5'
import { mnemonicToKey, validateMnemonic } from './bipUtils'
import { Decrypt, Encrypt } from '../lib/aes'
import {
  ERROR_INCORRECT_MNEMONIC_FORMAT,
  ERROR_INCORRECT_PASSWORD,
  ERROR_INCORRECT_PRIVATEKEY_FORMAT,
  ERROR_MNEMONIC_EXIST,
  ERROR_NOT_AUTH,
  ERROR_NOT_CANCEL,
  ERROR_PRIVATEKEY_EXIST,
} from './errorCode'
import manifest from './manifest.json'
import {
  createNewWindow,
  ethAddressToTop,
  getAccountList,
  getChainType,
  getChainTypeDecimals,
  topAddressToEth,
  typeToEvmChainId,
  upgrade,
} from './utils'
import {
  IAccountList,
  IAuthOrigin,
  IBaAccount,
  IChainType,
  ICurrency,
  IdefaultData,
  IImportType,
  IIsBackupMnemonic,
  ILocale,
  ITxList,
} from '../types'
import { getWeb3, transferETHErc20 } from '../eth'
import {
  filMnemonicToKey,
  filProvateKeyToAddress,
} from './filecoinSigningUtils'
import { topialog } from '../lib/log'
import { processEthRpc } from './ethRpc'
require('../lib/chromeShim')

let dieuds = ''

let prevLeft = 0

export function setPrevLeft(l: number) {
  prevLeft = l
}

try {
  chrome.runtime.onMessage.addListener((a, b, sendResponse) => {
    sendResponse('')
    return true
  })
} catch (error) {}

export function resetSdjsk(d = '') {
  dieuds = d
}

const TOP_MAINNET_RPC = process.env.REACT_APP_TOP_MAINNET_RPC || ''
const TOPEVM_MAINNET_RPC = process.env.REACT_APP_TOPEVM_MAINNET_RPC || ''

export const defaultData: IdefaultData = {
  needLogin: false,
  isBackupMnemonic: false,
  salt: Math.random() + '',
  locale: 'en',
  currency: 'USD', // 'USD' | 'CNY'
  txList: {},
  hasCreateFilAccount: false,
  accountList: {
    TOP: {
      selectAccount: '',
      accountList: [
        // {
        //   type: 'AES',
        //   name: 'Account 1',
        //   mnemonic: '',
        //   importType // 1 private key 2 mnemonic
        //   privateKey:
        //     '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
        //   address: 'T80000f61e1b145a1c164093d52f8abcc906a1e20237e0',
        //   isSeed: true, // is seed mnemonic account
        //   accountIndex: 0,
        // },
      ],
    },
    TOPEVM: {
      selectAccount: '',
      accountList: [],
    },
    FIL: {
      selectAccount: '',
      accountList: [],
    },
    FEVM: {
      selectAccount: '',
      accountList: [],
    },
    ETH: {
      selectAccount: '',
      accountList: [],
    },
    BSC: {
      selectAccount: '',
      accountList: [],
    },
  },
  allTokenList: {},
  chainType: 'TOPEVM', // 'TOP' | 'TOPEVM' | 'FIL'
  chainList: {
    TOP: {
      chainList: [
        {
          rpc: TOP_MAINNET_RPC,
          topRpc: TOP_MAINNET_RPC,
          name: 'TOP Mainnet',
          browser: 'https://www.topscan.io',
          symbol: 'TOP',
          chainType: 'TOP',
        },
      ],
    },
    TOPEVM: {
      chainList: [
        {
          rpc: TOPEVM_MAINNET_RPC,
          name: 'TOP Mainnet(EVM)',
          browser: 'https://www.topscan.io',
          topRpc: TOP_MAINNET_RPC,
          symbol: 'TOP',
          chainType: 'TOPEVM',
        },
      ],
    },
    FIL: {
      chainList: [
        {
          rpc: '',
          name: 'Filecoin Mainnet',
          browser: 'https://filfox.info',
          topRpc: '',
          symbol: 'FIL',
          chainType: 'FIL',
        },
      ],
    },
    FEVM: {
      chainList: [
        {
          rpc: process.env.REACT_APP_FIL_EVM_RPC || '',
          name: 'Filecoin EVM',
          browser: 'https://filfox.info',
          topRpc: '',
          symbol: 'FIL',
          chainType: 'FEVM',
        },
      ],
    },
    ETH: {
      chainList: [
        {
          rpc: process.env.REACT_APP_ETH_MAINNET_RPC || '',
          name: 'Ethereum Mainnet',
          browser: 'https://etherscan.io',
          topRpc: '',
          symbol: 'ETH',
          chainType: 'ETH',
        },
      ],
    },
    BSC: {
      chainList: [
        {
          rpc: process.env.REACT_APP_BSC_MAINNET_RPC || '',
          name: 'BSC Mainnet',
          browser: 'https://bscscan.com',
          topRpc: '',
          symbol: 'BNB',
          chainType: 'BSC',
        },
      ],
    },
  },
}

chrome.runtime.onInstalled.addListener(() => {
  topialog('installed')
  upgrade()
})

chrome.runtime.onSuspend.addListener(() => {
  chrome.browserAction.setBadgeText({ text: '' })
})

const externalPortMap = new Map()

const waitPromise: any = {}
// message from exten page
chrome.runtime.onConnect.addListener(function (externalPort) {
  externalPortMap.set(externalPort, externalPort)
  externalPort.onMessage.addListener(function (message) {
    if (typeof window !== 'undefined') {
      return
    }
    if (message.type === 'evm') {
      processEthRpc(message, externalPort, waitPromise, prevLeft)
      return
    }
    if (message.type === 'changeChain') {
      changeChain(message.data)
    } else if (message.type === 'changeAccount') {
      changeAccount(message.data)
    } else if (message.type === 'getAccountInfo') {
      getAccountInfo(message, externalPort)
    } else if (message.type === 'clearData') {
      clearData()
    } else if (message.type === 'createAccount') {
      createAccount(message, externalPort)
    } else if (message.type === 'importOldWallet') {
      importOldWallet(message, externalPort)
    } else if (message.type === 'getPageInitData') {
      getPageInitData(message, externalPort)
    } else if (message.type === 'logout') {
      logout(message, externalPort)
    } else if (message.type === 'login') {
      login(message, externalPort)
    } else if (message.type === 'isLogin') {
      isLogin(message, externalPort)
    } else if (message.type === 'getMnemonicWords') {
      getMnemonicWords(message, externalPort)
    } else if (message.type === 'sendTx') {
      sendTx(message, externalPort)
    } else if (message.type === 'sendEthTx') {
      sendEthErc20Tx(message, externalPort)
    } else if (message.type === 'getAccountTxList') {
      getAccountTxList(message, externalPort)
    } else if (message.type === 'removeAccount') {
      removeAccount(message, externalPort)
    } else if (message.type === 'removeLedgerAccount') {
      removeLedgerAccount(message, externalPort)
    } else if (message.type === 'clientEnable') {
      clientEnable(message, externalPort)
    } else if (message.type === 'clientGetAccount') {
      clientGetAccount(message, externalPort)
    } else if (message.type === 'clientGetChain') {
      clientGetChain(message, externalPort)
    } else if (message.type === 'clientSendTx') {
      clientSendTx(message, externalPort)
    } else if (message.type === 'onAccountAuth') {
      onAccountAuth(message, externalPort)
    } else if (message.type === 'onSendTxHash') {
      onSendTxHash(message, externalPort)
    } else if (message.type === 'onDataSuccess') {
      onDataSuccess(message, externalPort)
    } else if (message.type === 'getPrivateKeyByPass') {
      getPrivateKeyByPass(message, externalPort)
    } else if (message.type === 'createFilAccount') {
      createFilAccount(message, externalPort)
    } else if (message.type === 'wallet_switchChain') {
      walletSwitchChain(message, externalPort)
    } else if (message.type === 'updatePass') {
      updatePass(message, externalPort)
    }
  })
  externalPort.onDisconnect.addListener(function () {
    topialog('onDisconnect')
    externalPortMap.delete(externalPort)
    // Do stuff that should happen when popup window closes here
  })
  topialog('onConnect')
})

async function updatePass(message: any, p: chrome.runtime.Port) {
  const res = await storageGet<{
    salt: string
  }>(['salt'])
  resetSdjsk(md5(message.data + res.salt))
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
}

// index 0:TOP, 1|TOPEVM, 2|FIL
async function changeChain(chainType: IChainType) {
  // const res = await storageGet<{
  //   chainList: IChainList
  //   chainType: IChainType
  // }>(['chainList', 'chainType'])
  const res = await storageGet<{
    accountList: IAccountList
    chainType: IChainType
  }>(['accountList', 'chainType'])
  const toAddressList = res.accountList[chainType].accountList.filter(
    (item) => !item.hidden
  )
  // current address
  let toAddress = res.accountList[res.chainType].selectAccount
  let findAddress = ''
  for (let index = 0; index < toAddressList.length; index++) {
    const element = toAddressList[index]
    if (
      topAddressToEth(element.address).toLocaleLowerCase() ===
      topAddressToEth(toAddress).toLocaleLowerCase()
    ) {
      findAddress = element.address
      break
    }
  }
  if (findAddress) {
    toAddress = findAddress
  } else {
    toAddress = toAddressList[0].address
  }
  await changeAccount({
    index: toAddress,
    chainType: chainType,
  })
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'chainChange', target: 'Topia-inpage' })
      p.postMessage({
        method: 'chainChange',
        target: 'Topia-inpage-evm',
        params: { chainId: typeToEvmChainId(chainType) },
      })
    } catch (error) {}
  })
}

async function changeAccount({
  index,
  chainType,
}: {
  index: string
  chainType: IChainType
}) {
  const res = await storageGet<{
    accountList: IAccountList
    chainType: IChainType
  }>(['accountList', 'chainType'])
  res.accountList[chainType].selectAccount = index
  storageSet<{ accountList: IAccountList; chainType: IChainType }>({
    accountList: res.accountList,
    chainType,
  }).then(() => {
    externalPortMap.forEach((p) => {
      try {
        p.postMessage({ type: 'accountChange', target: 'Topia-inpage' })
        p.postMessage({
          method: 'accountChange',
          target: 'Topia-inpage-evm',
          params: [index],
        })
      } catch (error) {}
    })
  })
}

async function clientGetChain(message: any, p: chrome.runtime.Port) {
  const chainType = await getChainType()
  try {
    p.postMessage({
      sequence_id: message.sequence_id,
      data: {
        chainType,
        walletVersion: manifest.version,
      },
      target: 'Topia-inpage',
    })
  } catch (error) {}
}

async function clientGetAccount(message: any, p: chrome.runtime.Port) {
  const { origin } = message
  const ba = await getBasicAccount()
  const chainType = await getChainType()
  const res = await storageGet<{ authOrigin: IAuthOrigin }>(['authOrigin'])
  if (
    isClientAuth(
      origin,
      (item) => item.chainType === chainType && item.address === ba.address,
      res.authOrigin
    )
  ) {
    // const authAddressList = res.authOrigin[origin].filter(
    //   (item) => item.chainType === chainType
    // )
    // let addressToGet = authAddressList[0].address
    // if (
    //   authAddressList.filter((item) => item.address === ba.address).length > 0
    // ) {
    //   addressToGet = ba.address
    // }
    try {
      p.postMessage({
        sequence_id: message.sequence_id,
        data: {
          address: ba.address,
          walletVersion: manifest.version,
          decimals: getChainTypeDecimals(chainType),
        },
        target: 'Topia-inpage',
      })
    } catch (error) {}
  } else {
    try {
      p.postMessage({
        sequence_id: message.sequence_id,
        data: null,
        target: 'Topia-inpage',
        ...ERROR_NOT_AUTH,
      })
    } catch (error) {}
  }
}

async function getAccountInfo(message: any, p: chrome.runtime.Port) {
  const tmpAccount = await getAccount((ba) => {
    delete ba.mnemonic
    delete ba.privateKey
    delete ba.type
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: ba, type: 'cb' })
    } catch (error) {}
  })

  try {
    p.postMessage({ sequence_id: message.sequence_id, data: tmpAccount })
  } catch (error) {}
}

async function clearData() {
  const res = await storageGet<{ locale: ILocale; txList: ITxList }>([
    'locale',
    'txList',
  ])
  await storageClear()
  await storageSet({
    ...defaultData,
    locale: res.locale,
    txList: res.txList,
  })
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'accountChange' })
    } catch (error) {}
  })
}

// import old wallet
async function importOldWallet(message: any, p: chrome.runtime.Port) {
  let {
    pass,
    name,
    mnemonic,
    importType,
    selectChainType,
    topAddressType,
  }: {
    pass: string
    name: string
    mnemonic: string
    importType: IImportType
    selectChainType: IChainType
    topAddressType: 'T8' | 'T0' | undefined
  } = message.data
  topialog('message.data', message.data)
  const isSuccess = await isValidDwef(pass)
  if (!isSuccess) {
    try {
      p.postMessage({
        sequence_id: message.sequence_id,
        ...ERROR_INCORRECT_PASSWORD,
      })
    } catch (error) {}
    return
  }
  const topjs = await getTopJs()
  let keyAndAddress: IBaAccount = { address: '' }

  const res = await storageGet<{
    accountList: IAccountList
    salt: string
    chainType: IChainType
  }>(['accountList', 'salt', 'chainType'])

  const resAccount = res.accountList[selectChainType as IChainType]

  if (!name) {
    name = `Account ${getDisplayName(resAccount.accountList)}`
  }

  if (importType === 2) {
    if (!validateMnemonic(mnemonic)) {
      try {
        p.postMessage({
          sequence_id: message.sequence_id,
          ...ERROR_INCORRECT_MNEMONIC_FORMAT,
        })
      } catch (error) {}
      return
    }
    topialog('selectChainType', selectChainType)
    if (selectChainType !== 'FIL') {
      keyAndAddress = mnemonicToKey(
        mnemonic,
        0,
        selectChainType,
        topAddressType,
        topjs
      )
    } else {
      keyAndAddress = filMnemonicToKey(mnemonic, 0)
    }
    keyAndAddress.mnemonic = Encrypt(keyAndAddress.mnemonic, dieuds)
    keyAndAddress.privateKey = Encrypt(keyAndAddress.privateKey, dieuds)
  } else {
    if (selectChainType === 'TOP' || selectChainType === 'TOPEVM') {
      let tmpAccount
      try {
        tmpAccount = topjs.accounts.generate({
          privateKey: mnemonic,
          addressType: topAddressType === 'T0' ? '0' : '8',
        })
      } catch (error) {
        try {
          p.postMessage({
            sequence_id: message.sequence_id,
            ...ERROR_INCORRECT_PRIVATEKEY_FORMAT,
          })
        } catch (error) {}
        return
      }
      keyAndAddress = {
        privateKey: mnemonic,
        address:
          selectChainType === 'TOPEVM'
            ? tmpAccount.address
                .replace('T80000', 'T60004')
                .replace('T00000', 'T60004')
            : tmpAccount.address,
      }
    } else if (
      selectChainType === 'FEVM' ||
      selectChainType === 'BSC' ||
      selectChainType === 'ETH'
    ) {
      const web3 = await getWeb3()
      const { address } = web3.eth.accounts.privateKeyToAccount(mnemonic)
      keyAndAddress = {
        privateKey: mnemonic,
        address: address,
      }
    } else if (selectChainType === 'FIL') {
      keyAndAddress = {
        privateKey: mnemonic,
        address: filProvateKeyToAddress(mnemonic),
      }
    }
    keyAndAddress.privateKey = Encrypt(keyAndAddress.privateKey, dieuds)
  }

  if (
    resAccount.accountList.filter(
      (item: IBaAccount) =>
        item.address.toLowerCase() === keyAndAddress.address.toLowerCase()
    ).length > 0
  ) {
    try {
      p.postMessage({
        sequence_id: message.sequence_id,
        ...(importType === 2 ? ERROR_MNEMONIC_EXIST : ERROR_PRIVATEKEY_EXIST),
      })
    } catch (error) {}
    return
  }
  res.accountList[selectChainType || res.chainType] = {
    accountList: [
      ...resAccount.accountList,
      {
        type: 'AES',
        importType,
        name,
        isSeed: false,
        ...keyAndAddress,
      },
    ],
    selectAccount: keyAndAddress.address,
  }
  await storageSet({ needLogin: false })
  await storageSet<{ accountList: IAccountList; chainType: IChainType }>({
    accountList: res.accountList,
    chainType: selectChainType || res.chainType,
  })
  try {
    p.postMessage({ type: 'accountChange' })
  } catch (error) {}
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'accountChange', target: 'Topia-inpage' })
    } catch (error) {}
  })
}

async function createAccount(message: any, p: chrome.runtime.Port) {
  let {
    pass,
    name,
    mnemonic,
    isBackupMnemonic,
    selectChainType,
  }: {
    pass: string
    name: string
    mnemonic: string
    isBackupMnemonic: IIsBackupMnemonic
    selectChainType: IChainType
  } = message.data
  const res = await storageGet<{
    accountList: IAccountList
    salt: string
    chainType: IChainType
  }>(['accountList', 'salt', 'chainType'])

  let resAccount = res.accountList[selectChainType as IChainType]
  const currentCreateAccountIndex = getCurrentCreateAccountIndex(
    resAccount.accountList
  )
  if (!name) {
    name = `Account ${getDisplayName(resAccount.accountList)}`
  }
  if (mnemonic) {
    if (!validateMnemonic(mnemonic)) {
      try {
        p.postMessage({
          sequence_id: message.sequence_id,
          ...ERROR_INCORRECT_MNEMONIC_FORMAT,
        })
      } catch (error) {}
      return
    }
  }
  let tmpMnemonic = mnemonic || ''
  if (currentCreateAccountIndex === 0) {
    topialog(11, JSON.stringify(res.accountList))
    resAccount = res.accountList['TOP']
    const resTopEvmAccount = res.accountList['TOPEVM']
    if (pass) {
      resetSdjsk(md5(pass + res.salt))
    }
    const keyAndAddress = mnemonicToKey(
      mnemonic,
      currentCreateAccountIndex,
      'TOP'
    )
    if (!tmpMnemonic) {
      tmpMnemonic = keyAndAddress.mnemonic || ''
    }
    topialog(22, JSON.stringify(res.accountList))
    keyAndAddress.mnemonic = Encrypt(keyAndAddress.mnemonic, dieuds)
    keyAndAddress.privateKey = Encrypt(keyAndAddress.privateKey, dieuds)
    resAccount.selectAccount = keyAndAddress.address
    resAccount.accountList = [
      {
        type: 'AES',
        name,
        isSeed: true,
        importType: 2,
        accountIndex: currentCreateAccountIndex,
        ...keyAndAddress,
      },
    ]
    topialog(33, resTopEvmAccount)
    resTopEvmAccount.selectAccount = keyAndAddress.address.replace(
      /^T80000/,
      'T60004'
    )
    resTopEvmAccount.accountList = [
      {
        type: 'AES',
        name,
        isSeed: true,
        importType: 2,
        accountIndex: currentCreateAccountIndex,
        ...keyAndAddress,
        address: keyAndAddress.address.replace(/^T80000/, 'T60004'),
      },
    ]

    const resFilEvmAccount = res.accountList['FIL'] || {
      selectAccount: '',
      accountList: [],
    }
    const filKeyAndAddress = filMnemonicToKey(
      tmpMnemonic,
      currentCreateAccountIndex
    )
    filKeyAndAddress.mnemonic = Encrypt(filKeyAndAddress.mnemonic, dieuds)
    filKeyAndAddress.privateKey = Encrypt(filKeyAndAddress.privateKey, dieuds)
    resFilEvmAccount.selectAccount = filKeyAndAddress.address
    resFilEvmAccount.accountList = [
      {
        type: 'AES',
        name,
        isSeed: true,
        importType: 2,
        accountIndex: currentCreateAccountIndex,
        ...filKeyAndAddress,
      },
    ]
    initEvmByChainType(res, tmpMnemonic, 'FEVM')
    initEvmByChainType(res, tmpMnemonic, 'BSC')
    initEvmByChainType(res, tmpMnemonic, 'ETH')
    await storageSet({ needLogin: false })
    await storageSet<{
      accountList: IAccountList
      isBackupMnemonic: IIsBackupMnemonic
      chainType: IChainType
    }>({
      accountList: res.accountList,
      isBackupMnemonic,
      chainType: selectChainType as IChainType,
    })
  } else {
    const isSuccess = await isValidDwef(pass)
    if (!isSuccess) {
      try {
        p.postMessage({
          sequence_id: message.sequence_id,
          ...ERROR_INCORRECT_PASSWORD,
        })
      } catch (error) {}
      return
    }
    const { mnemonic } = resAccount.accountList[0]
    let keyAndAddress: IBaAccount
    if (selectChainType !== 'FIL') {
      keyAndAddress = mnemonicToKey(
        Decrypt(mnemonic, dieuds),
        currentCreateAccountIndex,
        selectChainType
      )
    } else {
      keyAndAddress = filMnemonicToKey(
        Decrypt(mnemonic, dieuds),
        currentCreateAccountIndex
      )
    }
    keyAndAddress.mnemonic = Encrypt(keyAndAddress.mnemonic, dieuds)
    keyAndAddress.privateKey = Encrypt(keyAndAddress.privateKey, dieuds)
    resAccount.accountList.push({
      type: 'AES',
      name,
      isSeed: false,
      importType: 2,
      accountIndex: currentCreateAccountIndex,
      ...keyAndAddress,
    })
    resAccount.selectAccount = keyAndAddress.address
    await storageSet<{
      accountList: IAccountList
      chainType: IChainType
    }>({
      accountList: res.accountList,
      chainType: selectChainType as IChainType,
    })
  }
  try {
    p.postMessage({ type: 'accountChange' })
  } catch (error) {}
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'accountChange', target: 'Topia-inpage' })
    } catch (error) {}
  })
}

async function getPageInitData(message: any, p: chrome.runtime.Port) {
  const res = await storageGet<{
    accountList: IAccountList
    locale: ILocale
    isBackupMnemonic: IIsBackupMnemonic
    currency: ICurrency
    chainType: IChainType
    needLogin: boolean
  }>([
    'accountList',
    'locale',
    'isBackupMnemonic',
    'currency',
    'chainType',
    'needLogin',
  ])
  try {
    p.postMessage({
      sequence_id: message.sequence_id,
      data: {
        needLogin: res.needLogin,
        hasPass: dieuds !== '',
        accountLength: res.accountList['TOP'].accountList.length,
        locale: res.locale,
        isBackupMnemonic: res.isBackupMnemonic,
        currency: res.currency,
      },
    })
  } catch (error) {}
}

function getCurrentCreateAccountIndex(accountList: IBaAccount[]) {
  if (accountList.length === 0) {
    return 0
  } else {
    const aIndexArr = accountList
      .filter((item) => typeof item.accountIndex === 'number')
      .map((item) => item.accountIndex)
    aIndexArr.sort()
    for (let index = 0; index < aIndexArr.length; index++) {
      const element = aIndexArr[index]
      if (element !== index) {
        return index
      }
    }
    return aIndexArr.length
  }
}

async function logout(message: any, p: chrome.runtime.Port) {
  resetSdjsk('')
  await storageSet<{ needLogin: boolean }>({ needLogin: true })
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'logout' })
    } catch (error) {}
  })
  try {
    p.postMessage({ sequence_id: message.sequence_id })
  } catch (error) {}
}
export async function isValidDwef(pass: string) {
  let isSuccess = false
  const res = await storageGet<{
    salt: string
    accountList: IAccountList
    chainType: IChainType
  }>(['salt', 'accountList', 'chainType'])

  const tmpDieuds = md5(pass + res.salt)

  const { privateKey, address } = res.accountList.TOP.accountList[0]

  try {
    const realPrivateKey = Decrypt(privateKey, tmpDieuds)
    const topjs = await getTopJs()
    const tmpAccount = topjs.accounts.generate({
      privateKey: realPrivateKey,
    })

    isSuccess =
      tmpAccount.address.toLowerCase().replace(/^t(60004|80000)/, '') ===
      address.toLowerCase().replace(/^t(60004|80000)/, '')
    if (isSuccess) {
      resetSdjsk(tmpDieuds)
    }
  } catch (error) {
    isSuccess = false
  }
  if (isSuccess && res.accountList.FEVM.accountList.length === 0) {
    const mnemonic = res.accountList.TOP.accountList[0].mnemonic || ''
    if (mnemonic) {
      const realMnemonic = Decrypt(mnemonic, dieuds)
      const keyAndAddress = mnemonicToKey(realMnemonic, 0, 'FEVM')
      keyAndAddress.mnemonic = Encrypt(keyAndAddress.mnemonic, dieuds)
      keyAndAddress.privateKey = Encrypt(keyAndAddress.privateKey, dieuds)
      res.accountList.FEVM.selectAccount = keyAndAddress.address
      res.accountList.FEVM.accountList = [
        {
          type: 'AES',
          name: 'Account 1',
          isSeed: true,
          importType: 2,
          accountIndex: 0,
          ...keyAndAddress,
        },
      ]
      await storageSet<{
        accountList: IAccountList
      }>({
        accountList: res.accountList,
      })
    }
  }
  return isSuccess
}
async function isLogin(message: any, p: chrome.runtime.Port) {
  try {
    topialog('isLogin', dieuds)
    p.postMessage({ sequence_id: message.sequence_id, data: dieuds })
  } catch (error) {}
}
async function login(message: any, p: chrome.runtime.Port) {
  const isSuccess = await isValidDwef(message.data.pass)
  if (isSuccess) {
    await initBscAndEth()
    await storageSet<{ needLogin: boolean }>({ needLogin: false })
  }
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: isSuccess })
  } catch (error) {}
}

async function getMnemonicWords(message: any, p: chrome.runtime.Port) {
  const res = await storageGet<{
    accountList: IAccountList
  }>(['accountList'])
  const accounts = res.accountList['TOP']
  const { mnemonic } = accounts.accountList[0]
  const realMnemonic = Decrypt(mnemonic, dieuds)
  try {
    p.postMessage({
      sequence_id: message.sequence_id,
      data: realMnemonic.split(' '),
    })
  } catch (error) {}
}

async function getPrivateKeyByPass(message: any, p: chrome.runtime.Port) {
  const isSuccess = await isValidDwef(message.data.pass)
  if (!isSuccess) {
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: isSuccess })
    } catch (error) {}
  } else {
    const res = await getAccountList()
    const { mnemonic, privateKey } = res.accountList.filter(
      (item) => item.address === res.selectAccount
    )[0]
    let data = ''
    if (message.data.exportType === 'privateKey') {
      data = Decrypt(privateKey, dieuds)
    } else {
      data = Decrypt(mnemonic, dieuds)
    }
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: data })
    } catch (error) {}
  }
}

async function sendTx(message: any, p: chrome.runtime.Port) {
  try {
    const res = await send(message.data, (hash: string) => {
      try {
        p.postMessage({
          sequence_id: message.sequence_id,
          data: hash,
          type: 'cb',
        })
      } catch (error) {}
    })
    p.postMessage({ sequence_id: message.sequence_id, data: res })
  } catch (error) {
    topialog(JSON.stringify(error))
    p.postMessage({ sequence_id: message.sequence_id, errorCode: 'Error' })
  }
}

async function sendEthErc20Tx(message: any, p: chrome.runtime.Port) {
  try {
    const res = await transferETHErc20(message.data, (hash: string) => {
      try {
        p.postMessage({
          sequence_id: message.sequence_id,
          data: hash,
          type: 'cb',
        })
      } catch (error) {}
    })
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: res })
    } catch (error) {
      topialog('transferETH222 error', error)
    }
  } catch (error) {
    topialog('transferETH333 error', error)
    try {
      p.postMessage({
        sequence_id: message.sequence_id,
        errorCode: 'error',
        message: 'error',
      })
    } catch (error) {}
  }
}

export function sendTxChangeEvent() {
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'hashStatusChange' })
    } catch (error) {}
  })
}

async function getAccountTxList(message: any, p: chrome.runtime.Port) {
  const list = await getTxList()
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: list })
  } catch (error) {}
}

export function getPass() {
  return dieuds
}

async function removeAccount(message: any, p: chrome.runtime.Port) {
  const res = await storageGet<{
    accountList: IAccountList
    chainType: IChainType
  }>(['accountList', 'chainType'])
  const resAccount = res.accountList[res.chainType]
  if (resAccount.accountList[0].address === resAccount.selectAccount) {
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: false })
    } catch (error) {}
    return
  }
  let tmpList = [...resAccount.accountList]
  const removeAccount = tmpList.filter(
    (item) => item.address === resAccount.selectAccount
  )
  tmpList = tmpList.filter((item) => item.address !== resAccount.selectAccount)
  await removeTx(removeAccount[0].address)
  let returnToPage = 1
  if (tmpList.filter((item) => !item.hidden).length === 0) {
    tmpList.forEach((item) => {
      item.hidden = false
    })
    returnToPage = 2
  }
  res.accountList[res.chainType] = {
    accountList: tmpList,
    selectAccount: tmpList.filter((item) => !item.hidden)[0].address,
  }
  await storageSet<{ accountList: IAccountList }>({
    accountList: res.accountList,
  })
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: returnToPage })
  } catch (error) {}
  try {
    p.postMessage({ type: 'accountChange' })
  } catch (error) {}
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'accountChange', target: 'Topia-inpage' })
    } catch (error) {}
  })
}

async function removeLedgerAccount(message: any, p: chrome.runtime.Port) {
  const res = await storageGet<{
    accountList: IAccountList
    chainType: IChainType
  }>(['accountList', 'chainType'])
  const resAccount = res.accountList[res.chainType]
  for (let index = 0; index < resAccount.accountList.length; index++) {
    const element = resAccount.accountList[index]
    await removeTx(element.address)
  }
  const tmpList = resAccount.accountList
    .filter((item) => !item.isLedger)
    .map((item) => {
      return {
        ...item,
        hidden: false,
      }
    })
  res.accountList[res.chainType] = {
    accountList: tmpList,
    selectAccount: tmpList[0].address,
  }
  await storageSet<{ accountList: IAccountList }>({
    accountList: res.accountList,
  })
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
  try {
    p.postMessage({ type: 'accountChange' })
  } catch (error) {}
  externalPortMap.forEach((p) => {
    try {
      p.postMessage({ type: 'accountChange', target: 'Topia-inpage' })
    } catch (error) {}
  })
}

function isClientAuth(
  origin: string,
  predicate: (item: { address: string; chainType: IChainType }) => boolean,
  authOrigin: IAuthOrigin
) {
  return true
  // if (authOrigin && authOrigin[origin]) {
  //   return authOrigin[origin].filter(predicate).length > 0
  // }
  // return false
}

async function clientSendTx(message: any, p: chrome.runtime.Port) {
  waitPromise[message.sequence_id] = {
    message,
    p,
  }
  const chainType = await getChainType()
  let transferUrl = ''
  if (chainType === 'TOPEVM') {
    transferUrl = `/evmTransfer?sequence_id=${message.sequence_id}&to=${
      message.data.to
    }&amount=${message.data.amount}&note=${message.data.note || ''}`
  }
  if (chainType === 'FIL') {
    transferUrl = `/filTransfer?sequence_id=${message.sequence_id}&to=${
      message.data.to
    }&amount=${message.data.amount}&note=${message.data.note || ''}`
  }
  if (chainType === 'TOP') {
    if (message.data.type === 'sendContractTx') {
      transferUrl = `/topContractTx?sequence_id=${
        message.sequence_id
      }&params=${encodeURIComponent(
        JSON.stringify(message.data.params)
      )}&origin=${encodeURIComponent(message.origin)}`
    }
  }
  const url = `/index.html#/preTransfer?next=${encodeURIComponent(transferUrl)}`
  // if (hasPass) {
  // } else {
  //   url = '/index.html#/login?next=' + encodeURIComponent(transferUrl)
  // }
  chrome.windows.getCurrent((w) => {
    if (prevLeft === 0) {
      prevLeft = (w.width || 1500) - 400
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
        waitPromise[message.sequence_id].windowId = id
      }
    )
  })
}

async function clientEnable(message: any, p: chrome.runtime.Port) {
  const { origin } = message
  const ba = await getBasicAccount()
  const res = await storageGet<{
    authOrigin: IAuthOrigin
    needLogin: boolean
    chainType: IChainType
  }>(['authOrigin', 'needLogin', 'chainType'])
  const isAuth = isClientAuth(
    origin,
    (item) => item.chainType === res.chainType && item.address === ba.address,
    res.authOrigin
  )
  let url: string
  if (res.needLogin) {
    waitPromise[message.sequence_id] = {
      message,
      p,
    }
    if (isAuth) {
      url = `/index.html#/login?sequence_id=${message.sequence_id}&origin=${origin}`
    } else {
      url =
        '/index.html#/login?next=' +
        encodeURIComponent(
          `/dappConnect?sequence_id=${message.sequence_id}&origin=${origin}`
        )
    }
  } else {
    if (isAuth) {
      try {
        p.postMessage({
          sequence_id: message.sequence_id,
          data: {
            walletVersion: manifest.version,
          },
          target: 'Topia-inpage',
          status: 'ok',
        })
      } catch (error) {}
      return
    } else {
      waitPromise[message.sequence_id] = {
        message,
        p,
      }
      url = `/index.html#/dappConnect?sequence_id=${message.sequence_id}&origin=${origin}`
    }
  }
  chrome.windows.getCurrent((w) => {
    if (prevLeft === 0) {
      prevLeft = (w.width || 1500) - 400
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
        waitPromise[message.sequence_id].windowId = id
      }
    )
  })
}

chrome.windows.onRemoved.addListener((windowId) => {
  setTimeout(() => {
    Object.keys(waitPromise).forEach((sid) => {
      if (waitPromise[sid]) {
        const wid = waitPromise[sid].windowId
        if (wid && wid === windowId) {
          try {
            const isEvm = waitPromise[sid].isEvm
            waitPromise[sid].p.postMessage({
              sequence_id: sid,
              data: isEvm
                ? {
                    code: 4001,
                    message: 'Cancel, User Rejected Request',
                  }
                : false,
              target: isEvm ? 'Topia-inpage-evm' : 'Topia-inpage',
              ...ERROR_NOT_CANCEL,
            })
          } catch (error) {}
          waitPromise[sid] = null
        }
      }
    })
  }, 100)
})

async function onSendTxHash(message: any, p: chrome.runtime.Port) {
  const { hash, sequence_id } = message.data
  try {
    waitPromise[sequence_id].p.postMessage({
      sequence_id: sequence_id,
      data: hash,
      type: 'cb',
      target: 'Topia-inpage',
    })
  } catch (error) {}
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
}

async function onDataSuccess(message: any, p: chrome.runtime.Port) {
  const { data, sequence_id } = message.data
  try {
    const isEvm = waitPromise[sequence_id].isEvm
    waitPromise[sequence_id].p.postMessage({
      sequence_id: sequence_id,
      data: data,
      target: isEvm ? 'Topia-inpage-evm' : 'Topia-inpage',
    })
  } catch (error) {}
  waitPromise[sequence_id] = null
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
}

async function onAccountAuth(message: any, p: chrome.runtime.Port) {
  const { isAuth, sequence_id, list } = message.data
  const origin = waitPromise[sequence_id].message.origin
  if (isAuth && list) {
    const res = await storageGet<{
      authOrigin: IAuthOrigin
      chainType: IChainType
    }>(['authOrigin', 'chainType'])
    let authOrigin = res.authOrigin || {}
    if (!authOrigin[origin]) {
      authOrigin[origin] = []
    }
    const tmpList = authOrigin[origin].filter(
      (item) => item.chainType !== res.chainType
    )
    authOrigin[origin] = [...tmpList, ...list]
    await storageSet<{ authOrigin: IAuthOrigin }>({
      authOrigin,
    })
  }
  if (isAuth) {
    try {
      waitPromise[sequence_id].p.postMessage({
        sequence_id: sequence_id,
        data: {
          walletVersion: manifest.version,
        },
        target: 'Topia-inpage',
      })
    } catch (error) {}
  } else {
    try {
      waitPromise[sequence_id].p.postMessage({
        sequence_id: sequence_id,
        data: false,
        target: 'Topia-inpage',
        ...ERROR_NOT_AUTH,
      })
    } catch (error) {}
  }
  waitPromise[sequence_id] = null
  try {
    p.postMessage({ sequence_id: message.sequence_id, data: true })
  } catch (error) {}
}

function getDisplayName(list: IBaAccount[]) {
  if (list.length === 0) {
    return 1
  }
  let maxIndex = 0
  list.forEach((account) => {
    if (account.name?.match(/^Account \d+$/)) {
      maxIndex = Math.max(
        Number(account.name.replace('Account ', '')),
        maxIndex
      )
    }
  })
  return maxIndex + 1
}

async function createFilAccount(message: any, p: chrome.runtime.Port) {
  try {
    const res = await storageGet<{
      accountList: IAccountList
    }>(['accountList'])
    await createFilInitAccount(res.accountList)
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: true })
    } catch (error) {}
  } catch (error) {
    try {
      p.postMessage({ sequence_id: message.sequence_id, data: false })
    } catch (error) {}
  }
}

async function walletSwitchChain(message: any, p: chrome.runtime.Port) {
  waitPromise[message.sequence_id] = {
    message,
    p,
  }
  const url = `/index.html#/?sequence_id=${message.sequence_id}&switchToChain=${message.data}`
  createNewWindow({
    url,
    prevLeft,
    setPrevLeft,
    waitPromise,
    sequence_id: message.sequence_id,
  })
}

async function createFilInitAccount(accountList: IAccountList) {
  if (accountList.TOP.accountList.length === 0) {
    return
  }
  const account: IBaAccount = accountList.TOP.accountList[0]
  const filKeyAndAddress = filMnemonicToKey(
    Decrypt(account.mnemonic, dieuds),
    0
  )

  filKeyAndAddress.mnemonic = Encrypt(filKeyAndAddress.mnemonic, dieuds)
  filKeyAndAddress.privateKey = Encrypt(filKeyAndAddress.privateKey, dieuds)
  accountList.FIL = {
    selectAccount: filKeyAndAddress.address,
    accountList: [
      {
        type: 'AES',
        name: 'Account 0',
        isSeed: true,
        importType: 2,
        accountIndex: 0,
        ...filKeyAndAddress,
      },
    ],
  }
  await storageSet<{
    accountList: IAccountList
  }>({
    accountList,
  })
}

function initEvmByChainType(
  res: {
    accountList: IAccountList
  },
  tmpMnemonic: string,
  chainType: IChainType
) {
  if (!res.accountList[chainType]) {
    res.accountList[chainType] = {
      selectAccount: '',
      accountList: [],
    }
  }

  const keyAndAddress = mnemonicToKey(tmpMnemonic, 0, chainType)
  keyAndAddress.mnemonic = Encrypt(keyAndAddress.mnemonic, dieuds)
  keyAndAddress.privateKey = Encrypt(keyAndAddress.privateKey, dieuds)
  res.accountList[chainType].selectAccount = keyAndAddress.address
  res.accountList[chainType].accountList = [
    {
      type: 'AES',
      name: 'Account 1',
      isSeed: true,
      importType: 2,
      accountIndex: 0,
      ...keyAndAddress,
    },
  ]
}

// bsc heco update create new account
async function initBscAndEth() {
  const res = await storageGet<{
    accountList: IAccountList
    salt: string
    chainType: IChainType
  }>(['accountList', 'salt', 'chainType'])
  if (!res.accountList['BSC']) {
    const { mnemonic } = res.accountList.TOP.accountList[0]
    const tmpMnemonic = Decrypt(mnemonic, dieuds)

    initEvmByChainType(res, tmpMnemonic, 'BSC')
    initEvmByChainType(res, tmpMnemonic, 'ETH')
    await storageSet<{
      accountList: IAccountList
    }>({
      accountList: res.accountList,
    })
  }
}
