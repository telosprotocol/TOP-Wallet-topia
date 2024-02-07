import { observer } from 'mobx-react-lite'
import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { onAccountChange, onChainChange, onDataSuccess } from '../lib/appPort'
import { useCallback, useEffect, useRef, useState } from 'react'
import styles from '../styles/transfer.module.scss'
import Input from '../components/Input'
import Button from '../components/Button'
import fil from '../assets/images/fil.png'

import { useStore } from '../store'
import BigNumber from 'bignumber.js'
import Modal from '../components/Modal'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { toast } from 'react-toastify'
import { checkFilAddr, filGasFee } from '../fil'
import { sendFilTx } from '../fil/filSign'
import { track } from '../lib/track'
import Textarea from '../components/Textarea'
import { getWeb3 } from '../eth'
import { delegatedFromEthAddress, CoinType } from '@glif/filecoin-address'
import LedgerConfirm from '../components/LedgerConfirm'

function isNumberFormat(value: string) {
  if (value === '') {
    return true
  }
  return value.match(/^\d*\.?\d*$/)
}

function FilTransfer() {
  const { accountStore, globalStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)

  const [disabled, setDisabled] = useState(false)

  const [toAddress, setToAddress] = useState('')
  const [toAddressError, setToAddressError] = useState('')

  const [realToAddress, setRealToAddress] = useState('')

  useEffect(() => {
    async function init() {
      const web3 = await getWeb3()
      if (web3.utils.isAddress(toAddress)) {
        setRealToAddress(delegatedFromEthAddress(toAddress, CoinType.MAIN))
      } else {
        setRealToAddress(toAddress)
      }
    }
    init()
  }, [toAddress])

  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')

  const [fee, setFee] = useState('0')

  const seqIdRef = useRef<string>('')

  useEffect(() => {
    function handleChange() {
      if (seqIdRef.current) {
        window.close()
      } else {
        navigate('/')
      }
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
    if (sequence_id) {
      setDisabled(true)
      setToAddress(searchParams.get('to') || '')
      setAmount(String(searchParams.get('amount')))
      seqIdRef.current = sequence_id
    }
  }, [searchParams])

  useEffect(() => {
    const max = new BigNumber(accountStore.balanceCoin).minus(fee)
    if (Number(amount) < 0) {
      return setAmountError(getLocaleMessage('InsufficientBalance'))
    }
    if (new BigNumber(amount).isGreaterThan(max)) {
      setAmountError(getLocaleMessage('InsufficientBalance1'))
    } else {
      setAmountError('')
    }
  }, [amount, accountStore.balanceCoin, fee])

  useEffect(() => {
    setToAddressError('')
  }, [realToAddress])

  const calGasFee = useCallback(() => {
    if (checkFilAddr(realToAddress) && amount !== '') {
      filGasFee(accountStore.currentAccount.address, realToAddress, amount).then(
        (d) => setFee(String(d.gas))
      )
    }
  }, [realToAddress, amount, accountStore.currentAccount.address])

  useEffect(() => {
    calGasFee()
  }, [calGasFee])

  const [showModal, setShowModal] = useState(false)

  function onCancel() {
    if (seqIdRef.current) {
      window.close()
    } else {
      navigate('/')
    }
  }

  function inputOnBlurCheckAddress() {
    if (!realToAddress) {
      return
    }
    if (!checkFilAddr(realToAddress)) {
      setToAddressError(getLocaleMessage('IncorrectAddressFormat'))
      return
    }
    if (
      realToAddress.toLowerCase() ===
      accountStore.currentAccount.address.toLowerCase()
    ) {
      setToAddressError(getLocaleMessage('SenderRecipientNotBeSame'))
      return
    }
  }

  async function handleConfirmClick() {
    try {
      if (!checkFilAddr(realToAddress)) {
        setToAddressError(getLocaleMessage('IncorrectAddressFormat'))
        return
      }
      if (
        realToAddress.toLowerCase() ===
        accountStore.currentAccount.address.toLowerCase()
      ) {
        setToAddressError(getLocaleMessage('SenderRecipientNotBeSame'))
        return
      }
      if (amount === '') {
        setAmountError(getLocaleMessage('IncorrectAmountPleaseEnterAgain'))
        return
      }
      if (
        new BigNumber(amount).isGreaterThan(Number(accountStore.balanceCoin))
      ) {
        setAmountError(getLocaleMessage('InsufficientBalance1'))
        return
      }
      setLoading(true)
      const gasFee = await filGasFee(
        accountStore.currentAccount.address,
        realToAddress,
        amount
      )
      setFee(String(gasFee.gas))
      const max = new BigNumber(accountStore.balanceCoin).minus(
        Number(gasFee.gas)
      )
      if (Number(amount) < 0) {
        setLoading(false)
        return setAmountError(getLocaleMessage('InsufficientBalance'))
      }
      if (new BigNumber(amount).isGreaterThan(max)) {
        setAmountError(getLocaleMessage('InsufficientBalance1'))
        setLoading(false)
        return
      }
      sendTransferTx(globalStore.tmpData, gasFee.msg)
    } catch (error: any) {
      toast.error(error.message || 'Error')
      setLoading(false)
    }
  }

  async function sendTransferTx(pass: string, msg: any) {
    try {
      const sendData = {
        from: accountStore.currentAccount.address,
        pass,
        fee,
        value: amount,
        amountShow: amount,
        to: toAddress.toLowerCase(),
      }
      const sequence_id = searchParams.get('sequence_id')
      const txHash = await sendFilTx(sendData, msg)
      track({
        event: 'transfer',
        to: toAddress,
        from: accountStore.currentAccount.address,
        value: amount,
        tx_hash: txHash,
      })
      if (sequence_id) {
        await onDataSuccess({ sequence_id, data: txHash })
        window.close()
      } else {
        accountStore.setHomeSelectTab(2)
        accountStore.updateTxList()
        navigate('/')
        globalStore.setTmpData('')
      }
    } catch (error) {
      toast.error((error as any).message)
      console.log(error)
      setLoading(false)
    }
  }

  function all() {
    const all = new BigNumber(accountStore.balanceCoin)
    if (Number(all) < 0) {
      setAmount('0')
    } else {
      setAmount(String(all))
    }
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="Transfer"></FormatMessage>
        </Nav>
        <div className={styles.transfer}>
          <div className={styles.formwrap}>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="TransferTo"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Textarea
                  onBlur={() => {
                    calGasFee()
                    inputOnBlurCheckAddress()
                  }}
                  disabled={disabled}
                  value={toAddress}
                  onChange={(e: any) => setToAddress(e.target.value)}
                  placeholder={getLocaleMessage('PleaseEnterPaymentAddress')}
                ></Textarea>
                {/* {!disabled && (
                  <span
                    className={styles.rightBtn}
                    onClick={() => handlePaste()}
                  >
                    <FormatMessage id="Paste"></FormatMessage>
                  </span>
                )} */}
              </div>
              <div className={styles.error}>{toAddressError}</div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Token"></FormatMessage>
              </div>
              <div className={`${styles.inputWrap} ${styles.iconType}`}>
                <div>
                  <img
                    src={fil}
                    alt="icon"
                    style={{ width: '40px', height: '40px' }}
                  ></img>
                  FIL
                </div>
                <div>
                  <span>
                    <FormatMessage id="Balance"></FormatMessage>:{' '}
                    {accountStore.balanceFormated}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Amount"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input
                  onBlur={calGasFee}
                  disabled={disabled}
                  value={amount}
                  onChange={(e: any) => {
                    const v = e.target.value
                    if (isNumberFormat(v)) {
                      if (v.toString().indexOf('.') > -1) {
                        if (v.toString().split('.')[1].length > 6) {
                          return
                        }
                      }
                      setAmount(e.target.value)
                    }
                  }}
                  placeholder={getLocaleMessage('PleaseEnterTheTransferAmount')}
                ></Input>
                {!disabled && (
                  <span className={styles.rightBtn} onClick={all}>
                    <FormatMessage id="All"></FormatMessage>
                  </span>
                )}
              </div>
              <div className={styles.error}>{amountError}</div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="FeeFil"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input value={fee}></Input>
              </div>
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

export default observer(FilTransfer)
