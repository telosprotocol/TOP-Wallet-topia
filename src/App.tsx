import './App.css'
import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Home from './page/home'
import { observer } from 'mobx-react-lite'
import { useStore } from './store'
import Welcome from './page/welcome'
import { useNavigate } from 'react-router-dom'
import Login from './page/login'
import CreateNewWallet from './page/createNewWallet'
import ImportNewWallet from './page/importNewWallet'
import ImportNewMnemonic from './page/importNewMnemonic'
import Header from './components/Header'
import BackUpTip from './page/backUpTip'
import BackUpMnemonic2 from './page/backUpMnemonic2'
import BackUpMnemonic1 from './page/backUpMnemonic1'
import Receive from './page/receive'
import Transfer from './page/transfer'
import EvmTransfer from './page/evmTransfer'
import EvmConfirm from './page/evmConfirm'
import TopContractTx from './page/topContractTx'
import FilTransfer from './page/filTransfer'
import Connect from './page/connect'
import ImportOldWallet from './page/importOldWallet'
import CreateOldWallet from './page/createOldWallet'
import Setting from './page/setting'
import About from './page/about'
import MnemonicPhrases from './page/MnemonicPhrases'
import TokenDetails from './page/tokenDetails'
import TokenImport1 from './page/tokenImport1'
import ManageCustomToken from './page/manageCustomToken'
import PreTransfer from './page/preTransfer'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ReactModal from 'react-modal'
import NoticePage from './page/NoticePage'
import RecoveryTip from './page/RecoveryTip'
import DappConnect from './page/dappConnect'
import ConnectHardwareWallet from './page/connectHardwareWallet'
import HardwareWalletAddress from './page/hardwareWalletAddress'
import { initTrack, track, trackPV } from './lib/track'
import PersonalSign from './page/PersonalSign'

ReactModal.setAppElement('#root')

function App() {
  const { globalStore } = useStore()
  let navigate = useNavigate()
  let location = useLocation()
  const navigateRef = useRef(navigate)
  const locationRef = useRef(location)
  useEffect(() => {
    initTrack({
      appname: 'TopiaExtension',
      category: 'extension',
    })
  }, [])

  useEffect(() => {
    if (window.innerWidth > 500) {
      document.body.style.height = 'auto'
    }
  }, [])

  useEffect(() => {
    trackPV()
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    locationRef.current = location
  }, [location])
  useEffect(() => {
    if (
      ['/connectHardwareWallet', '/hardwareWalletAddress'].includes(
        locationRef.current.pathname
      )
    ) {
      return
    }
    if (
      globalStore.isInit &&
      globalStore.accountLength === 0 &&
      locationRef.current.pathname !== '/welcome'
    ) {
      navigateRef.current('/welcome')
      return
    }
    if (
      globalStore.isInit &&
      !globalStore.hasPass &&
      !globalStore.isBackupMnemonic &&
      locationRef.current.pathname !== '/login'
    ) {
      globalStore.updateTmpData(window.location.hash.replace(/^#/, ''))
      navigateRef.current('/login')
      return
    }
    if (
      globalStore.isInit &&
      globalStore.needLogin &&
      locationRef.current.pathname !== '/login'
    ) {
      globalStore.updateTmpData(window.location.hash.replace(/^#/, ''))
      navigateRef.current('/login')
      return
    }
  }, [
    globalStore,
    globalStore.isInit,
    globalStore.accountLength,
    globalStore.needLogin,
    globalStore.hasPass,
    globalStore.isBackupMnemonic,
  ])

  useEffect(() => {
    track({ event: 'open' })
  }, [])

  const showHeader = location.pathname !== '/personal_sign'

  return (
    <div className={`App ${location.pathname.replace(/^\//, '')}`}>
      {showHeader && <Header></Header>}

      {globalStore.isInit && (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/createNewWallet" element={<CreateNewWallet />} />
          <Route path="/importNewWallet" element={<ImportNewWallet />} />
          <Route path="/importNewMnemonic" element={<ImportNewMnemonic />} />
          <Route path="/backUpTip" element={<BackUpTip />} />
          <Route path="/backUpMnemonic1" element={<BackUpMnemonic1 />} />
          <Route path="/backUpMnemonic2" element={<BackUpMnemonic2 />} />
          <Route path="/receive" element={<Receive />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/evmTransfer" element={<EvmTransfer />} />
          <Route path="/evmConfirm" element={<EvmConfirm />} />
          <Route path="/topContractTx" element={<TopContractTx />} />
          <Route path="/filTransfer" element={<FilTransfer />} />
          <Route path="/connect" element={<Connect />} />
          <Route path="/importOldWallet" element={<ImportOldWallet />} />
          <Route path="/createOldWallet" element={<CreateOldWallet />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/about" element={<About />} />
          <Route path="/mnemonicPhrases" element={<MnemonicPhrases />} />
          <Route path="/tokenDetails" element={<TokenDetails />} />
          <Route path="/tokenImport1" element={<TokenImport1 />} />
          <Route path="/manageCustomToken" element={<ManageCustomToken />} />
          <Route path="/noticePage" element={<NoticePage />} />
          <Route path="/recoveryTip" element={<RecoveryTip />} />
          <Route path="/preTransfer" element={<PreTransfer />} />
          <Route path="/dappConnect" element={<DappConnect />} />
          <Route path="/personal_sign" element={<PersonalSign />} />
          <Route
            path="/connectHardwareWallet"
            element={<ConnectHardwareWallet />}
          />
          <Route
            path="/hardwareWalletAddress"
            element={<HardwareWalletAddress />}
          />
        </Routes>
      )}
      {/* <p>isinit:{globalStore.isInit ? 'init' : 'no'}</p>
      <p>hasPass:{globalStore.hasPass ? 'hasPass' : 'no'}</p>
      <p>accountLength:{globalStore.accountLength}</p> */}
      <ToastContainer autoClose={5000} hideProgressBar={true} />
    </div>
  )
}

export default observer(App)
