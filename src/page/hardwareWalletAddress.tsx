import styles from '../styles/connectHardwareWallet.module.scss'
import Nav from '../components/Nav'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import Button from '../components/Button'
import { useCallback, useEffect, useState } from 'react'
import checkboxS from '../assets/images/checkbox_s.svg'
import checkbox from '../assets/images/checkbox.svg'
import checkbox_disable from '../assets/images/checkbox_disable.svg'
import openLink from '../assets/images/openLink.svg'
import successgif from '../assets/images/success.gif'

import { getTransport } from '../ledger'
import { useStore } from '../store'
import Eth from '@ledgerhq/hw-app-eth'
import { formatAddress, formatBalance, openAddressScan } from '../lib'
import {
  appPortRemoveLedgerAccount,
  changeAccount,
  createAccount,
} from '../lib/appPort'
import Modal from '../components/Modal'
import { storageGet, storageSet } from '../lib/storage'
import { IAccountList, IBaAccount, IChainType } from '../types'
import { useNavigate } from 'react-router-dom'
import Loading from '../components/Loading'
import {
  ethAddressToT8Top,
  ethAddressToTop,
  topAddressToEth,
} from '../app/utils'
import { toast } from 'react-toastify'
import BigNumber from 'bignumber.js'
import { getChainTypeDecimals } from '../app/utils'
import { getAddressBalance } from '../app/account'
import ReactModal from 'react-modal'
import AppFilecoin from '../ledger/filecoin'
import { track } from '../lib/track'

type AddresItem = {
  address: string
  path: string
  value: string
  isCheck: boolean
  pathIndex: number
  hasSaved: boolean
  hasFetchBalance: boolean
}

function ConnectHardwareWallet() {
  let navigate = useNavigate()
  const { chainStore } = useStore()

  const [errorMsg, setErrorMsg] = useState('')

  const [showForgetModal, setShowForgetModal] = useState(false)

  const [addressList, setAddressList] = useState<AddresItem[]>([])
  const [fetchAddressLoading, setFetchAddressLoading] = useState(false)
  const [current, setCurrent] = useState(0)

  const [openSuccessModal, setOpenSuccessModal] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  function closePage() {
    setOpenSuccessModal(true)
    setTimeout(() => {
      window.close()
    }, 2200)
  }

  function handleNextClick() {
    handleNextClickEvm()
  }

  async function handleNextClickEvm() {
    if (fetchAddressLoading || saveLoading) {
      return
    }
    const filterAddressList: IBaAccount[] = addressList
      .filter((item) => item.isCheck && !item.hasSaved)
      .map((item) => {
        return {
          importType: 3,
          name: `Ledger ${item.pathIndex + 1}`,
          isSeed: false,
          isLedger: true,
          privateKey: '',
          address: item.address,
          mnemonic: '',
          pathIndex: item.pathIndex,
        }
      })
    if (filterAddressList.length === 0) {
      toast(getLocaleMessage('SelectOneAddress'))
      return
    }
    setSaveLoading(true)
    let res = await storageGet<{
      accountList: IAccountList
      chainType: IChainType
    }>(['accountList', 'chainType'])

    let resAccount = res.accountList[res.chainType]

    // new account
    if (resAccount.accountList.length === 0) {
      await createAccount({
        pass: '',
        name: '',
        isBackupMnemonic: false,
        selectChainType: chainStore.chainType,
      })
      res = await storageGet<{
        accountList: IAccountList
        chainType: IChainType
      }>(['accountList', 'chainType'])
      resAccount = res.accountList[res.chainType]
      const chainTypes = Object.keys(res.accountList) as IChainType[]
      chainTypes.forEach((item: IChainType) => {
        res.accountList[item].accountList.forEach((i) => {
          i.hidden = true
        })
        res.accountList[item].accountList = [
          ...res.accountList[item].accountList,
          ...filterAddressList.map((addressItem) => {
            return {
              ...addressItem,
              address:
                item === 'ETH' || item === 'BSC' || item === 'FIL'
                  ? topAddressToEth(addressItem.address)
                  : addressItem.address,
            }
          }),
        ]
        res.accountList[item].selectAccount = filterAddressList[0].address
      })
    } else {
      res.accountList[res.chainType] = {
        accountList: [...resAccount.accountList, ...filterAddressList],
        selectAccount: filterAddressList[0].address,
      }
    }

    await storageSet<{
      accountList: IAccountList
    }>({
      accountList: res.accountList,
    })
    changeAccount(res.accountList[res.chainType].selectAccount, res.chainType)
    closePage()
    try {
      track({ event: 'create' })
    } catch (error) {}
  }

  async function handleForgotDeviceClick() {
    await appPortRemoveLedgerAccount()
    closePage()
  }

  useEffect(() => {
    addressList.forEach((item) => {
      if (item.hasFetchBalance) {
        return
      }
      getAddressBalance(item.address, chainStore.chainType)
        .then((balance) => {
          setAddressList((l) => {
            const newList = l.map((i2) => {
              if (i2.address === item.address) {
                const updatedItem = {
                  ...i2,
                  value: formatBalance(
                    new BigNumber(balance)
                      .div(10 ** getChainTypeDecimals(chainStore.chainType))
                      .toFixed(18),
                    getChainTypeDecimals(chainStore.chainType)
                  ),
                  hasFetchBalance: true,
                }
                return updatedItem
              }
              return i2
            })
            return newList
          })
        })
        .catch((e) => console.log(e))
    })
  }, [addressList, chainStore.chainType])

  const fetchAddress = useCallback(
    async function (page: number) {
      setFetchAddressLoading(true)
      setErrorMsg('')
      setAddressList([])
      try {
        const res = await storageGet<{
          accountList: IAccountList
          chainType: IChainType
        }>(['accountList', 'chainType'])
        const savedList = res.accountList[res.chainType].accountList
          .filter((item) => item.isLedger)
          .map((item) => item.address.toLowerCase())
        const transport = await getTransport()
        const tmpAddressList = []
        if (chainStore.chainType === 'FIL') {
          const appFilecoin = new AppFilecoin(transport)
          for (let index = 0; index < 5; index++) {
            const path = `m/44'/461'/${index + page * 5}'/0/0`
            const res2 = await appFilecoin.getAddressAndPubKey(path)
            console.log('res2', res2)
            if (res2.error_message !== 'No errors') {
              throw new Error(res2.error_message)
            }

            const address = res2.addrString
            tmpAddressList.push({
              path,
              address: address,
              value: '0',
              isCheck: false,
              hasSaved: savedList.includes(address.toLowerCase()),
              pathIndex: index + page * 5,
              hasFetchBalance: false,
            })
          }
        } else {
          const appEth = new Eth(transport)
          for (let index = 0; index < 5; index++) {
            const path = `44'/60'/0'/0/${index + page * 5}`
            const res2 = await appEth.getAddress(path)
            const address =
              res.chainType === 'BSC' || res.chainType === 'ETH'
                ? res2.address
                : res.chainType === 'TOPEVM'
                ? ethAddressToTop(res2.address)
                : ethAddressToT8Top(res2.address)
            tmpAddressList.push({
              path,
              address: address,
              value: '0',
              isCheck: false,
              hasSaved: savedList.includes(address.toLowerCase()),
              pathIndex: index + page * 5,
              hasFetchBalance: false,
            })
          }
        }
        setAddressList(tmpAddressList)
        setCurrent(page)
        setFetchAddressLoading(false)
      } catch (error: any) {
        console.error(error)
        setErrorMsg(error.message)
        setFetchAddressLoading(false)
      }
    },
    [chainStore.chainType]
  )

  useEffect(() => {
    fetchAddress(0)
  }, [fetchAddress])

  async function next() {
    if (fetchAddressLoading) {
      return
    }
    fetchAddress(current + 1)
  }

  async function prev() {
    if (fetchAddressLoading) {
      return
    }
    if (current === 0) {
      return
    }
    fetchAddress(current - 1)
  }

  function setIsCheck(address: string) {
    const newList = addressList.map((item) => {
      if (item.address === address && !item.hasSaved) {
        const updatedItem = {
          ...item,
          isCheck: !item.isCheck,
        }
        return updatedItem
      }
      return item
    })
    setAddressList(newList)
  }

  return (
    <div className={styles.chw}>
      <Nav>
        <FormatMessage id="ConnectYourHardwareWallet"></FormatMessage>
      </Nav>
      <div>
        <p className={styles.error}>{errorMsg}</p>
        <div className={styles.info}>
          <div className={styles.selectYour}>
            <FormatMessage id="SelectYourAccount"></FormatMessage>
          </div>
          <div className={styles.addressList}>
            {fetchAddressLoading && (
              <div className={styles.loadingWrap}>
                <Loading></Loading>
              </div>
            )}
            {addressList.map((item) => {
              return (
                <div
                  className={styles.addressItem}
                  key={item.address}
                  onClick={() => setIsCheck(item.address)}
                >
                  <div className={styles.addressItemInner}>
                    <div className={styles.aCheckWrap}>
                      <img
                        src={
                          item.hasSaved
                            ? checkbox_disable
                            : item.isCheck
                            ? checkboxS
                            : checkbox
                        }
                        alt="checkbox"
                      />
                      <span>{item.pathIndex + 1}</span>
                    </div>
                    <div className={styles.aAddressWrap}>
                      <div className={styles.address}>
                        {formatAddress(item.address, 18, -10)}
                      </div>
                      <div className={styles.balance}>
                        {item.value} {chainStore.selectChainDetail.symbol}
                      </div>
                    </div>
                  </div>
                  <div className={styles.jump}>
                    <img
                      src={openLink}
                      alt="link"
                      onClick={() =>
                        openAddressScan(item.address, chainStore.chainType)
                      }
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className={styles.nextPrev}>
            <span
              onClick={prev}
              className={current === 0 ? styles.disable : ''}
            >
              <FormatMessage id="Previous"></FormatMessage>
            </span>
            <span onClick={next}>
              <FormatMessage id="NextLedger"></FormatMessage>
            </span>
          </div>
        </div>
      </div>
      <div className={`${styles.addressBtns} maxWidth`}>
        <Button
          onClick={() => {
            if (fetchAddressLoading) {
              return
            }
            navigate(-1)
          }}
          type="default"
        >
          <FormatMessage id="Cancel"></FormatMessage>
        </Button>
        <Button onClick={handleNextClick} type="primary" loading={saveLoading}>
          <FormatMessage id="UnlockLeder"></FormatMessage>
        </Button>
      </div>
      <p onClick={() => setShowForgetModal(true)} className={styles.forget}>
        <FormatMessage id="ForgetThisDevice"></FormatMessage>
      </p>
      <Modal
        open={showForgetModal}
        showClose={true}
        onClose={() => setShowForgetModal(false)}
        title={<FormatMessage id="ForgotDevice"></FormatMessage>}
      >
        <div>
          <div className="" style={{ fontSize: '16px', textAlign: 'center' }}>
            <FormatMessage id="ForgotDeviceContent"></FormatMessage>
          </div>
          <div className={styles.btns33}>
            <Button type="default" onClick={() => setShowForgetModal(false)}>
              <FormatMessage id="Cancel"></FormatMessage>
            </Button>
            <Button onClick={handleForgotDeviceClick}>
              <FormatMessage id="Confirm"></FormatMessage>
            </Button>
          </div>
        </div>
      </Modal>
      <ReactModal
        isOpen={openSuccessModal}
        // onRequestClose={onClose}
        // shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
        style={{
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1200,
          },
          content: {
            inset: '50% 0 0 50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'visible',
            padding: 0,
            margin: 0,
            marginBottom: 0,
            maxWidth: '365px',
            zIndex: 1200,
            width: '88px',
            height: '88px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.65)',
          },
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <img
            src={successgif}
            alt="success"
            width={80}
            height={80}
            style={{
              position: 'relative',
              left: '-2px',
              top: '3px',
            }}
          ></img>
        </div>
      </ReactModal>
    </div>
  )
}

export default ConnectHardwareWallet
