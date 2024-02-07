import styles from '../styles/header.module.scss'
import { observer } from 'mobx-react-lite'
import { useStore } from '../store'
import arrow from '../assets/images/arrow.svg'
import about from '../assets/images/about.svg'
import download from '../assets/images/download.svg'
import setting from '../assets/images/setting.svg'
import LedgerWallet from '../assets/images/addLedger.svg'
import logo from './logoImg'
import plus from '../assets/images/plus.svg'
import selected from '../assets/images/selected.svg'
import BlockieIdenticon from './BlockieIdenticon'
import { useEffect, useRef, useState } from 'react'
import { useClickAway } from 'react-use'
import { appPortLock, changeAccount, openNewTab } from '../lib/appPort'
import { useLocation, useNavigate } from 'react-router-dom'
import FormatMessage from '../store/FormatMessage'
import { IChainType } from '../types'
import Modal from './Modal'
import Button from './Button'
import { getHasCreateFilAccount, setHasCreateFilAccount } from '../app/utils'
import { toast } from 'react-toastify'

function Header() {
  let navigate = useNavigate()
  let location = useLocation()
  const { chainStore, accountStore, globalStore } = useStore()
  const [showOptions, setShowOptions] = useState(false)
  const [showOptions2, setShowOptions2] = useState(false)
  const [showCreateFilcoin, setShowCreateFilcoin] = useState(false)

  const [selectChainType, setSelectChainType] = useState<IChainType>('TOP')

  useEffect(() => {
    setSelectChainType(accountStore.chainType)
  }, [accountStore.chainType])

  const ref = useRef(null)
  useClickAway(ref, () => {
    setShowOptions(false)
  })
  const ref2 = useRef(null)
  useClickAway(ref2, () => {
    setShowOptions2(false)
  })

  async function handleChangeChainClick(chainType: IChainType) {
    if (chainStore.chainType !== chainType) {
      // if switch to filecoin, then check has created
      if (chainType === 'FIL') {
        const b = await getHasCreateFilAccount()
        if (!b) {
          setShowCreateFilcoin(true)
          return
        }
      }
      chainStore.changeChain(chainType)
    }
    setShowOptions(false)
  }

  async function handleLockClick() {
    await appPortLock()
    setShowOptions2(false)
    globalStore.logout()
    navigate('/login')
  }

  async function createFirstFilecoin() {
    try {
      await setHasCreateFilAccount()
      chainStore.changeChain('FIL')
      setShowCreateFilcoin(false)
    } catch (error) {
      toast.error('Error')
    }
  }

  const hideAvatar =
    location.pathname === '/welcome' ||
    location.pathname === '/login' ||
    location.pathname === '/importNewWallet' ||
    location.pathname === '/importNewMnemonic' ||
    location.pathname === '/noticePage' ||
    location.pathname === '/createNewWallet' ||
    location.pathname === '/connectHardwareWallet' ||
    location.pathname === '/hardwareWalletAddress'

  if (location.pathname === '/dappConnect') {
    return null
  }

  function handleSelectChainClick() {
    if (
      ['/connectHardwareWallet', '/hardwareWalletAddress', '/login'].includes(
        location.pathname
      ) ||
      hideAvatar
    ) {
      return
    }
    setShowOptions((c) => !c)
  }

  function goHome() {
    if (
      ['/connectHardwareWallet', '/hardwareWalletAddress', '/login'].includes(
        location.pathname
      ) ||
      hideAvatar
    ) {
      return
    }
    navigate('/')
  }

  return (
    <div className={`${styles.header} maxWidth`}>
      <div className={styles.logoWrap} onClick={goHome}>
        <img src={logo} alt="logo"></img>
      </div>
      <div className={styles.selectChainWrap} ref={ref}>
        <div className={styles.selectChain} onClick={handleSelectChainClick}>
          <span className={styles.green}></span>
          <span>{chainStore.selectChainDetail.name}</span>
          <img className={styles.arrow} src={arrow} alt="down"></img>
        </div>
        {showOptions && (
          <div className={styles.selectOptions}>
            {chainStore.chainList.map((item, index) => (
              <div
                onClick={() => handleChangeChainClick(item.chainType)}
                key={item.rpc}
              >
                {item.name}
                {process.env.REACT_APP_REPORT_ENV === 'dn' && <> (TEST)</>}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.avatarWrap2}>
        <div className={styles.avatarWrap1} ref={ref2}>
          {!hideAvatar && (
            <div
              className={styles.avatarWrap}
              onClick={() => setShowOptions2((c) => !c)}
            >
              <BlockieIdenticon
                address={accountStore.currentAccount.address}
                diameter={'34px'}
                alt="avatar"
                borderRadius="50%"
              ></BlockieIdenticon>
            </div>
          )}

          {showOptions2 && (
            <div className={styles.accountMenu}>
              <div className={styles.amItem} style={{ paddingBottom: '0' }}>
                <div>
                  <div>
                    <FormatMessage id="MyAccount"></FormatMessage>
                  </div>
                  <div onClick={handleLockClick} className={styles.lockAccount}>
                    <FormatMessage id="LockAccount"></FormatMessage>
                  </div>
                </div>
                <div className={styles.chainType}></div>
              </div>
              <div className={styles.amItem}>
                {accountStore.accountList[selectChainType].accountList.map(
                  (item, index) => {
                    return (
                      <div
                        key={item.address}
                        onClick={() => {
                          changeAccount(item.address, selectChainType)
                          setShowOptions2(false)
                        }}
                      >
                        <div className={styles.acclistLeft}>
                          <div>
                            <BlockieIdenticon
                              address={item.address}
                              diameter={'34px'}
                              alt="avatar"
                              borderRadius="50%"
                            ></BlockieIdenticon>
                          </div>
                          <div>{item.name}</div>
                        </div>
                        <div>
                          {selectChainType === accountStore.chainType &&
                            item.address ===
                              accountStore.accountList[selectChainType]
                                .selectAccount && (
                              <img alt="selected" src={selected}></img>
                            )}
                        </div>
                      </div>
                    )
                  }
                )}
              </div>
              <div className={styles.amItem}>
                <div
                  className={styles.flex_left}
                  onClick={() => {
                    setShowOptions2(false)
                    navigate(
                      `/createOldWallet?selectChainType=${selectChainType}`
                    )
                  }}
                >
                  <img alt="plus" src={plus}></img>
                  <FormatMessage id="CreateWallet"></FormatMessage>
                </div>
                <div
                  className={styles.flex_left}
                  onClick={() => {
                    setShowOptions2(false)
                    navigate(
                      `/importOldWallet?selectChainType=${selectChainType}`
                    )
                  }}
                >
                  <img alt="download" src={download}></img>
                  <FormatMessage id="ImportWallet"></FormatMessage>
                </div>
                {(chainStore.chainType === 'TOPEVM' ||
                  chainStore.chainType === 'BSC' ||
                  chainStore.chainType === 'ETH' ||
                  chainStore.chainType === 'TOP' ||
                  chainStore.chainType === 'FIL') && (
                  <div
                    className={styles.flex_left}
                    onClick={() => {
                      setShowOptions2(false)
                      openNewTab(`/index.html#/connectHardwareWallet`)
                    }}
                  >
                    <img alt="LedgerWallet" src={LedgerWallet}></img>
                    <FormatMessage id="LedgerWallet"></FormatMessage>
                  </div>
                )}
              </div>
              <div className={styles.amItem}>
                <div
                  className={styles.flex_left}
                  onClick={() => {
                    setShowOptions2(false)
                    navigate('/setting')
                  }}
                >
                  <img alt="setting" src={setting}></img>
                  <FormatMessage id="WalletSettings"></FormatMessage>
                </div>
                <div
                  className={styles.flex_left}
                  onClick={() => {
                    setShowOptions2(false)
                    navigate('/about')
                  }}
                >
                  <img alt="about" src={about}></img>
                  <FormatMessage id="AboutUs"></FormatMessage>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Modal open={showCreateFilcoin} showClose={false}>
        <div>
          <div className="" style={{ fontSize: '16px', textAlign: 'center' }}>
            <FormatMessage id="YouDontYetHave"></FormatMessage>
          </div>
          <div className={styles.btns}>
            <Button type="default" onClick={() => setShowCreateFilcoin(false)}>
              <FormatMessage id="NoThanks"></FormatMessage>
            </Button>
            <Button onClick={createFirstFilecoin}>
              <FormatMessage id="YesCreateIt"></FormatMessage>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default observer(Header)
