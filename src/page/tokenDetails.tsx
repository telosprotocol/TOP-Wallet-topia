import Nav from '../components/Nav'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styles from '../styles/tokenDetails.module.scss'
import { useEffect, useRef, useState } from 'react'
import FormatMessage from '../store/FormatMessage'
import { useStore } from '../store'
import top from '../assets/images/top.svg'
import send from '../assets/images/send.svg'
import receive from '../assets/images/receive.svg'
import sending from '../assets/images/sending.svg'
import successed from '../assets/images/successed.svg'
import failed from '../assets/images/failed.svg'
import tokenSetting from '../assets/images/tokenSetting.svg'

import {
  accuracy,
  formatAddress,
  formatBalance,
  formatTxStatus,
  formatTxTime,
  openAddressScan,
} from '../lib'
import { onAccountChange, onChainChange } from '../lib/appPort'
import Modal from '../components/Modal'
import { useClickAway } from 'react-use'
import TxDialogItem from '../components/TxDialogItem'
import useFormatMessage from '../store/useFormatMessage'
import { ITxItem } from '../types'
import TokenLogo from '../components/TokenLogo'
import { getTokenInfo } from '../eth'
import { getTopPrice } from '../top'
import { topAddressToEth } from '../app/utils'

function TokenDetails() {
  let navigate = useNavigate()

  const { accountStore, globalStore, chainStore } = useStore()

  const [searchParams] = useSearchParams()
  const symbol = searchParams.get('symbol')
  const address = searchParams.get('address')

  const [txItem, setTxItem] = useState<ITxItem | null>(null)

  const [showTxModal, setShowTxModal] = useState(false)

  const [showOpt, setShowOpt] = useState(false)

  const [tokenBalance, setTokenBalance] = useState('0')
  const [tokenBalance1, setTokenBalance1] = useState(0)

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
    if (address) {
      getTokenInfo(
        address,
        topAddressToEth(accountStore.currentAccount.address)
      ).then((d) => {
        setTokenBalance(formatBalance(accuracy(d.balance, d.decimals, 6)))
        setTokenBalance1(Number(accuracy(d.balance, d.decimals, 6)))
      })
    }
  }, [symbol, address, accountStore.currentAccount.address])

  const [tokenPrice, setTokenPrice] = useState(0)
  useEffect(() => {
    if (!symbol) {
      return
    }
    if (symbol?.toUpperCase() === 'TOP') {
      setTokenPrice(accountStore.balancePrice)
    } else {
      getTopPrice(
        symbol?.toUpperCase(),
        accountStore.currentAccount.address
      ).then((p) => {
        setTokenPrice(formatBalance(tokenBalance1 * Number(p)))
      })
    }
  }, [
    accountStore.balancePrice,
    symbol,
    tokenBalance1,
    accountStore.currentAccount.address,
  ])

  const ref = useRef(null)
  useClickAway(ref, () => {
    setShowOpt(false)
  })

  function backUpCheck() {
    if (!globalStore.isBackupMnemonic && !accountStore.currentAccount.isLedger) {
      globalStore.setShowBackupModal(true)
      return false
    }
    return true
  }

  function handleReceiveClick() {
    if (!backUpCheck()) {
      return
    }
    navigate(`/receive?address=${address || ''}`)
  }

  function handleTransferClick() {
    if (!backUpCheck()) {
      return
    }
    const transferPath = 'evmTransfer'
    navigate(
      `/preTransfer?next=${encodeURIComponent(
        `/${transferPath}?address=${address || ''}`
      )}`
    )
  }

  async function handleHideToken() {
    if (address) {
      await accountStore.removeToken(address)
      navigate(-1)
    }
  }

  const sendTop = useFormatMessage({ id: 'SendTOP' })

  const [tokenTxList, setTokenTxList] = useState<ITxItem[]>([])
  useEffect(() => {
    setTokenTxList(
      [
        ...accountStore.transactionsTmpA,
        ...accountStore.transactionsTmpB,
      ].filter((item) => item.address === (address || symbol))
    )
  }, [
    accountStore.transactionsTmpA,
    accountStore.transactionsTmpB,
    symbol,
    address,
  ])

  return (
    <>
      <main>
        <Nav
          right={
            <div
              className={styles.tokenSetting}
              ref={ref}
              onClick={() => setShowOpt((c) => !c)}
            >
              {(symbol !== 'TOP' || address) && (
                <img className={styles.tsImg} src={tokenSetting} alt="" />
              )}
              {showOpt && (
                <div className={styles.leftMenu}>
                  <div onClick={() => handleHideToken()}>
                    <FormatMessage id="HideToken"></FormatMessage>
                  </div>
                </div>
              )}
            </div>
          }
        >
          {symbol}
        </Nav>
        <div className={styles.InitWallet}>
          <div className={styles.centerBlock}>
            <div className={styles.cbIcon}>
              {symbol === 'TOP' && !address ? (
                <img src={top} alt="icon"></img>
              ) : (
                <div style={{ marginRight: '13px' }} className="flex-center">
                  <TokenLogo width={42} address={address + ''}></TokenLogo>
                </div>
              )}
            </div>
            <div className={styles.cbTopAmount}>
              {symbol === 'TOP' && !address
                ? accountStore.balanceFormated
                : tokenBalance}{' '}
              {symbol}
            </div>
            <div className={styles.cbTopPrice}>
              {tokenPrice} {globalStore.currency}
            </div>
            <div className={styles.sendReceive}>
              <div onClick={handleReceiveClick}>
                <img src={receive} alt="receive"></img>
                <div>
                  <FormatMessage id="Receive"></FormatMessage>
                </div>
              </div>
              <div onClick={handleTransferClick}>
                <img src={send} alt="send"></img>
                <div>
                  <FormatMessage id="Transfer"></FormatMessage>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.transactions}>
            {tokenTxList.length === 0 && (
              <div className={styles.notx}>
                <FormatMessage id="YouHaveNoTransactions"></FormatMessage>
              </div>
            )}
            {tokenTxList.map((item) => {
              return (
                <div
                  key={item.txHash}
                  className={styles.txItem}
                  onClick={() => {
                    setTxItem(item || {})
                    setShowTxModal(true)
                  }}
                >
                  {item.status === 'sending' && (
                    <img src={sending} alt="sending"></img>
                  )}
                  {item.status === 'failure' && (
                    <img src={failed} alt="failed"></img>
                  )}
                  {item.status === 'success' && (
                    <img src={successed} alt="successed"></img>
                  )}
                  <div className={styles.txiRight}>
                    <div className={styles.txt1}>
                      <div className={styles.txstatus}>
                        {formatTxStatus(item.status)}
                      </div>
                      <div className={styles.txamount}>
                        {formatBalance(item.amountShow)} {item.symbol}
                      </div>
                    </div>
                    <div className={styles.txt2}>
                      <div className={styles.txtime}>
                        {formatTxTime(item.time)}
                      </div>
                      <div>
                        <FormatMessage id="To"></FormatMessage>:
                        {formatAddress(item.realTo)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {tokenTxList.length > 0 && (
              <div>
                <div
                  onClick={() => {
                    openAddressScan(
                      accountStore.currentAccount.address,
                      chainStore.chainType
                    )
                  }}
                  className={styles.lookMore}
                >
                  <FormatMessage id="GoToFILScanForMoreRecords"></FormatMessage>
                </div>
              </div>
            )}
          </div>
        </div>
        <Modal
          open={showTxModal}
          onClose={() => setShowTxModal(false)}
          showClose={true}
          title={sendTop + (txItem?.symbol || '')}
          customerContentStyle={{ padding: '0 0 0 0' }}
        >
          <TxDialogItem txItem={txItem}></TxDialogItem>
        </Modal>
      </main>
    </>
  )
}

export default TokenDetails
