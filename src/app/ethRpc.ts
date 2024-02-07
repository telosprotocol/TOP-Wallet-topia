import { topialog } from '../lib/log'
import { getBasicAccount } from './account'
import { setPrevLeft } from './background'
import {
  createNewWindow,
  evmChainIdToChainType,
  getChainType,
  getCurrentChain,
  topAddressToEth,
  typeToEvmChainId,
} from './utils'

export async function processEthRpc(
  message: any,
  p: any,
  waitPromise: any,
  prevLeft: number
) {
  const chainType = await getChainType()
  // not evm chain return expect switch
  const method = message.data.method
  if (method === 'topia_getProviderState') {
    const ba = await getBasicAccount()
    const chainType = await getChainType()
    responseWithInpageEvm(message, p, {
      chainId: typeToEvmChainId(chainType),
      accounts: [topAddressToEth(ba.address)],
      isUnlocked: false,
    })
    return
  }
  if (
    method === 'wallet_addEthereumChain' ||
    method === 'wallet_switchEthereumChain'
  ) {
    topialog('aaa', message.data.params)
    if (message.data.params.length === 0) {
      return responseWithInpageEvm(message, p, {
        code: -32602,
        message: 'Invalid params',
      })
    }
    const chainId = message.data.params[0].chainId
    if (!isSupportedChainId(chainId)) {
      return responseWithInpageEvm(message, p, {
        code: -32006,
        message: 'Not supported',
      })
    }

    waitPromise[message.sequence_id] = {
      message,
      p,
      isEvm: true,
    }
    const url = `/index.html#/?sequence_id=${
      message.sequence_id
    }&switchToChain=${evmChainIdToChainType(chainId)}`
    createNewWindow({
      url,
      prevLeft,
      setPrevLeft,
      waitPromise,
      sequence_id: message.sequence_id,
    })
    return
  }
  if (chainType === 'TOP' || chainType === 'FIL') {
    responseWithInpageEvm(message, p, {
      code: -32006,
      message: 'Not supported',
    })
    return
  }
  if (method === 'eth_accounts' || method === 'eth_requestAccounts') {
    const ba = await getBasicAccount()
    responseWithInpageEvm(message, p, [topAddressToEth(ba.address)])
  } else if (method === 'eth_sendTransaction') {
    waitPromise[message.sequence_id] = {
      message,
      p,
      isEvm: true,
    }
    let transferUrl = `/evmConfirm?sequence_id=${
      message.sequence_id
    }&params=${encodeURIComponent(JSON.stringify(message.data.params))}`
    const url = `/index.html#/preTransfer?next=${encodeURIComponent(
      transferUrl
    )}`
    createNewWindow({
      url,
      prevLeft,
      setPrevLeft,
      waitPromise,
      sequence_id: message.sequence_id,
    })
    // const web3 = new Web3(RPC_URL)
  } else if (method === 'personal_sign') {
    waitPromise[message.sequence_id] = {
      message,
      p,
      isEvm: true,
    }
    let transferUrl = `/personal_sign?origin=${encodeURIComponent(
      message.origin
    )}&sequence_id=${message.sequence_id}&params=${encodeURIComponent(
      JSON.stringify(message.data.params)
    )}`
    const url = `/index.html#/preTransfer?next=${encodeURIComponent(
      transferUrl
    )}`
    createNewWindow({
      url,
      prevLeft,
      setPrevLeft,
      waitPromise,
      sequence_id: message.sequence_id,
    })
    // const web3 = new Web3(RPC_URL)
  } else {
    const rpcResData = await ethRpcFetch({ ...message.data, id: 1 })
    if (rpcResData.error) {
      responseWithInpageEvm(message, p, rpcResData.error)
    } else {
      responseWithInpageEvm(message, p, rpcResData.result)
    }
  }
}

export async function ethRpcFetch(body: any) {
  const chain = await getCurrentChain()
  const rpcRes = await fetch(chain.rpc, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(body),
  })
  const rpcResData = await rpcRes.json()
  return rpcResData
}

function responseWithInpageEvm(message: any, p: any, result: any) {
  p.postMessage({
    sequence_id: message.sequence_id,
    data: result,
    target: 'Topia-inpage-evm',
  })
}

function isSupportedChainId(chainId: string) {
  return evmChainIdToChainType(chainId) !== undefined
}
