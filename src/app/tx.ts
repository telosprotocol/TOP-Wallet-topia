import { ledgerSignMessage, waitEthTxSuccess } from '../eth'
import { getFilClient } from '../fil'
import { Decrypt } from '../lib/aes'
import { topialog } from '../lib/log'
import { storageGet, storageSet } from '../lib/storage'
import { IChainType, ITxItem, ITxList, ITxStatus } from '../types'
import { getAccount, getBasicAccount, getTopJs } from './account'
import { defaultData, getPass, sendTxChangeEvent } from './background'
import { ethAddressToTop, getChainType } from './utils'

export async function startExcuteTx() {
  const txList = await getTxList()
  if (!txList || txList.length === 0) {
    return
  }
  const selectChainKey = await getSelectChainKey()
  const account = await getBasicAccount()
  const key = `${account.address}_${selectChainKey}`
  txList.forEach((item) => {
    if (item.status === 'sending') {
      if (item.type === 'TOP' || item.v === 'v2') {
        let TX_TIMES = 105
        const diff = new Date().getTime() - item.time
        if (diff >= 315000) {
          TX_TIMES = 1
        } else {
          TX_TIMES = 107 - parseInt(diff / 3000 + '')
        }
        waitTxSuccess(item.txHash, key, TX_TIMES)
      } else if (item.type === 'FIL') {
        let TX_TIMES = 160
        const diff = new Date().getTime() - item.time
        if (diff >= 40 * 60 * 1000) {
          TX_TIMES = 1
        } else {
          TX_TIMES = 162 - parseInt(diff / 10000 + '')
        }
        waitFilSuccess(item.txHash, key, TX_TIMES)
      } else {
        waitEthTxSuccess(item.txHash, key, item.time)
      }
    } else if (item.status === 'failure') {
      if (
        item.type === 'FIL' &&
        new Date().getTime() - item.time < 24 * 60 * 60 * 1000
      ) {
        recheckFailureFilTx(item.txHash, key)
      }
    }
  })
}

setTimeout(() => {
  startExcuteTx()
}, 1000)

export async function removeTx(address: string) {
  const res = await storageGet<{ txList: ITxList }>(['txList'])
  const selectChainKey = await getSelectChainKey()
  res.txList[`${address}_${selectChainKey}`] = []
  await storageSet<{ txList: ITxList }>({ txList: res.txList })
}

export async function getTxList() {
  const account = await getBasicAccount()
  if (!account) {
    return []
  }
  const res = await storageGet<{ txList: ITxList }>(['txList'])
  const selectChainKey = await getSelectChainKey()
  const txList = res.txList[`${account.address}_${selectChainKey}`] || []
  return txList
}

export const send = async (data: any, txHashCallback: any) => {
  const fee = data.fee || 0
  delete data.fee
  delete data.pass
  delete data.waitSuccess
  const topJs = await getTopJs()
  const ba = await getBasicAccount()
  const account = await getAccount(() => {}, true)
  const tx = await topJs.generateTx({
    txMethod: data.txMethod,
    amount: Number(data.amount),
    nonce: account.nonce,
    latest_tx_hash_xxhash64: account.latest_tx_hash_xxhash64,
    from: account.address,
    to: ethAddressToTop(data.to),
    note: data.note || '',
    ext: ba.isLedger ? '0x01' : '',
  })
  const txHash = JSON.parse(tx.body).params.tx_hash
  let signedTx
  if (!ba.isLedger) {
    const realPrivateKey = Decrypt(account.privateKey, getPass()).replace(
      /^0x/,
      ''
    )
    signedTx = await topJs.signTransaction(tx, realPrivateKey)
  } else {
    let params = JSON.parse(tx.body)
    let authHex = await ledgerSignMessage(
      Buffer.from(txHash).toString('hex'),
      ba.pathIndex || 0
    )
    params.params.authorization = authHex
    tx.body = JSON.stringify(params)
    signedTx = tx
  }
  const result = await topJs.sendSignedTransaction(signedTx)
  if (result.errno !== 0) {
    topialog(JSON.stringify(result))
    throw new Error(result.errmsg || result.errno)
  }
  const saveData = {
    ...data,
    realTo: data.to,
    from: account.address,
    txHash,
    time: new Date().getTime(),
    fee,
    status: 'sending',
    type: 'TOP',
    address: 'TOP',
    symbol: 'TOP',
    v: 'v2',
  }
  await saveDataToTxList(saveData)
  if (typeof txHashCallback === 'function') {
    txHashCallback(txHash)
  }
  return result
}

export const topSystemContractSend = async (
  data: any,
  pass: string,
  method2: string,
  topAmount: number
) => {
  const topJs = await getTopJs()
  const ba = await getBasicAccount()
  const account = await getAccount(() => {}, true)
  const tx = await topJs.generateTx({
    ...data,
    from: account.address,
    nonce: account.nonce,
    latest_tx_hash_xxhash64: account.latest_tx_hash_xxhash64,
    ext: ba.isLedger ? '0x01' : '',
  })

  const txHash = JSON.parse(tx.body).params.tx_hash
  let signedTx
  if (!ba.isLedger) {
    const realPrivateKey = Decrypt(account.privateKey, pass).replace(/^0x/, '')
    signedTx = await topJs.signTransaction(tx, realPrivateKey)
  } else {
    let params = JSON.parse(tx.body)
    let authHex = await ledgerSignMessage(
      Buffer.from(txHash).toString('hex'),
      ba.pathIndex || 0
    )
    params.params.authorization = authHex
    tx.body = JSON.stringify(params)
    signedTx = tx
  }
  const result = await topJs.sendSignedTransaction(signedTx)
  if (result.errno !== 0) {
    throw new Error(result)
  }
  const saveData: any = {
    txMethod: data.txMethod,
    realTo: account.address,
    from: account.address,
    txHash,
    time: new Date().getTime(),
    fee: '0.1',
    status: 'sending',
    type: 'TOP',
    address: 'TOP',
    symbol: 'TOP',
    txMethod2: method2,
  }
  if (
    data.amount &&
    (data.txMethod === 'stakeVote' || data.txMethod === 'unstakeVote')
  ) {
    saveData.amount = topAmount
    saveData.amountShow = topAmount
  }
  delete data.txMethod
  let params = JSON.stringify(data)
  if (params.length > 30) {
    params = params.substring(0, 30) + '...'
  }
  saveData.params = params
  await saveDataToTxList(saveData)
  return txHash
}

export async function waitTxSuccess(
  txHash: string,
  address: string,
  TX_TIMES = 105
) {
  const topjs = await getTopJs()
  return new Promise((resolve, reject) => {
    let times = TX_TIMES
    const intervalId = setInterval(() => {
      times--
      if (times < 0) {
        clearInterval(intervalId)
        updateTxStatus(txHash, address, 'failure')
        reject('timeout')
        return
      }
      topjs
        .getTransaction({
          txHash,
        })
        .then((r: any) => {
          if (r.errno !== 0) {
            return
          }
          let tx_state = r.data.tx_state
          if (tx_state === 'fail') {
            tx_state = 'failure'
          }
          if (tx_state !== 'success' && tx_state !== 'failure') {
            return
          }
          clearInterval(intervalId)
          let used_deposit = 0
          try {
            used_deposit =
              r.data.tx_consensus_state.send_block_info.used_deposit
          } catch (error) {
            try {
              used_deposit =
                r.data.tx_consensus_state.confirm_block_info.used_deposit
            } catch (error) {}
          }
          if (used_deposit > 0) {
            used_deposit = used_deposit / 10 ** 6
          }
          updateTxStatus(txHash, address, tx_state, used_deposit)
          if (tx_state === 'success') {
            return resolve(tx_state)
          }
          reject(tx_state)
        })
    }, 2000)
  })
}

export async function updateTxStatus(
  txHash: string,
  address: string,
  toState: ITxStatus,
  gas?: number | string
) {
  topialog('updateTxStatus', { txHash, address, toState, gas })
  const txListRes = await storageGet<{ txList: ITxList }>(['txList'])
  const tmpList = txListRes.txList[address] || []
  const txItem = tmpList.filter((item) => item.txHash === txHash)[0]
  if (txItem) {
    txItem.status = toState
    if (gas) {
      txItem.fee = gas
    }
    txListRes.txList[address] = tmpList
    await storageSet<{ txList: ITxList }>({ txList: txListRes.txList })
    sendTxChangeEvent()
  }
}

export async function getSelectChainKey() {
  const res = await storageGet<{
    chainType: IChainType
  }>(['chainType'])
  return `${res.chainType}_0}`
}

export function waitFilSuccess(
  txHash: string,
  address: string,
  TX_TIMES = 160
) {
  const client = getFilClient()
  let times = TX_TIMES
  const intervalId = setInterval(async () => {
    times--
    if (times < 0) {
      clearInterval(intervalId)
      updateTxStatus(txHash, address, 'failure')
      return
    }
    try {
      const res2 = await (client as any).stateSearchMsg({
        '/': txHash,
      })
      if (res2) {
        if (res2.Receipt.ExitCode === 0) {
          updateTxStatus(txHash, address, 'success')
        } else {
          updateTxStatus(txHash, address, 'failure')
        }
        clearInterval(intervalId)
      }
    } catch (error) {
      topialog(error)
    }
  }, 5000)
}

export async function recheckFailureFilTx(txHash: string, address: string) {
  try {
    const client = getFilClient()
    const res2 = await (client as any).stateSearchMsg({
      '/': txHash,
    })
    if (res2 && res2.Receipt.ExitCode === 0) {
      updateTxStatus(txHash, address, 'success')
    }
  } catch (error) {
    topialog(error)
  }
}

export async function saveDataToTxList(saveData: ITxItem) {
  const txListRes = await storageGet<{ txList: ITxList }>(['txList'])
  const selectChainKey = await getSelectChainKey()
  const chainType = await getChainType()
  const account = await getAccount(() => {}, saveData.v === 'v2')
  const key = `${account.address}_${selectChainKey}`
  const tmpList = txListRes.txList[key] || []
  saveData.mainSymbol = defaultData.chainList[chainType].chainList[0].symbol
  saveData.time = saveData.time || Date.now()
  tmpList.unshift(saveData)
  const tmpList2 = []
  let successCount = 0
  for (let index = 0; index < tmpList.length; index++) {
    const element = tmpList[index]
    if (element.status !== 'sending') {
      successCount++
    }
    if (successCount > 30 && element.status !== 'sending') {
      return
    }
    tmpList2.push(element)
  }
  txListRes.txList[key] = tmpList2
  await storageSet<{ txList: ITxList }>({ txList: txListRes.txList })
  if (chainType === 'FIL') {
    waitFilSuccess(saveData.txHash, key, 160)
  } else if (chainType === 'TOP' || saveData.v === 'v2') {
    waitTxSuccess(saveData.txHash, key, saveData.time)
  } else {
    waitEthTxSuccess(saveData.txHash, key, saveData.time)
  }
}
