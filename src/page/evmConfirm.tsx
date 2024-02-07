import { observer } from 'mobx-react-lite'
import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { onAccountChange, onChainChange, onDataSuccess } from '../lib/appPort'
import { useCallback, useEffect, useState } from 'react'
import styles from '../styles/transfer.module.scss'
import Input from '../components/Input'
import Button from '../components/Button'

import { useStore } from '../store'
import BigNumber from 'bignumber.js'
import Modal from '../components/Modal'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { toast } from 'react-toastify'
import { topialog } from '../lib/log'
import { getWeb3, sendEvmConfirmTx } from '../eth'
import Textarea from '../components/Textarea'
import { accuracy } from '../lib'
import { getChainTypeDecimals } from '../app/utils'
import { ethRpcFetch } from '../app/ethRpc'
import LedgerConfirm from '../components/LedgerConfirm'
import { getEthToTopExchangeRatio } from '../top'
import AccountStore from '../store/accountStore'
import { track } from '../lib/track'

function getMax(accountStore: AccountStore, fee: string) {
  const max = new BigNumber(accountStore.balanceCoin).minus(new BigNumber(fee))
  return max
}

type TxObject = {
  value: number | undefined
  from: string
  to: string
  data: string
  gas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
}

function EvmConfirm() {
  const { accountStore, globalStore, chainStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()

  const [txParams, setTxParams] = useState<TxObject>({} as TxObject)

  const [loading, setLoading] = useState(false)

  const [disabled, setDisabled] = useState(false)

  const [toAddressError, setToAddressError] = useState('')

  const [amountError, setAmountError] = useState('')

  const [feeError, setFeeError] = useState('')

  useEffect(() => {
    function handleChange() {
      navigate('/')
    }
    const clear1 = onAccountChange(handleChange)
    const clear2 = onChainChange(handleChange)
    return () => {
      clear1()
      clear2()
    }
  }, [navigate])

  useEffect(() => {
    const sequence_id = searchParams.get('sequence_id')
    const params = searchParams.get('params') || ''
    if (sequence_id) {
      setDisabled(true)
      const tmpParma = JSON.parse(decodeURIComponent(params) || '[]')[0]
      setTxParams(tmpParma)
    }
  }, [searchParams])
  const [fee, setFee] = useState('0')

  const calFee = useCallback(
    async function calFee() {
      if (!txParams.to) {
        return '0'
      }
      const web3 = await getWeb3()
      const block = await web3.eth.getBlock('latest')
      const maxPriorityFeePerGas = await ethRpcFetch({
        jsonrpc: '2.0',
        method: 'eth_maxPriorityFeePerGas',
        id: 1,
      })
      let ratio = 1
      if (accountStore.chainType === 'TOPEVM') {
        ratio = await getEthToTopExchangeRatio()
      }
      const calFee = accuracy(
        new BigNumber(
          txParams.maxFeePerGas
            ? txParams.maxFeePerGas
            : new BigNumber(block.baseFeePerGas || '1').plus(
                txParams.maxPriorityFeePerGas ||
                  maxPriorityFeePerGas.result ||
                  '0x0'
              )
        )
          .times(txParams.gas)
          .times(ratio),
        18,
        9,
        true
      ) as string
      setFee(calFee)
      setFeeError('')
      return calFee
    },
    [txParams, accountStore.chainType]
  )

  useEffect(() => {
    calFee()
  }, [txParams, calFee])

  const [showModal, setShowModal] = useState(false)

  async function onCancel() {
    const sequence_id = searchParams.get('sequence_id')
    await onDataSuccess({
      sequence_id,
      data: {
        code: 4001,
        message: 'Cancel, User Rejected Request',
        data: 'Cancel, User Rejected Request',
      },
    })
    window.close()
  }

  async function handleConfirmClick() {
    setLoading(true)
    const fee1 = await calFee()
    const max = getMax(accountStore, fee1)
    if (Number(max.toFixed(10)) < 0) {
      setLoading(false)
      return toast.error(getLocaleMessage('InsufficientBalance1'))
    }
    // if (new BigNumber(txParams.value || 0).isGreaterThan(max)) {
    //   setAmountError(getLocaleMessage('InsufficientBalance1'))
    //   return
    // }
    sendTransferTx(fee1)
  }

  async function sendTransferTx(fee1: string) {
    try {
      const txHash = await sendEvmConfirmTx(txParams, globalStore.tmpData, {
        amountShow:
          txParams.value && accountStore.chainType !== 'TOPEVM'
            ? accuracy(txParams.value, 18, 9)
            : '0',
        fee: fee1,
      })
      try {
        track({
          event: 'transfer',
          to: txParams.to,
          from: accountStore.currentAccount.address,
          value: txParams.value,
          tx_hash: txHash,
        })
      } catch (error) {}
      const sequence_id = searchParams.get('sequence_id')
      await onDataSuccess({ sequence_id, data: txHash })
      window.close()
    } catch (error) {
      toast.error((error as any).message)
      topialog(error)
      setLoading(false)
    }
  }

  return (
    <>
      <main>
        <Nav>
          {txParams.data && txParams.data.startsWith('0x095ea7b3') ? (
            'Approve'
          ) : (
            <FormatMessage id="ContractInteraction"></FormatMessage>
          )}
        </Nav>
        <div className={styles.transfer}>
          <div className={styles.formwrap}>
            <div className={styles.formitem}>
              <div className={styles.label}>From</div>
              <div className={styles.inputWrap}>
                <Textarea
                  value={txParams.from}
                  placeholder={getLocaleMessage('PleaseEnterPaymentAddress')}
                ></Textarea>
              </div>
              <div className={styles.error}>{toAddressError}</div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>To</div>
              <div className={styles.inputWrap}>
                <Textarea
                  value={txParams.to}
                  placeholder={getLocaleMessage('PleaseEnterPaymentAddress')}
                ></Textarea>
              </div>
              <div className={styles.error}>{toAddressError}</div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Amount"></FormatMessage> (
                {
                  chainStore.chainListAll[accountStore.chainType].chainList[0]
                    .symbol
                }
                )
              </div>
              <div className={styles.inputWrap}>
                <Input
                  value={
                    txParams.value && accountStore.chainType !== 'TOPEVM'
                      ? accuracy(txParams.value, 18, 9)
                      : '0'
                  }
                  placeholder={getLocaleMessage('PleaseEnterTheTransferAmount')}
                ></Input>
              </div>
              <div className={styles.error}>{amountError}</div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Data"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input value={txParams.data}></Input>
              </div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Fee1"></FormatMessage> (
                {
                  chainStore.chainListAll[accountStore.chainType].chainList[0]
                    .symbol
                }
                )
              </div>
              <div className={styles.inputWrap}>
                <Input value={fee}></Input>
              </div>
              <div className={styles.error}>{feeError}</div>
            </div>
          </div>
          {accountStore.currentAccount.isLedger && (
            <LedgerConfirm></LedgerConfirm>
          )}
          <div className={styles.btns}>
            <div>
              <Button
                type="primary"
                loading={loading}
                onClick={handleConfirmClick}
              >
                <FormatMessage id="OK"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button onClick={onCancel} type="default">
                <FormatMessage id="Cancel"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
        <Modal
          shouldCloseOnOverlayClick={true}
          open={showModal}
          onClose={() => setShowModal(false)}
          showClose={false}
          title=""
        >
          <div className={styles.modalContent}>
            <div className={styles.desc}>
              <FormatMessage id="Note01TOP"></FormatMessage>
            </div>
          </div>
        </Modal>
      </main>
    </>
  )
}

export default observer(EvmConfirm)
