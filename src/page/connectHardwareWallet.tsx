import styles from '../styles/connectHardwareWallet.module.scss'
import ledgerPng from '../assets/images/ledger.png'
import Nav from '../components/Nav'
import FormatMessage from '../store/FormatMessage'
import Button from '../components/Button'
import { useState } from 'react'

import AppFilecoin from '../ledger/filecoin'
import { getTransport } from '../ledger'
import { useStore } from '../store'
import Eth from '@ledgerhq/hw-app-eth'
import { useNavigate } from 'react-router-dom'

function ConnectHardwareWallet() {
  let navigate = useNavigate()
  const { chainStore } = useStore()

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  function handleNextClick() {
    if (
      chainStore.chainType === 'TOPEVM' ||
      chainStore.chainType === 'TOP' ||
      chainStore.chainType === 'BSC' ||
      chainStore.chainType === 'ETH'
    ) {
      handleNextClickEvm()
    } else {
      handleNextClickFilecoin()
    }
  }
  async function handleNextClickEvm() {
    setLoading(true)
    setErrorMsg('')
    try {
      const transport = await getTransport()
      const appEth = new Eth(transport)
      await appEth.getAppConfiguration()
      setLoading(false)

      navigate('/hardwareWalletAddress')
    } catch (error: any) {
      console.error(error)
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  async function handleNextClickFilecoin() {
    setLoading(true)
    setErrorMsg('')
    try {
      const transport = await getTransport()
      const appFilecoin = new AppFilecoin(transport)
      const appInfo = await appFilecoin.appInfo()
      console.log('appInfo', appInfo)
      if (appInfo.error_message !== 'No errors') {
        setLoading(false)
        setErrorMsg(appInfo.error_message)
        return
      }
      if (appInfo.appName !== 'Filecoin') {
        setLoading(false)
        setErrorMsg('Please switch Filecoin application')
        return
      }

      const addressRes = await appFilecoin.getAddressAndPubKey(
        "m/44'/461'/2'/0/0"
      )
      console.log('addressRes', addressRes)
      if (addressRes.error_message !== 'No errors') {
        setLoading(false)
        setErrorMsg(addressRes.error_message)
        return
      }
      navigate('/hardwareWalletAddress')
      // setLoading(false)
    } catch (error: any) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  return (
    <div className={styles.chw}>
      <Nav>
        <FormatMessage id="ConnectYourHardwareWallet"></FormatMessage>
      </Nav>
      <div>
        <div>
          <div className={styles.ledger}>
            <img src={ledgerPng} alt=""></img>
          </div>
        </div>
        <p className={styles.error}>{errorMsg}</p>
        <div className={styles.info}>
          <p>
            <FormatMessage id="PlugYourLedger"></FormatMessage>
          </p>
          <p>
            {chainStore.chainType === 'FIL' ? (
              <FormatMessage id="SelectFilecoinApp"></FormatMessage>
            ) : (
              <FormatMessage id="SelectEthereumApp"></FormatMessage>
            )}
          </p>
          <p>
            <FormatMessage id="ChooseTheAccount"></FormatMessage>
          </p>
        </div>
      </div>
      <div className={`${styles.fixBottom} maxWidth`}>
        <Button onClick={handleNextClick} loading={loading} type="primary">
          <FormatMessage id="Continue"></FormatMessage>
        </Button>
      </div>
    </div>
  )
}

export default ConnectHardwareWallet
