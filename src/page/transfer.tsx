import { observer } from 'mobx-react-lite'
import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  onAccountChange,
  onChainChange,
  onSendTxHash,
  onDataSuccess,
} from '../lib/appPort'
import { useEffect, useState } from 'react'
import styles from '../styles/transfer.module.scss'
import Input from '../components/Input'
import Button from '../components/Button'
import top from '../assets/images/top.svg'
import questionCircle from '../assets/images/question-circle-filled.svg'

import { useStore } from '../store'
import BigNumber from 'bignumber.js'
import Modal from '../components/Modal'
import { accuracy, checkTOPAddr, scala } from '../lib'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { topGasFee } from '../top'
import { toast } from 'react-toastify'
import { track } from '../lib/track'
import { topialog } from '../lib/log'
import Textarea from '../components/Textarea'
import { send } from '../app/tx'
import { resetSdjsk } from '../app/background'
import LedgerConfirm from '../components/LedgerConfirm'
import { ethAddressToTop } from '../app/utils'

function isNumberFormat(value: any) {
  if (value === '') {
    return true
  }
  return value.match(/^\d*\.?\d*$/)
}

function Transfer() {
  const { accountStore, globalStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)

  const [disabled, setDisabled] = useState(false)

  const [toAddress, setToAddress] = useState('')
  const [toAddressError, setToAddressError] = useState('')

  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')

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
    if (sequence_id) {
      setDisabled(true)
      setToAddress(searchParams.get('to') || '')
      setNote(searchParams.get('note') || '')
      setAmount(accuracy(searchParams.get('amount') || '', 6, 6) + '')
    }
  }, [searchParams])

  useEffect(() => {
    const max = new BigNumber(accountStore.balanceCoin).minus(0.1)
    if (Number(amount) < 0) {
      return setAmountError(getLocaleMessage('InsufficientBalance'))
    }
    if (new BigNumber(amount).isGreaterThan(max)) {
      setAmountError(getLocaleMessage('InsufficientBalance1'))
    } else {
      setAmountError('')
    }
  }, [amount, accountStore.balanceCoin])

  useEffect(() => {
    setToAddressError('')
  }, [toAddress])

  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')

  useEffect(() => {
    if (note.length > 128) {
      setNoteError(getLocaleMessage('RemarkInformation128'))
    } else {
      setNoteError('')
    }
  }, [note])

  const [fee, setFee] = useState('0')

  useEffect(() => {
    topGasFee().then((d) => setFee(d + ''))
  }, [])

  const [showModal, setShowModal] = useState(false)

  function onCancel() {
    navigate(-1)
  }

  function inputOnBlurCheckAddress() {
    if (!toAddress) {
      return
    }
    if (!checkTOPAddr(ethAddressToTop(toAddress))) {
      setToAddressError(getLocaleMessage('IncorrectAddressFormat'))
      return
    }
    if (
      toAddress.toLowerCase() ===
      accountStore.currentAccount.address.toLowerCase()
    ) {
      setToAddressError(getLocaleMessage('SenderRecipientNotBeSame'))
      return
    }
  }

  async function handleConfirmClick() {
    try {
      if (!checkTOPAddr(ethAddressToTop(toAddress))) {
        setToAddressError(getLocaleMessage('IncorrectAddressFormat'))
        return
      }
      if (
        toAddress.toLowerCase() ===
        accountStore.currentAccount.address.toLowerCase()
      ) {
        setToAddressError(getLocaleMessage('SenderRecipientNotBeSame'))
        return
      }
      if (amount === '') {
        setAmountError(getLocaleMessage('IncorrectAmountPleaseEnterAgain'))
        return
      }
      const max = new BigNumber(accountStore.balanceCoin).minus(0.1)
      if (Number(amount) < 0) {
        return setAmountError(getLocaleMessage('InsufficientBalance'))
      }
      if (new BigNumber(amount).isGreaterThan(max)) {
        setAmountError(getLocaleMessage('InsufficientBalance1'))
        return
      }
      if (note.length > 128) {
        setNoteError(getLocaleMessage('RemarkInformation128'))
        return
      }
      setLoading(true)
      sendTransferTx()
    } catch (error) {
      toast.error('Error')
      setLoading(false)
    }
  }

  async function sendTransferTx() {
    try {
      const sendData: any = {
        fee,
        amount: scala(amount, 6),
        amountShow: amount,
        note,
        txMethod: 'transfer',
        to: toAddress,
      }
      const sequence_id = searchParams.get('sequence_id')
      let txHash
      resetSdjsk(globalStore.tmpData)
      await send(sendData, (hash: string) => {
        txHash = hash
        onSendTxHash({ hash, sequence_id })
      })
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
      }
    } catch (error) {
      toast.error((error as any).message)
      topialog(error)
      setLoading(false)
    }
  }

  // async function handlePaste() {
  //   clipboard.readText().then((text) => {
  //     setToAddress(text)
  //   })
  // }

  function all() {
    const all = new BigNumber(accountStore.balanceCoin).minus(0.1)
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
                  disabled={disabled}
                  onBlur={inputOnBlurCheckAddress}
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
                  <img src={top} alt="icon"></img>
                  TOP
                </div>
                <div>
                  <span>
                    <FormatMessage id="Balance"></FormatMessage>:{' '}
                    {accountStore.balanceFormated}
                  </span>
                  <img
                    onClick={() => setShowModal(true)}
                    className={styles.queIcon}
                    src={questionCircle}
                    alt="question"
                  ></img>
                </div>
              </div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Amount"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input
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
                <FormatMessage id="Remark"></FormatMessage>
              </div>
              <div className={styles.inputWrap}>
                <Input
                  disabled={disabled}
                  value={note}
                  onChange={(e: any) => setNote(e.target.value)}
                  placeholder={getLocaleMessage('PleaseEnterTheRemark')}
                ></Input>
              </div>
              <div className={styles.error}>{noteError}</div>
            </div>
            <div className={styles.formitem}>
              <div className={styles.label}>
                <FormatMessage id="Fee"></FormatMessage>
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

export default observer(Transfer)
