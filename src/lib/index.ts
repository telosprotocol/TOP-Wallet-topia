import BigNumber from 'bignumber.js'
import { getLocaleMessage } from '../store/FormatMessage'
import { IChainType } from '../types'
import { openNewTab } from './appPort'

export function copyToClipboard(text: any) {
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData('Text', text)
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported('copy')
  ) {
    var textarea = document.createElement('textarea')
    textarea.textContent = text
    textarea.style.position = 'fixed' // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea)
    textarea.select()
    try {
      return document.execCommand('copy') // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex)
      return false
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

export function formatAddress(address: string, start = 6, end = -4) {
  if (!address) {
    return ''
  }
  if (address.length < 10) {
    return address
  }
  return address.slice(0, start) + '......' + address.slice(end)
}

export const formatBalance = (num: any, length = 6) => {
  if (!num || Number(num) === 0) {
    return 0
  }

  num = num.toString()
  let c
  if (num.toString().indexOf('.') !== -1) {
    const temp = num.split('.')
    c =
      temp[0].replace(/(\d)(?=(?:\d{3})+$)/g, '$1,') +
      '.' +
      temp[1].slice(0, length)
  } else {
    c = num.toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
  }
  return c
}

export const scala = (num: any, decimals: number) => {
  if (Number(num) === 0 || !num) {
    return 0
  }
  return new BigNumber(num)
    .times(new BigNumber(10).pow(Number(decimals)))
    .toFixed(0, BigNumber.ROUND_DOWN)
}

export const accuracy = (
  num: any,
  decimals: number,
  fix: number,
  acc = false
) => {
  if (Number(num) === 0 || !num) {
    return 0
  }
  const n = new BigNumber(num)
    .div(new BigNumber(10).pow(Number(decimals)))
    .toFixed(Number(fix), BigNumber.ROUND_DOWN)
  if (acc) {
    return n
  }
  return Number(n)
}

export const formatTxTime = (t: number) => {
  const time = new Date(t)
  return `${time.getMonth() + 1} / ${time.getDate()}`
}

export const formatTxTime1 = (t: number) => {
  const time = new Date(t)
  return `${time.getFullYear()}/${
    time.getMonth() + 1
  }/${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}`
}

export const formatTxStatus = (s: string) => {
  if (!s) {
    return ''
  }
  return getLocaleMessage(s)
}

export const checkTOPAddr = (topAddr: string) => {
  if (topAddr.startsWith('T0')) {
    return /^T00000[a-zA-HJ-NP-Z0-9]{25,39}$/.test(topAddr)
  } else {
    return /^T(80000|60004|00000)[a-fA-F0-9]{40}$/.test(topAddr)
  }
}

export const replaceLastZero = (num: string) => {
  if (num.indexOf('.') > -1) {
    return num.replace(/0+$/, '').replace(/\.$/, '')
  } else {
    return num
  }
}

export const openAddressScan = (address: string, chainType: IChainType) => {
  if (chainType === 'TOP' || chainType === 'TOPEVM') {
    openNewTab(
      `https://www.topscan.io/account/accountDetail?address=${address}`
    )
  }
  if (chainType === 'BSC') {
    if (process.env.REACT_APP_REPORT_ENV === 'dn') {
      openNewTab(`https://testnet.bscscan.com/address/${address}`)
    } else {
      openNewTab(`https://bscscan.com/address/${address}`)
    }
  }
  if (chainType === 'FIL' || chainType === 'FEVM') {
    openNewTab(`https://filfox.info/en/address/${address}`)
  }
  if (chainType === 'ETH') {
    if (process.env.REACT_APP_REPORT_ENV === 'dn') {
      openNewTab(`https://sepolia.etherscan.io/address/${address}`)
    } else {
      openNewTab(`https://etherscan.io/address/${address}`)
    }
  }
}

export const openTxScan = (txHash: string, chainType: IChainType) => {
  if (chainType === 'TOP' || chainType === 'TOPEVM') {
    openNewTab(
      `https://www.topscan.io/transactions/transactionsDetail?hash=${txHash}`
    )
  }
  if (chainType === 'BSC') {
    if (process.env.REACT_APP_REPORT_ENV === 'dn') {
      openNewTab(`https://testnet.bscscan.com/tx/${txHash}`)
    } else {
      openNewTab(`https://bscscan.com/tx/${txHash}`)
    }
  }
  if (chainType === 'FIL' || chainType === 'FEVM') {
    openNewTab(`https://filfox.info/en/message/${txHash}`)
  }
  if (chainType === 'ETH') {
    if (process.env.REACT_APP_REPORT_ENV === 'dn') {
      openNewTab(`https://sepolia.etherscan.io/tx/${txHash}`)
    } else {
      openNewTab(`https://etherscan.io/tx/${txHash}`)
    }
  }
}

export const sleep = (t = 1000) => {
  return new Promise((r) => setTimeout(r, t))
}
