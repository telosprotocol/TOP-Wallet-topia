/* eslint-disable no-whitespace-before-property */
import { getFilClient } from '.'
import { getAccount } from '../app/account'
import { Decrypt } from '../lib/aes'
import { saveDataToTxList } from '../app/tx'
import { ITxItem } from '../types'
import { getTransport } from '../ledger'
import AppFilecoin from '../ledger/filecoin'

export async function sendFilTx(
  data: {
    from: string
    to: string
    value: string
    pass: string
    fee: string
    amountShow: string
  },
  msg: any
) {
  const client = getFilClient()
  const account = await getAccount(() => {})
  let signedMessage
  if (account.isLedger) {
    const transport = await getTransport()
    const appFilecoin = new AppFilecoin(transport)
    const signRes = await appFilecoin.sign(
      `m/44'/461'/${account.pathIndex}'/0/0`,
      msg
    )
    if (signRes.error_message !== 'No errors') {
      throw new Error(signRes.error_message)
    }
    signedMessage = {
      Signature: {
        Data: signRes.signature_compact.toString('base64'),
        Type: 1,
      },
    }
  } else {
    signedMessage = msg
  }

  const cid = await client.mpoolPush({
    Message: {
      Version: msg.Version,
      From: msg.From,
      GasLimit: msg.GasLimit,
      GasFeeCap: msg.GasFeeCap,
      GasPremium: msg.GasPremium,
      Method: msg.Method,
      Nonce: msg.Nonce,
      Params: msg.Params,
      To: msg.To,
      Value: msg.Value,
    },
    Signature: {
      Data: signedMessage.Signature.Data,
      Type: signedMessage.Signature.Type,
    },
  })
  const saveData: ITxItem = {
    amount: Number(data.value),
    to: data.to,
    realTo: data.to,
    from: account.address,
    txHash: String(cid['/']),
    time: new Date().getTime(),
    fee: Number(data.fee),
    status: 'sending',
    amountShow: Number(data.amountShow),
    type: 'FIL',
    address: 'FIL',
    symbol: 'FIL',
  }
  await saveDataToTxList(saveData)

  return cid['/']
}
