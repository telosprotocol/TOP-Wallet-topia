import { observer } from 'mobx-react-lite'
import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { onAccountChange, onChainChange } from '../lib/appPort'
import { useEffect, useState } from 'react'
import styles from '../styles/transfer.module.scss'
import Input from '../components/Input'
import Button from '../components/Button'
import fil from '../assets/images/fil.png'
import top from '../assets/images/top.svg'

import { useStore } from '../store'
import BigNumber from 'bignumber.js'
import { accuracy, scala } from '../lib'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { Select2 } from '../components/Select2'
import useTokenList from '../hooks/useTokenList'
import TokenLogo from '../components/TokenLogo'
import { ITokenItem } from '../types'
import {
  getErc20EtherContract,
  getMaxFeePerGas,
  getWeb3,
  transferEth,
  transferETHErc20,
} from '../eth'
import { toast } from 'react-toastify'
import { topialog } from '../lib/log'
import AccountStore from '../store/accountStore'
import { ethRpcFetch } from '../app/ethRpc'
import { resetSdjsk } from '../app/background'
import { checkFilAddr, filAddressToEthAddress } from '../fil'
import Textarea from '../components/Textarea'
import {
  ethAddressToTop,
  t8TopToEthAddress,
  topAddressToEth,
} from '../app/utils'
import LedgerConfirm from '../components/LedgerConfirm'
import { getEthToTopExchangeRatio, topGasFee } from '../top'
import { send } from '../app/tx'
import { track } from '../lib/track'

let gasLimit1 = '0'

function isNumberFormat(value: string) {
  if (value === '') {
    return true
  }
  return value.match(/^\d*\.?\d*$/)
}

function getMax(
  transferSymbol: string,
  tokenList: ITokenItem[],
  accountStore: AccountStore,
  fee: string
) {
  // top native token
  if (transferSymbol === 'TOPEVM' && accountStore.chainType === 'TOPEVM') {
    return new BigNumber(accountStore.balanceCoin).minus(0.1)
  }
  let max
  if (transferSymbol === accountStore.chainType) {
    max = new BigNumber(accountStore.balanceCoin).minus(new BigNumber(fee))
  } else {
    const tokenItem = tokenList.filter(
      (item) => item.address === transferSymbol
    )[0]
    if (tokenItem && tokenItem.accBalance1) {
      max = new BigNumber(tokenItem.accBalance1)
    } else {
      max = new BigNumber(0)
    }
  }
  return max
}

function EvmTransfer() {
  const tokenList = useTokenList()

  const { accountStore, globalStore, chainStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)

  const [disabled, setDisabled] = useState(false)

  const [toAddress, setToAddress] = useState('')
  const [toAddressError, setToAddressError] = useState('')

  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState('')

  const [baseFee, setBaseFee] = useState(0)

  const [transferSymbol, setTransferSymbol] = useState<string>(
    accountStore.chainType
  )

  const [feeError, setFeeError] = useState('')

  const [fee, setFee] = useState('0')
  const [gasLimit, setGasLimit] = useState('0')

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
      // setToAddress(searchParams.get('to'))
      // setAmount(accuracy(searchParams.get('amount'), 6, 6))
    }
    const address = searchParams.get('address')
    if (address) {
      setTransferSymbol(address)
    }
  }, [searchParams])

  useEffect(() => {
    setAmountError('')
  }, [amount])

  useEffect(() => {
    const max = getMax(transferSymbol, tokenList, accountStore, fee)
    if (Number(amount) < 0) {
      return setAmountError(getLocaleMessage('InsufficientBalance'))
    }
    if (new BigNumber(amount).isGreaterThan(max)) {
      setAmountError(getLocaleMessage('InsufficientBalance1'))
    }
  }, [
    amount,
    accountStore.balanceCoin,
    transferSymbol,
    tokenList,
    accountStore,
    toAddress,
    fee,
  ])

  useEffect(() => {
    setToAddressError('')
  }, [toAddress])

  useEffect(() => {
    if (!amount && transferSymbol !== accountStore.chainType) {
      setFee('0')
      setFeeError('')
      return
    }
    let realNeed = Number(fee)
    if (transferSymbol === accountStore.chainType) {
      realNeed = realNeed + Number(amount)
    }
    if (Number(accountStore.balanceCoin) < realNeed) {
      setFeeError(getLocaleMessage('InsufficientBalance1'))
    } else {
      setFeeError('')
    }
  }, [
    fee,
    transferSymbol,
    amount,
    accountStore.balanceCoin,
    accountStore.chainType,
  ])

  // fil and top
  async function checkIsAddress(toAddress: string) {
    const web3 = await getWeb3()
    if (accountStore.chainType === 'TOPEVM') {
      return (
        web3.utils.isAddress(topAddressToEth(toAddress)) ||
        web3.utils.isAddress(t8TopToEthAddress(toAddress))
      )
    } else {
      return web3.utils.isAddress(toAddress) || checkFilAddr(toAddress)
    }
  }

  async function calFee() {
    if (!amount && transferSymbol !== accountStore.chainType) {
      setFee('0')
      setFeeError('')
      return '0'
    }
    const isAddressFormat = await checkIsAddress(toAddress)
    if (!isAddressFormat) {
      setFee('0')
      setFeeError('')
      return '0'
    }
    if (transferSymbol === 'TOPEVM' && accountStore.chainType === 'TOPEVM') {
      const f = await topGasFee()
      setFee(f + '')
      return f + ''
    }
    const web3 = await getWeb3()
    const block = await web3.eth.getBlock('latest')
    setBaseFee(block.baseFeePerGas || 0)
    const maxPriorityFeePerGas = await ethRpcFetch({
      jsonrpc: '2.0',
      method: 'eth_maxPriorityFeePerGas',
      id: 1,
    })
    const maxFeePerGas = await getMaxFeePerGas()
    let toAddress1: any = toAddress
    if (accountStore.chainType === 'FEVM') {
      if (checkFilAddr(toAddress)) {
        toAddress1 = await filAddressToEthAddress(toAddress)
      }
    } else {
      toAddress1 = topAddressToEth(toAddress)
    }
    let estimation = 2100000
    if (
      transferSymbol !== accountStore.chainType ||
      transferSymbol === 'TOPEVM'
    ) {
      // erc 20
      let balance: any = tokenList.filter(
        (item) => item.address === transferSymbol
      )[0].balance
      let tmpTransferSymbol = transferSymbol
      const contract = await getErc20EtherContract(
        tmpTransferSymbol,
        globalStore.tmpData
      )
      const tmpEestimation = await contract.estimateGas.transfer(
        toAddress1,
        balance,
        {
          maxPriorityFeePerGas: maxPriorityFeePerGas.result || '0x0',
          maxFeePerGas,
        }
      )
      estimation = Number(tmpEestimation.toString()) * 1.5
    } else {
      // eth
      const tmpEestimation = await web3.eth.estimateGas({
        to: toAddress1,
        value: '1',
        from: topAddressToEth(accountStore.currentAccount.address),
      })
      estimation = Number(tmpEestimation.toString()) * 1.5
    }
    gasLimit1 = Math.ceil(estimation).toString()
    setGasLimit(gasLimit1)
    let ratio = 1
    if (transferSymbol === 'TOPEVM' || accountStore.chainType === 'TOPEVM') {
      ratio = await getEthToTopExchangeRatio()
    }

    const calFee = accuracy(
      new BigNumber(
        new BigNumber(block.baseFeePerGas || '1').plus(
          maxPriorityFeePerGas.result || '0x0'
        )
      )
        .times(estimation)
        .times(1)
        .times(ratio),
      18,
      9,
      true
    ) as string
    setFee(calFee)
    setFeeError('')
    return calFee
  }

  function onCancel() {
    navigate(-1)
  }

  async function handleConfirmClick() {
    setLoading(true)
    const isAddressFormat = await checkIsAddress(toAddress)
    if (!isAddressFormat) {
      setToAddressError(getLocaleMessage('IncorrectAddressFormat'))
      setLoading(false)
      return
    }
    if (
      toAddress.toLowerCase() ===
        accountStore.currentAccount.address.toLowerCase() ||
      ethAddressToTop(toAddress).toLowerCase() ===
        accountStore.currentAccount.address.toLowerCase()
    ) {
      setToAddressError(getLocaleMessage('IncorrectAddressFormat'))
      setLoading(false)
      return
    }
    if (amount === '') {
      setAmountError(getLocaleMessage('IncorrectAmountPleaseEnterAgain'))
      setLoading(false)
      return
    }
    // if (
    //   transferSymbol === 'TOPEVM' &&
    //   accountStore.chainType === 'TOPEVM' &&
    //   accountStore.currentAccount.isLedger
    // ) {
    //   toast.error(<FormatMessage id="LedgerNotSupport"></FormatMessage>)
    //   setLoading(false)
    //   return
    // }
    const fee1 = await calFee()
    if (
      fee1 === '0' &&
      !(transferSymbol === 'TOPEVM' && accountStore.chainType === 'TOPEVM')
    ) {
      setLoading(false)
      return
    }
    const max = getMax(transferSymbol, tokenList, accountStore, fee1)
    if (Number(amount) < 0) {
      setLoading(false)
      return setAmountError(getLocaleMessage('InsufficientBalance'))
    }
    if (new BigNumber(amount).isGreaterThan(max)) {
      setAmountError(getLocaleMessage('InsufficientBalance1'))
      setLoading(false)
      return
    }
    sendTransferTx(fee1)
  }

  async function sendTransferTx(fee1: string) {
    try {
      resetSdjsk(globalStore.tmpData)
      let realToAddress = toAddress
      if (accountStore.chainType === 'TOPEVM') {
        realToAddress = ethAddressToTop(toAddress)
      }
      if (transferSymbol === 'TOPEVM' && accountStore.chainType === 'TOPEVM') {
        const sendData = {
          fee: fee1,
          amount: scala(amount, 6),
          amountShow: amount,
          note: '',
          txMethod: 'transfer',
          to: realToAddress,
        }
        await send(sendData, (hash: string) => {
          accountStore.setHomeSelectTab(2)
          accountStore.updateTxList()
          try {
            track({
              event: 'transfer',
              to: toAddress,
              from: accountStore.currentAccount.address,
              value: amount,
              tx_hash: hash,
            })
          } catch (error) {}
          navigate('/')
        })
        return
      }
      if (
        transferSymbol === accountStore.chainType &&
        transferSymbol !== 'TOPEVM'
      ) {
        const sendData = {
          fee: fee1,
          gasLimit: gasLimit1,
          baseFee,
          amount: scala(amount, 18),
          amountShow: amount,
          txMethod: 'transfer',
          to: realToAddress,
          realDecimals: 18,
        }
        await transferEth(sendData, (hash: string) => {
          accountStore.setHomeSelectTab(2)
          accountStore.updateTxList()
          try {
            track({
              event: 'transfer',
              to: toAddress,
              from: accountStore.currentAccount.address,
              value: amount,
              tx_hash: hash,
            })
          } catch (error) {}
          navigate('/')
        })
      } else {
        let tmpTransferSymbol = transferSymbol
        let realSymbol = tokenList.filter(
          (item) => item.address === transferSymbol
        )[0].symbol
        let realDecimals = tokenList.filter(
          (item) => item.address === transferSymbol
        )[0].decimals
        const sendData = {
          to: tmpTransferSymbol,
          value: '0x0',
          amountShow: amount,
          realTo: realToAddress,
          waitSuccess: false,
          realDecimals,
          gasLimit: gasLimit1,
          fee: fee1,
          address: transferSymbol,
          symbol: realSymbol,
        }
        await transferETHErc20(sendData, () => {
          accountStore.setHomeSelectTab(2)
          accountStore.updateTxList()
          navigate('/')
        })
      }
    } catch (error) {
      toast.error((error as any).message || 'Error')
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
    if (transferSymbol === accountStore.chainType) {
      if (fee === '0') {
        return
      }
      let all = new BigNumber(accountStore.balanceCoin).minus(
        new BigNumber(fee)
      )
      if (Number(all) < 0) {
        setAmount('0')
      } else {
        setAmount(all.toString())
      }
    } else {
      const fItem = tokenList.filter(
        (item) => item.address === transferSymbol
      )[0]
      if (fItem) {
        setAmount(fItem.accBalance1 + '')
      }
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
                <div style={{ width: '100%' }}>
                  <Select2
                    value={transferSymbol}
                    onChange={(v: any) => setTransferSymbol(v)}
                    options={[
                      {
                        label: (
                          <div className={styles.selectItem}>
                            {(accountStore.chainType === 'TOPEVM' ||
                              accountStore.chainType === 'FEVM') && (
                              <img
                                src={
                                  accountStore.chainType === 'TOPEVM'
                                    ? top
                                    : fil
                                }
                                alt="icon"
                                style={{ width: '42px', height: '42px' }}
                              ></img>
                            )}

                            <div className={styles.selectItemRight}>
                              <div className={styles.selectItemName}>
                                {chainStore.selectChainDetail.symbol}
                              </div>
                              <div className={styles.selectItemBalance}>
                                <span>
                                  <FormatMessage id="Balance"></FormatMessage>:{' '}
                                  {accountStore.balanceFormated}
                                </span>
                              </div>
                            </div>
                          </div>
                        ),
                        value: accountStore.chainType,
                      },
                      ...tokenList.map((item) => {
                        return {
                          label: (
                            <div
                              className={styles.selectItem}
                              key={item.address}
                            >
                              <div
                                style={{ marginRight: '13px' }}
                                className="flex-center"
                              >
                                <TokenLogo
                                  width={42}
                                  address={item.address}
                                ></TokenLogo>
                              </div>
                              <div className={styles.selectItemRight}>
                                <div className={styles.selectItemName}>
                                  {item.symbol}
                                </div>
                                <div className={styles.selectItemBalance}>
                                  <FormatMessage id="Balance"></FormatMessage>:{' '}
                                  {item.accBalance}
                                </div>
                              </div>
                            </div>
                          ),
                          value: item.address,
                        }
                      }),
                    ]}
                  ></Select2>
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
                    if (isNumberFormat(e.target.value)) {
                      setAmount(e.target.value)
                      calFee()
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
                Gas Fee({chainStore.selectChainDetail.symbol})
              </div>
              <div className={styles.inputWrap}>
                <Input value={fee} onChange={() => {}}></Input>
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
      </main>
    </>
  )
}

export default observer(EvmTransfer)
