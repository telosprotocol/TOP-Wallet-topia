import { IChainType } from '../types'
import { topialog } from './log'

const queue: {
  [key in string]: {
    resolve: Function
    reject: Function
    cb: Function
  }
} = {}
const eventHandles: {
  accountChange: Function[]
  chainChange: Function[]
  hashChange: Function[]
} = {
  accountChange: [],
  chainChange: [],
  hashChange: [],
}
let port: chrome.runtime.Port
try {
  port = chrome.runtime.connect()
} catch (error) {}
export function initPort() {
  port.onMessage.addListener(function (message) {
    if (message.type === 'accountChange') {
      eventHandles.accountChange.forEach((fn) => fn(message.data))
    } else if (message.type === 'chainChange') {
      eventHandles.chainChange.forEach((fn) => fn(message.data))
    } else if (message.type === 'hashStatusChange') {
      eventHandles.hashChange.forEach((fn) => fn(message.data))
    }

    if (queue[message.sequence_id]) {
      if (message.errorCode) {
        queue[message.sequence_id].reject(message)
      } else {
        if (message.type === 'cb') {
          if (queue[message.sequence_id].cb) {
            queue[message.sequence_id].cb(message.data)
          }
        } else {
          queue[message.sequence_id].resolve(message.data)
        }
      }
    }
  })
}

function createPostMessage<T>(
  type: string,
  data: any = {},
  cb: Function = () => {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const sequence_id = Math.random()
      queue[sequence_id] = {
        resolve,
        reject,
        cb,
      }
      port.postMessage({
        target: 'bgscript',
        type: type,
        sequence_id,
        data: data,
      })
    } catch (error: any) {
      topialog(error.message)
      if (
        error.message.indexOf('Attempting to use a disconnected port object') >
        -1
      ) {
        reInit()
      }
    }
  })
}

function reInit() {
  try {
    port = chrome.runtime.connect()
  } catch (error) {}
  initPort()
}

export function updatePass<T>(pass: string): Promise<T> {
  return createPostMessage('updatePass', pass)
}

export function getAccountInfo<T>(cb: Function): Promise<T> {
  return createPostMessage('getAccountInfo', {}, cb)
}

export async function changeChain(chainType: IChainType) {
  return createPostMessage('changeChain', chainType)
}

export async function changeAccount(index: string, chainType: IChainType) {
  return createPostMessage('changeAccount', { index, chainType })
}

export function onAccountChange(fn: Function) {
  if (typeof fn === 'function') {
    eventHandles.accountChange.push(fn)
    return () => {
      const index = eventHandles.accountChange.indexOf(fn)
      if (index !== -1) {
        eventHandles.accountChange.splice(index, 1)
      }
    }
  }
  return () => {}
}

export function onChainChange(fn: Function) {
  if (typeof fn === 'function') {
    eventHandles.chainChange.push(fn)
    return () => {
      const index = eventHandles.chainChange.indexOf(fn)
      if (index !== -1) {
        eventHandles.chainChange.splice(index, 1)
      }
    }
  }
  return () => {}
}

export function onHashStatusChange(fn: Function) {
  if (typeof fn === 'function') {
    eventHandles.hashChange.push(fn)
  }
}

export function clearData() {
  return createPostMessage('clearData')
}

export type IcreateAccount = {
  pass?: string
  name: string
  mnemonic?: string
  isBackupMnemonic?: boolean
  selectChainType: IChainType
}

export function createAccount({
  pass,
  name,
  mnemonic,
  isBackupMnemonic,
  selectChainType,
}: IcreateAccount) {
  return createPostMessage('createAccount', {
    pass,
    name,
    mnemonic,
    isBackupMnemonic,
    selectChainType,
  })
}

export function getPageInitData<T>(): Promise<T> {
  return createPostMessage('getPageInitData')
}

export function getMnemonicWords() {
  return createPostMessage('getMnemonicWords')
}

export function appPortlogin(pass: string) {
  return createPostMessage('login', {
    pass,
  })
}

export function appPortisLogin() {
  return createPostMessage('isLogin', {})
}

export function appPortLock() {
  return createPostMessage('logout')
}

export function appPortSendTx(data: any, hashCb: Function) {
  return createPostMessage('sendTx', data, hashCb)
}

export function appPortSendEth(data: any, hashCb: Function) {
  return createPostMessage('sendEthTx', data, hashCb)
}

export function appPortTxList<T>(): Promise<T> {
  return createPostMessage('getAccountTxList')
}

export function openNewTab(url: string) {
  window.open(url)
}

export function appPortRemoveAccount() {
  return createPostMessage('removeAccount')
}

export function appPortRemoveLedgerAccount() {
  return createPostMessage('removeLedgerAccount')
}

export function appPortImportOldWallet(data: any) {
  return createPostMessage('importOldWallet', data)
}

export function onAccountAuth(data: any) {
  return createPostMessage('onAccountAuth', data)
}
export function onSendTxHash(data: any) {
  return createPostMessage('onSendTxHash', data)
}
export function onDataSuccess(data: any) {
  return createPostMessage('onDataSuccess', data)
}

export function getPrivateKeyByPass(data: any) {
  return createPostMessage('getPrivateKeyByPass', data)
}

export async function createFilAccount() {
  return createPostMessage('createFilAccount')
}
