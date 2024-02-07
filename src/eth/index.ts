import Web3 from 'web3'
import { ethers } from 'ethers'
import { getBasicAccount } from '../app/account'
import { getPass } from '../app/background'
import { saveDataToTxList, updateTxStatus } from '../app/tx'
import { Decrypt } from '../lib/aes'
import tokenAbi from './abi/abi-token.json'
import { getChainType, getCurrentChain, topAddressToEth } from '../app/utils'
import { topialog } from '../lib/log'
import { ethRpcFetch } from '../app/ethRpc'
import { checkFilAddr, filAddressToEthAddress } from '../fil'
import Eth, { ledgerService } from '@ledgerhq/hw-app-eth'
import { getTransport } from '../ledger'
import utils from 'web3-utils'
import { getEthToTopExchangeRatio } from '../top'

// gas limit
// gasLimit = 21000 + 68 * dataByteLength
// https://ethereum.stackexchange.com/questions/39401/how-do-you-calculate-gas-limit-for-transaction-with-data-in-ethereum

export async function getWeb3() {
  const chain = await getCurrentChain()
  topialog('getWeb3', chain.rpc)
  const web3 = new Web3(chain.rpc)
  return web3
}

export async function getEthersProvider() {
  const chain = await getCurrentChain()
  topialog('getErc20EtherContractchain.rpc', chain.rpc)
  const customHttpProvider = new ethers.providers.JsonRpcProvider(chain.rpc)
  return customHttpProvider
}

export async function getErc20EtherContract(
  tokenAddress: string,
  pass: string
) {
  const customHttpProvider = await getEthersProvider()

  const ba = await getBasicAccount()
  if (!ba.isLedger) {
    const realPrivateKey = Decrypt(ba.privateKey, pass)
    const wallet = new ethers.Wallet(realPrivateKey)
    const walletSigner = wallet.connect(customHttpProvider)
    return new ethers.Contract(tokenAddress, tokenAbi, walletSigner)
  } else {
    const wallet = new ethers.VoidSigner(topAddressToEth(ba.address))
    const walletSigner = wallet.connect(customHttpProvider)
    return new ethers.Contract(tokenAddress, tokenAbi, walletSigner)
  }
}

export async function ethGasFee(gas: number) {
  try {
    const w3 = await getWeb3()
    const gasPrice = await w3.eth.getGasPrice()
    return gas * Number(gasPrice) * 0.000000001
  } catch (error) {
    return 0
  }
}

// getTokenInfo('0x4e02c64cb5cd5c6730e82e62a884be834b926a9e')
export async function getTokenInfo(tokenAddr: string, addr?: string) {
  try {
    topialog('start get')
    let web3 = await getWeb3()
    const contract = new web3.eth.Contract(tokenAbi as any, tokenAddr)
    const decimals = await contract.methods.decimals().call()
    const symbol = await contract.methods.symbol().call()
    let balance = '0'
    if (addr) {
      balance = await contract.methods.balanceOf(topAddressToEth(addr)).call()
    }
    return {
      decimals,
      symbol,
      balance,
    }
  } catch (error) {
    topialog('getTokenInfo error eth', error, { tokenAddr, addr })
    return {
      decimals: 0,
      symbol: '',
      balance: '0',
    }
  }
}

export async function transferEth(sendData: any, cb: any) {
  try {
    const web3 = await getWeb3()
    const account = await getBasicAccount()
    const chainType = await getChainType()
    const realPrivateKey = Decrypt(account.privateKey, getPass())
    const maxPriorityFeePerGas = await ethRpcFetch({
      jsonrpc: '2.0',
      method: 'eth_maxPriorityFeePerGas',
      id: 1,
    })
    let ethTo = sendData.to
    if (checkFilAddr(ethTo)) {
      ethTo = await filAddressToEthAddress(ethTo)
    } else {
      ethTo = topAddressToEth(ethTo)
    }
    //
    let signedTx: any
    if (!account.isLedger) {
      signedTx = await web3.eth.accounts.signTransaction(
        {
          to: ethTo,
          value: sendData.amount,
          gas: sendData.gasLimit,
          maxFeePerGas:
            2 * Number(sendData.baseFee) +
            Number(maxPriorityFeePerGas.result || '0x0'),
          maxPriorityFeePerGas: maxPriorityFeePerGas.result || '0x0',
        },
        realPrivateKey
      )
    } else {
      const transaction = await getRawTx(
        {
          ...sendData,
          to: ethTo,
        },
        account.address
      )
      let unsignedTx = ethers.utils
        .serializeTransaction(transaction)
        .substring(2)

      const result = await ledgerSign(unsignedTx, account.pathIndex || 0)
      const signature = {
        r: '0x' + result.r,
        s: '0x' + result.s,
        v: parseInt(result.v),
        from: topAddressToEth(account.address),
      }
      let rawTransaction = ethers.utils.serializeTransaction(
        transaction,
        signature
      )
      signedTx = { rawTransaction }
      // ledgerSign()
    }
    const rpcResData = await ethRpcFetch({
      jsonrpc: '2.0',
      method: 'eth_sendRawTransaction',
      params: [signedTx.rawTransaction],
      id: 1,
    })
    if (!rpcResData.result) {
      throw new Error('Error')
    }
    const saveData = {
      ...sendData,
      value: sendData.value || '0',
      from: account.address,
      txHash: rpcResData.result,
      time: new Date().getTime(),
      status: 'sending',
      type: chainType,
      realTo: sendData.to,
      address: sendData.to,
    }
    await saveDataToTxList(saveData)
    cb(rpcResData.result)
    return rpcResData.result
  } catch (error) {
    console.log(error)
    throw new Error((error as any).message)
  }
}

export async function transferETHErc20(sendData: any, cb: any) {
  try {
    console.log('sendData', sendData)
    const ba = await getBasicAccount()
    const chainType = await getChainType()
    const contract = await getErc20EtherContract(sendData.to, getPass())
    let hash: string = ''
    if (!ba.isLedger) {
      const maxPriorityFeePerGas = await ethRpcFetch({
        jsonrpc: '2.0',
        method: 'eth_maxPriorityFeePerGas',
        id: 1,
      })
      const maxFeePerGas = await getMaxFeePerGas()
      const transferResult: any = await contract.transfer(
        topAddressToEth(sendData.realTo),
        ethers.utils.parseUnits(sendData.amountShow, sendData.realDecimals),
        {
          gasLimit: sendData.gasLimit,
          maxPriorityFeePerGas: maxPriorityFeePerGas.result || '0x0',
          maxFeePerGas,
        }
      )
      hash = transferResult.hash
      if (!hash) {
        throw new Error('Error')
      }
    } else {
      const data = await contract.populateTransaction.transfer(
        topAddressToEth(sendData.realTo),
        ethers.utils.parseUnits(sendData.amountShow, sendData.realDecimals)
      )
      const transaction = await getRawTx(
        {
          ...sendData,
          data: data.data,
        },
        ba.address
      )
      let unsignedTx = ethers.utils
        .serializeTransaction(transaction)
        .substring(2)

      const result = await ledgerSign(unsignedTx, ba.pathIndex || 0)
      const signature = {
        r: '0x' + result.r,
        s: '0x' + result.s,
        v: parseInt(result.v),
        from: topAddressToEth(ba.address),
      }
      let rawTransaction = ethers.utils.serializeTransaction(
        transaction,
        signature
      )
      const rpcResData = await ethRpcFetch({
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [rawTransaction],
        id: 1,
      })
      if (!rpcResData.result) {
        throw new Error('Error')
      }
      hash = rpcResData.result
    }
    const saveData = {
      ...sendData,
      from: ba.address,
      txHash: hash,
      time: new Date().getTime(),
      status: 'sending',
      type: chainType,
    }
    await saveDataToTxList(saveData)
    cb(hash)
    return hash
  } catch (error) {
    topialog(error)
    throw error
  }
}

export async function waitEthTxSuccess(
  txHash: string,
  address: string,
  time: number
) {
  try {
    topialog('waitEthTxSuccess', txHash, address)
    const res = await ethRpcFetch({
      jsonrpc: '2.0',
      method: 'eth_getTransactionReceipt',
      params: [txHash],
      id: 1,
    })

    topialog('waitEthTxSuccess123', res.result)
    if (!res.result) {
      // timeout
      if (Date.now() - time > 30 * 60 * 60 * 1000) {
        updateTxStatus(txHash, address, 'failure')
        return
      }
      setTimeout(() => {
        waitEthTxSuccess(txHash, address, time)
      }, 4000)
      return
    }
    if (res.result.status === '0x1') {
      //
      let ratio = 1
      if (address.indexOf('TOPEVM_0') > -1) {
        ratio = await getEthToTopExchangeRatio()
      }
      updateTxStatus(
        txHash,
        address,
        'success',
        (
          (Number(ratio) *
            Number(res.result.gasUsed) *
            Number(res.result.effectiveGasPrice)) /
          10 ** 18
        ).toFixed(9)
      )
    } else {
      updateTxStatus(txHash, address, 'failure')
    }
  } catch (error) {
    setTimeout(() => {
      waitEthTxSuccess(txHash, address, time)
    }, 10000)
  }
}

export async function sendEvmConfirmTx(
  params: any,
  pass: string,
  extraParams: any = {}
) {
  if (!params.gasLimit && params.gas && Number(params.gas) !== 0) {
    params.gasLimit = params.gas
    delete params.gas
  }
  params.type = 0x02
  const web3 = await getWeb3()
  const account = await getBasicAccount()

  const chainType = await getChainType()

  if (!params.maxPriorityFeePerGas) {
    const maxPriorityFeePerGas = await getMaxPriorityFeeGas()
    params.maxPriorityFeePerGas = maxPriorityFeePerGas
  }
  if (!params.maxFeePerGas) {
    const maxFeePerGas = await getMaxFeePerGas()
    params.maxFeePerGas = maxFeePerGas
  }

  let rawTransaction = ''
  if (!account.isLedger) {
    const realPrivateKey = Decrypt(account.privateKey, pass)
    const signedTx = await web3.eth.accounts.signTransaction(
      params,
      realPrivateKey
    )
    rawTransaction = signedTx.rawTransaction || ''
  } else {
    const transaction = await getRawTx(
      {
        ...params,
      },
      account.address
    )
    let unsignedTx = ethers.utils.serializeTransaction(transaction).substring(2)

    const result = await ledgerSign(unsignedTx, account.pathIndex || 0)
    const signature = {
      r: '0x' + result.r,
      s: '0x' + result.s,
      v: parseInt(result.v),
      from: topAddressToEth(account.address),
    }
    rawTransaction = ethers.utils.serializeTransaction(transaction, signature)
  }
  const rpcResData = await ethRpcFetch({
    jsonrpc: '2.0',
    method: 'eth_sendRawTransaction',
    params: [rawTransaction],
    id: 1,
  })
  if (rpcResData.error) {
    if (
      rpcResData.error.message.indexOf(
        "sender doesn't have enough funds to send tx."
      ) > -1
    ) {
      throw new Error('Insufficient Balance')
    } else {
      throw new Error('Error')
    }
  }
  let txMethod2 = ''
  if (params.data && params.data.length > 4) {
    if (params.data.startsWith('0x095ea7b3')) {
      txMethod2 = 'Approve'
    } else {
      txMethod2 = 'Contract Interaction'
    }
  }
  delete params.data
  const saveData = {
    ...params,
    value: params.value || '0',
    from: account.address,
    txHash: rpcResData.result,
    time: new Date().getTime(),
    status: 'sending',
    type: chainType,
    realTo: params.to,
    address: params.to,
    txMethod2,
    ...extraParams,
  }
  await saveDataToTxList(saveData)
  return rpcResData.result
}

export async function ethPersonalSign(params: any, pass: string) {
  if (!params.gasLimit && params.gas && Number(params.gas) !== 0) {
    params.gasLimit = params.gas
    delete params.gas
  }
  const web3 = await getWeb3()
  const account = await getBasicAccount()

  if (!account.isLedger) {
    const realPrivateKey = Decrypt(account.privateKey, pass)
    const signedTx = await web3.eth.accounts.sign(params, realPrivateKey)
    return signedTx.signature
  } else {
    const result = await ledgerSignMessage(
      params.replace('0x', ''),
      account.pathIndex || 0,
      false
    )
    if (typeof result === 'string') {
      return result
    }
    return `0x${result.r}${result.s}${result.v.toString(16)}`
  }
}

async function ledgerSign(tx: string, index: number) {
  const resolution = await ledgerService.resolveTransaction(tx, {}, {})
  const transport = await getTransport()
  const appEth = new Eth(transport)
  const result = await appEth.signTransaction(
    `44'/60'/0'/0/${index}`,
    tx,
    resolution
  )
  return result
}

export async function ledgerSignMessage(
  str: string,
  index: number,
  one = true
) {
  const transport = await getTransport()
  const appEth = new Eth(transport)
  const result = await appEth.signPersonalMessage(
    `44'/60'/0'/0/${index}`,
    str
    // Buffer.from(str).toString('hex')
  )
  if (one) {
    let v: any = result['v'] - 27
    v = v.toString(16)
    if (v.length < 2) {
      v = '0' + v
    }
    return '0x' + v + result['r'] + result['s']
  } else {
    return result
  }
}

async function getRawTx(sendData: any, from: string) {
  const chainId = await getChainId()
  // const common = new Common({
  //   chain: Number(chainId),
  //   hardfork: Hardfork.London,
  // })

  const nonce = await getTransactionCount(topAddressToEth(from))

  if (!sendData.amount && sendData.value) {
    sendData.amount = sendData.value
  }

  const txData = {
    data: sendData.data ? sendData.data : null, // ok
    gasLimit: utils.numberToHex(sendData.gasLimit || sendData.gas), // ok
    maxPriorityFeePerGas: '0x1',
    maxFeePerGas: '0x0',
    nonce,
    to: sendData.to,
    value: sendData.amount ? utils.numberToHex(sendData.amount) : '0x0',
    chainId: chainId,
    accessList: [],
    type: 0x02,
  }
  if (!sendData.maxPriorityFeePerGas) {
    const maxPriorityFeePerGas = await getMaxPriorityFeeGas()
    txData.maxPriorityFeePerGas = maxPriorityFeePerGas
  } else {
    txData.maxPriorityFeePerGas = sendData.maxPriorityFeePerGas
  }
  if (!sendData.maxFeePerGas) {
    const maxFeePerGas = await getMaxFeePerGas()
    txData.maxFeePerGas = maxFeePerGas
  } else {
    txData.maxFeePerGas = sendData.maxFeePerGas
  }

  return txData
}

export async function getMaxPriorityFeeGas() {
  const res = await ethRpcFetch({
    jsonrpc: '2.0',
    method: 'eth_maxPriorityFeePerGas',
    id: 1,
  })
  return res.result || '0x0'
}

export async function getGasPrice() {
  const res = await ethRpcFetch({
    jsonrpc: '2.0',
    method: 'eth_gasPrice',
    id: 1,
  })
  return res.result
}

export async function getMaxFeePerGas() {
  const maxPriorityFeePerGas = await getMaxPriorityFeeGas()
  const block = await getLatestBlock()
  return utils.toHex(
    utils
      .toBN(block.baseFeePerGas)
      .mul(utils.toBN(2))
      .add(utils.toBN(maxPriorityFeePerGas))
  )
}

export async function getLatestBlock() {
  const res = await ethRpcFetch({
    jsonrpc: '2.0',
    method: 'eth_getBlockByNumber',
    params: ['latest', false],
    id: 1,
  })
  return res.result
}

export async function getChainId() {
  const res = await ethRpcFetch({
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
    id: 1,
  })
  return res.result
}

export async function getTransactionCount(address: string) {
  const res = await ethRpcFetch({
    jsonrpc: '2.0',
    method: 'eth_getTransactionCount',
    params: [address, 'latest'],
    id: 1,
  })
  return res.result
}
