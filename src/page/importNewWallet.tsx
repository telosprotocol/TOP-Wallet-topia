import InitWallet from '../components/InitWallet'
import Nav from '../components/Nav'
import { useNavigate } from 'react-router-dom'
import { store } from '../store'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'

function ImportNewWallet() {
  let navigate = useNavigate()
  async function handleNext(data: any) {
    store.globalStore.updateTmpData(data)
    navigate('/importNewMnemonic')
  }
  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="ImportWallet1"></FormatMessage>
        </Nav>
        <InitWallet
          onCancel={() => {
            navigate(-1)
          }}
          onNext={(data: any) => {
            handleNext(data)
          }}
          cancelText={getLocaleMessage('Cancel2')}
        ></InitWallet>
      </main>
    </>
  )
}

export default ImportNewWallet
