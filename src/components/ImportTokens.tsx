import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Web3 from 'web3'
import { getTokenInfo } from '../eth'
import { accuracy, formatBalance } from '../lib'
import { topialog } from '../lib/log'
import { useStore } from '../store'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import styles from '../styles/ImportTokens.module.scss'
import Button from './Button'
import Input from './Input'
import TokenLogo from './TokenLogo'

let timeoutId: any

function ImportTokens({
  requestClose,
  step,
  setStep,
}: {
  requestClose: Function
  step: number
  setStep: Function
}) {
  const { accountStore, chainStore } = useStore()

  const navigate = useNavigate()

  const [address, setAddress] = useState('')
  const [showError, setShowError] = useState('')
  const [loading, setLoading] = useState(false)

  const [decimals, setDecimals] = useState<any>('-')
  const [symbol, setSymbol] = useState<any>('-')
  const [balance, setBalance] = useState<any>(0)

  function init() {
    setSymbol('-')
    setDecimals('-')
    setBalance(0)
  }

  useEffect(() => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(async () => {
      if (!address) {
        init()
        return
      }
      if (!Web3.utils.isAddress(address)) {
        setShowError(getLocaleMessage('InvalidAddress'))
        init()
        return
      }
      try {
        const { decimals, symbol, balance } = await getTokenInfo(
          address,
          accountStore.currentAccount.address
        )

        if (!symbol) {
          init()
          setShowError(getLocaleMessage('InvalidAddress'))
          return
        }
        setSymbol(symbol)
        setDecimals(decimals)
        setBalance(balance)
      } catch (error) {}
    }, 1000)
  }, [address, accountStore.currentAccount.address])

  async function handleOnBlur() {
    if (!address || !Web3.utils.isAddress(address)) {
      init()
      setShowError(getLocaleMessage('InvalidAddress'))
      return
    }
    if (loading) {
      return
    }
    setLoading(true)
    try {
      const { decimals, symbol, balance } = await getTokenInfo(
        address,
        accountStore.currentAccount.address
      )
      if (!symbol) {
        setLoading(false)
        init()
        setShowError(getLocaleMessage('InvalidAddress'))
        return
      }
      setSymbol(symbol)
      setDecimals(decimals)
      setBalance(balance)
      const hasAdd = await accountStore.hasAddToken(address)
      if (hasAdd) {
        setLoading(false)
        setShowError(getLocaleMessage('TokenHasAdd'))
        return
      }
      setTimeout(() => {
        setStep(2)
        setLoading(false)
      }, 1000)
    } catch (error) {
      topialog('error', error)
      init()
      setLoading(false)
    }
  }

  async function handleSaveClick() {
    if (loading) {
      return
    }
    topialog(123)
    setLoading(true)
    const hasAdd = accountStore.hasAddToken(address)
    topialog(345, hasAdd)
    if (hasAdd) {
      toast(getLocaleMessage('TokenHasAdd'))
      setLoading(false)
      return
    }
    await accountStore.addToken({
      address,
      symbol,
      decimals,
      chainType: chainStore.chainType,
      isHide: false,
    })
    topialog(345, address)
    toast(getLocaleMessage('AddSuccess'))
    setLoading(false)
    requestClose()
  }

  useEffect(() => {
    setShowError('')
  }, [address])

  // async function handleAddToken() {
  //   const res = await handleOnBlur()
  //   if (res) {

  //   }
  // }

  return (
    <div className={styles.itWrap}>
      {step === 1 && (
        <div>
          <div className={styles.fixHeight}>
            <div
              className={styles.title}
              onClick={() => navigate('/manageCustomToken')}
            >
              <FormatMessage id="CustomToken"></FormatMessage>
            </div>
            <div className={styles.item}>
              <div className={styles.label}>
                <FormatMessage id="TokenContractAddress"></FormatMessage>
              </div>
              <div>
                <Input
                  onKeyPress={(e: any) => {
                    if (e.code.toLowerCase() === 'enter') {
                      handleOnBlur()
                    }
                  }}
                  value={address}
                  onChange={(v: any) => setAddress(v.target.value)}
                  placeholder={getLocaleMessage('PleaseInputAddress')}
                ></Input>
              </div>
              {showError && <div className={styles.error}>{showError}</div>}
            </div>
            <div className={styles.item}>
              <div className={styles.label}>
                <FormatMessage id="TokenSymbol"></FormatMessage>
              </div>
              <div className={styles.content}>{symbol}</div>
            </div>
            <div className={styles.item}>
              <div className={styles.label}>
                <FormatMessage id="TokenDecimal"></FormatMessage>
              </div>
              <div className={styles.content}>{decimals}</div>
            </div>
          </div>
          <div className={styles.addBtn}>
            <Button onClick={handleOnBlur} loading={loading}>
              <FormatMessage id="AddToken"></FormatMessage>
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div>
          <div className={styles.fixHeight}>
            <div className={styles.title1}>
              <FormatMessage id="SureAdd"></FormatMessage>
            </div>
            <div className={styles.coinitem}>
              <div className={styles.logoWrap}>
                <TokenLogo width={42} address={address}></TokenLogo>
              </div>
              <div>
                <div className={styles.symbol}>{symbol}</div>
                <div className={styles.balance}>
                  <FormatMessage id="Balance"></FormatMessage>:{' '}
                  {formatBalance(accuracy(balance, decimals, 6))}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.btns}>
            <div>
              <Button onClick={() => setStep(1)} type="default">
                <FormatMessage id="Back"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button
                onClick={handleSaveClick}
                type="primary"
                loading={loading}
              >
                <FormatMessage id="ImportToken"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportTokens
