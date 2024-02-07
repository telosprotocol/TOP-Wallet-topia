import { observer } from 'mobx-react-lite'
import { useStore } from '../store'
import { appPortRemoveAccount, onDataSuccess } from '../lib/appPort'
import styles from '../styles/home.module.scss'
import top from '../assets/images/top.svg'
import send from '../assets/images/send.svg'
import receive from '../assets/images/receive.svg'
import menu from '../assets/images/menu.svg'
import fil from '../assets/images/fil.png'
import bnbLogo from '../assets/images/bnb-bnb-logo.png'
import ethLogo from '../assets/images/ethereum-eth-logo.png'

import { useEffect, useRef, useState } from 'react'
import {
  copyToClipboard,
  formatAddress,
  formatBalance,
  formatTxStatus,
  formatTxTime,
  openAddressScan,
} from '../lib'
import Modal from '../components/Modal'
import Button from '../components/Button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import useFormatMessage from '../store/useFormatMessage'
import { useClickAway } from 'react-use'

import AccountDetails from '../components/AccountDetails'
import CopyToast from '../components/CopyToast'
import TokenLogo from '../components/TokenLogo'
import TxDialogItem from '../components/TxDialogItem'
import { IChainType, ITxItem } from '../types'
import useTokenList from '../hooks/useTokenList'
import { topAddressToEth } from '../app/utils'
import Loading from '../components/Loading'

const logoMap: any = {
  TOP: top,
  FIL: fil,
  ETH: ethLogo,
  BNB: bnbLogo,
}

function Home() {
  let navigate = useNavigate()
  const { accountStore, globalStore, chainStore } = useStore()

  const tokenList = useTokenList()

  const [showTxModal, setShowTxModal] = useState(false)
  const [showAccountDetailModal, setShowAccountDetailModal] = useState(false)

  const [txItem, setTxItem] = useState<ITxItem | null>(null)

  const [showSwitchToChainDialog, setShowSwitchToChainDialog] = useState(false)
  const [toChain, setToChain] = useState('')
  let [searchParams] = useSearchParams()
  const switchToChain = searchParams.get('switchToChain')

  async function handleCancelSwitchChain() {
    const sequence_id = searchParams.get('sequence_id')
    await onDataSuccess({
      sequence_id,
      data: {
        code: 4001,
        message: 'Cancel, User Rejected Request',
      },
    })
    window.close()
  }
  async function handleConfirmSwitchChain() {
    chainStore.changeChain(toChain as IChainType)
    const sequence_id = searchParams.get('sequence_id')
    await onDataSuccess({
      sequence_id,
      data: null,
    })
    window.close()
  }

  useEffect(() => {
    if (switchToChain) {
      setShowSwitchToChainDialog(true)
      setToChain(switchToChain)
    }
  }, [switchToChain])

  useEffect(() => {
    if (!txItem || !txItem.txHash) {
      return
    }
    setTxItem(
      accountStore.transactions.filter(
        (item) => item.txHash === txItem.txHash
      )[0] || null
    )
  }, [accountStore.transactions, txItem])

  function backUpCheck() {
    if (
      !globalStore.isBackupMnemonic &&
      !accountStore.currentAccount.isLedger
    ) {
      globalStore.setShowBackupModal(true)
      return false
    }
    return true
  }

  function handleCopyClick() {
    if (!backUpCheck()) {
      return
    }
    copyWithToast(accountStore.currentAccount.address)
  }

  function handleCopyClickEth() {
    if (!backUpCheck()) {
      return
    }
    copyWithToast(topAddressToEth(accountStore.currentAccount.address))
  }

  function copyWithToast(text: string) {
    copyToClipboard(text)
  }

  function handleReceiveClick() {
    if (!backUpCheck()) {
      return
    }
    navigate('/receive')
  }

  function handleTransferClick() {
    if (!backUpCheck()) {
      return
    }
    let path = '/transfer'
    if (
      chainStore.chainType === 'TOPEVM' ||
      chainStore.chainType === 'FEVM' ||
      chainStore.chainType === 'BSC' ||
      chainStore.chainType === 'ETH'
    ) {
      path = '/evmTransfer'
    }
    if (chainStore.chainType === 'FIL') {
      path = '/filTransfer'
    }
    navigate(`/preTransfer?next=${encodeURIComponent(path)}`)
  }

  const sendTop = useFormatMessage({ id: 'SendTOP' })

  const [showMenu, setShowMenu] = useState(false)
  const ref = useRef(null)
  useClickAway(ref, () => {
    setShowMenu(false)
  })
  function handleLeftMenuClick() {
    setShowMenu((c) => !c)
  }

  async function handleRemoveClick() {
    const res = await appPortRemoveAccount()
    if (res === 2 && !globalStore.isBackupMnemonic) {
      navigate('/backUpTip')
    }
  }

  useEffect(() => {
    const id = setInterval(() => {
      accountStore.updateTxList()
    }, 3000)
    return clearInterval(id)
  }, [accountStore])

  return (
    <>
      <main>
        <div className={styles.topBlock}>
          <div
            className={styles.tbLeft}
            onClick={() => {
              if (!backUpCheck()) {
                return
              }
              handleLeftMenuClick()
            }}
            ref={ref}
          >
            <img src={menu} alt="menu"></img>
            {showMenu && (
              <div className={styles.leftMenu}>
                <div onClick={() => setShowAccountDetailModal(true)}>
                  <FormatMessage id="AccountDetails"></FormatMessage>
                </div>
                <div
                  onClick={() => {
                    if (!backUpCheck()) {
                      return
                    }
                    openAddressScan(
                      accountStore.currentAccount.address,
                      chainStore.chainType
                    )
                  }}
                >
                  {chainStore.chainType === 'TOP' ||
                  chainStore.chainType === 'TOPEVM' ? (
                    <FormatMessage id="ViewAccountsAtTOPScan"></FormatMessage>
                  ) : (
                    <FormatMessage id="ViewAccountsAtScan"></FormatMessage>
                  )}
                </div>
                {/* <div>Resource management</div> */}
                {!accountStore.currentAccount.isSeed && (
                  <div onClick={handleRemoveClick}>
                    <FormatMessage id="RemoveAccount"></FormatMessage>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className={styles.tbCenter}>
            <div className={styles.tbt1}>
              {accountStore.currentAccount.name}
              {accountStore.currentAccount.isLedger && <span>Ledger</span>}
            </div>
            <div className={styles.tbt2}>
              <div className={styles.addressItem}>
                {accountStore.hideAccountAddress}{' '}
                <CopyToast
                  changeText={
                    globalStore.isBackupMnemonic ||
                    accountStore.currentAccount.isLedger
                  }
                  onClick={handleCopyClick}
                ></CopyToast>
              </div>
              {chainStore.chainType === 'TOPEVM' && (
                <div className={styles.addressItem}>
                  {formatAddress(
                    topAddressToEth(accountStore.currentAccount.address),
                    4,
                    -4
                  )}{' '}
                  <CopyToast
                    changeText={
                      globalStore.isBackupMnemonic ||
                      accountStore.currentAccount.isLedger
                    }
                    onClick={handleCopyClickEth}
                  ></CopyToast>
                </div>
              )}
            </div>
          </div>
          <div className={styles.tbRight}></div>
        </div>
        <div className={styles.centerBlock}>
          <div className={styles.cbIcon}>
            <img
              src={logoMap[chainStore.selectChainDetail.symbol]}
              alt="icon"
            ></img>
          </div>
          <div className={styles.cbTopAmount}>
            {accountStore.balanceFormated} {chainStore.selectChainDetail.symbol}
          </div>
          <div className={styles.cbTopPrice}>
            {accountStore.balancePrice} {globalStore.currency}
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
        <div>
          <div className={styles.indexTab}>
            <div
              onClick={() => accountStore.setHomeSelectTab(1)}
              className={
                accountStore.homeSelectedTab === 1 ? styles.selected : ''
              }
            >
              <FormatMessage id="Assets"></FormatMessage>
            </div>
            <div
              onClick={() => accountStore.setHomeSelectTab(2)}
              className={
                accountStore.homeSelectedTab === 2 ? styles.selected : ''
              }
            >
              <FormatMessage id="Record"></FormatMessage>
            </div>
          </div>
          <div
            className={styles.tabcontent}
            key={accountStore.currentAccount.address}
          >
            {accountStore.homeSelectedTab === 1 && (
              <div>
                <div
                  className={styles.topBalance}
                  onClick={() => {
                    if (accountStore.chainType !== 'TOPEVM') {
                      return
                    }
                    if (!backUpCheck()) {
                      return
                    }
                    navigate(`/tokenDetails?symbol=TOP`)
                  }}
                >
                  <div>
                    <img
                      src={logoMap[chainStore.selectChainDetail.symbol]}
                      alt="icon"
                    ></img>
                    {chainStore.selectChainDetail.symbol}
                  </div>
                  <div>
                    {accountStore.loadingBalance ? (
                      <Loading />
                    ) : (
                      accountStore.balanceFormated
                    )}
                  </div>
                </div>
                {accountStore.chainType === 'TOPEVM' && (
                  <div className={styles.topBalance}>
                    <div>
                      <img src={logoMap['ETH']} alt="icon"></img>
                      ETH
                    </div>
                    <div>
                      {accountStore.loadingEthBalance ? (
                        <Loading />
                      ) : (
                        accountStore.ethBalanceFormated
                      )}
                    </div>
                  </div>
                )}
                {tokenList.map((item) => {
                  return (
                    <div
                      className={styles.topBalance}
                      key={item.address}
                      onClick={() => {
                        if (!backUpCheck()) {
                          return
                        }
                        navigate(
                          `/tokenDetails?symbol=${item.symbol}&address=${item.address}`
                        )
                      }}
                    >
                      <div>
                        <div style={{ marginRight: '13px' }}>
                          <TokenLogo
                            width={42}
                            address={item.address + item.symbol}
                          ></TokenLogo>
                        </div>
                        {item.symbol}
                      </div>
                      <div>{item.accBalance}</div>
                    </div>
                  )
                })}
                {(chainStore.chainType === 'TOPEVM' ||
                  chainStore.chainType === 'FEVM' ||
                  chainStore.chainType === 'BSC' ||
                  chainStore.chainType === 'ETH') && (
                  <div className={styles.importTokens}>
                    <FormatMessage id="DontSeeYourToken"></FormatMessage>
                    <br />
                    <span
                      onClick={() => {
                        if (!backUpCheck()) {
                          return
                        }
                        navigate(`/tokenImport1`)
                      }}
                    >
                      <FormatMessage id="ImportTokens"></FormatMessage>
                    </span>
                  </div>
                )}
              </div>
            )}
            {accountStore.homeSelectedTab === 2 && (
              <div className={styles.transactions}>
                {accountStore.transactions.length === 0 && (
                  <div className={styles.notx}>
                    <FormatMessage id="YouHaveNoTransactions"></FormatMessage>
                  </div>
                )}
                {accountStore.transactions.map((item) => {
                  return (
                    <div
                      key={item.txHash}
                      className={styles.txItem}
                      onClick={() => {
                        setTxItem(item || {})
                        setShowTxModal(true)
                      }}
                    >
                      {item.address === 'TOP' ? (
                        <img src={top} alt="top"></img>
                      ) : (
                        <div
                          style={{ marginRight: '13px' }}
                          className="flex-center"
                        >
                          <TokenLogo
                            width={42}
                            address={item.address}
                          ></TokenLogo>
                        </div>
                      )}
                      <div className={styles.txiRight}>
                        <div className={styles.txt1}>
                          <div className={styles.txstatus}>
                            {item.txMethod2
                              ? item.txMethod2
                              : formatTxStatus(item.status)}
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
                {accountStore.transactions.length > 0 && (
                  <div>
                    {accountStore.allTransactionLength !==
                      accountStore.transactions.length && (
                      <div
                        className={styles.lookMore}
                        onClick={() => accountStore.setShowMore()}
                      >
                        <FormatMessage id="MoreRecords"></FormatMessage>
                      </div>
                    )}
                    {accountStore.allTransactionLength ===
                      accountStore.transactions.length && (
                      <div
                        onClick={() => {
                          openAddressScan(
                            accountStore.currentAccount.address,
                            chainStore.chainType
                          )
                        }}
                        className={styles.lookMore}
                      >
                        {chainStore.chainType === 'TOP' ||
                        chainStore.chainType === 'TOPEVM' ? (
                          <FormatMessage id="GoToTOPScanForMoreRecords"></FormatMessage>
                        ) : (
                          <FormatMessage id="GoToFILScanForMoreRecords"></FormatMessage>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <Modal
          open={globalStore.showBackupModal}
          onClose={() => globalStore.setShowBackupModal(false)}
          showClose={false}
          title={getLocaleMessage('Reminder')}
        >
          <div className={styles.modalContent}>
            <div className={styles.desc}>
              <FormatMessage id="YourMnemonicsHaveNotBeenBackedUp"></FormatMessage>
            </div>
            <div className={styles.modalBtns}>
              <Button
                type="default"
                onClick={() => globalStore.setShowBackupModal(false)}
              >
                <FormatMessage id="Later"></FormatMessage>
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  globalStore.setShowBackupModal(false)
                  navigate('/backUpTip')
                }}
              >
                <FormatMessage id="BackupNow"></FormatMessage>
              </Button>
            </div>
          </div>
        </Modal>
        <Modal
          open={showTxModal}
          onClose={() => setShowTxModal(false)}
          showClose={true}
          title={
            txItem?.txMethod2
              ? txItem.txMethod2
              : sendTop + (txItem?.symbol || '')
          }
          customerContentStyle={{ padding: '0 0 0 0' }}
        >
          <TxDialogItem txItem={txItem}></TxDialogItem>
        </Modal>
        <Modal
          open={showAccountDetailModal}
          onClose={() => setShowAccountDetailModal(false)}
        >
          <AccountDetails
            onClose={() => setShowAccountDetailModal(false)}
          ></AccountDetails>
        </Modal>
        <Modal
          open={showSwitchToChainDialog}
          onClose={handleCancelSwitchChain}
          title={<FormatMessage id="SwitchTheNetWork"></FormatMessage>}
        >
          <div style={{ marginBottom: '20px' }}>
            <FormatMessage id="AllowSwitchTo"></FormatMessage> {toChain} ?
          </div>
          <div className={styles.modalBtns}>
            <Button onClick={handleCancelSwitchChain} type="default">
              <FormatMessage id="Cancel"></FormatMessage>
            </Button>
            <Button type="primary" onClick={handleConfirmSwitchChain}>
              <FormatMessage id="OK"></FormatMessage>
            </Button>
          </div>
        </Modal>
      </main>
    </>
  )
}

export default observer(Home)
