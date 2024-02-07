import {
  validateAddressString,
  ethAddressFromDelegated,
} from '@glif/filecoin-address'
import { LotusRPC, Message } from '@filecoin-shipyard/lotus-client-rpc'
import { BrowserProvider } from '@filecoin-shipyard/lotus-client-provider-browser'

import { mainnet } from '@filecoin-shipyard/lotus-client-schema'
import BigNumber from 'bignumber.js'

export async function filGasFee(
  from: string,
  to: string,
  value: string
): Promise<{ gas: string; msg: Message }> {
  try {
    const client = getFilClient()
    const nonce = await client.mpoolGetNonce(from)
    let msg = {
      To: to,
      From: from,
      Value: scala(value, 18),
      GasLimit: 0,
      GasFeeCap: '0',
      GasPremium: '0',
      Method: 0,
      Params: '',
      Version: 0,
      Nonce: nonce,
    }
    msg = await client.gasEstimateMessageGas(msg, { MaxFee: '0' }, [])

    msg.GasFeeCap = new BigNumber(msg.GasFeeCap)
      .times(0.8)
      .toFixed(0, BigNumber.ROUND_UP)
    msg.GasPremium = new BigNumber(msg.GasPremium)
      .times(0.8)
      .toFixed(0, BigNumber.ROUND_UP)

    const gasFeeCap = new BigNumber(msg.GasFeeCap)
    const gasLimit = new BigNumber(msg.GasLimit)
    let gas = gasFeeCap.times(gasLimit)

    return {
      gas: splitNumber(accuracy(gas, 18, 8, true)),
      msg,
    }
  } catch (error: any) {
    if (error.message.indexOf('sender does not have funds to transfer') > -1) {
      throw new Error('Insufficient funds')
    }
    throw new Error('Estimate gas error')
  }
}

export function checkFilAddr(s: string) {
  return validateAddressString(s)
}

// async function getBaseFee() {
//   const client = getFilClient()
//   const headInfo = await client.chainHead()
//   return new BigNumber(headInfo.Blocks[0].ParentBaseFee)
// }

export async function getFilBalance(address: string) {
  try {
    const client = getFilClient()
    const balance = await client.walletBalance(address)
    return balance
  } catch (error) {
    return 0
  }
}

export function getFilClient() {
  const url = process.env.REACT_APP_FIL_MAINNET_RPC || ''
  const provider = new BrowserProvider(url)
  const client = new LotusRPC(provider, { schema: mainnet.fullNode })
  return client
}

function accuracy(num: any, decimals: number, fix: number, acc = false) {
  if (Number(num) === 0 || !num) {
    return 0
  }
  const n = new BigNumber(num)
    .div(new BigNumber(10).pow(Number(decimals)))
    .toFixed(Number(fix), BigNumber.ROUND_UP)
  if (acc) {
    return n
  }
  return Number(n)
}

const scala = (num: string, decimals: number) => {
  if (Number(num) === 0 || !num) {
    return '0'
  }
  return new BigNumber(num)
    .times(new BigNumber(10).pow(Number(decimals)))
    .toFixed(0)
}

function splitNumber(num: any, decimals = 18) {
  const _num = String(num)
  let result = _num
  if (num.includes('.')) {
    const temp = _num.split('.')
    result = temp[0] + '.' + temp[1].slice(0, decimals).replace(/0+$/, '')
  }
  return result
}

export async function filAddressToEthAddress(filAddress: string) {
  if (filAddress.startsWith('f4')) {
    return ethAddressFromDelegated(filAddress)
  } else {
    const id = await getStateLookupID(filAddress)
    return lookupIDToEthAddress(id)
  }
}

export async function getStateLookupID(filAddress: string) {
  try {
    const client = getFilClient()
    const lookupID = await client.stateLookupID(filAddress, [])
    return lookupID
  } catch (error) {
    return null
  }
}

export function lookupIDToEthAddress(id: string | null) {
  if (!id) {
    return null
  }
  id = id.substring(2)
  var lengtn = 40
  var idHex = intToHex(new BigNumber(id).toNumber())
  var afterLength = lengtn - 2
  const ethAddress = '0xff' + addZeroForNum(idHex, afterLength)
  return ethAddress
}

function intToHex(params: number) {
  return params.toString(16)
}

function addZeroForNum(str: string, strLength: number) {
  var strLen = str.length
  if (strLen < strLength) {
    while (strLen < strLength) {
      var sb = ''
      sb = sb + '0' + str
      str = sb.toString()
      strLen = str.length
    }
  }
  return str
}
