import InitWallet from '../components/InitWallet'
import Nav from '../components/Nav'
import { useNavigate } from 'react-router-dom'
import { createAccount } from '../lib/appPort'
import { useState } from 'react'
import { toast } from 'react-toastify'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { useStore } from '../store'

function CreateNewWallet() {
  let navigate = useNavigate()

  const [loading, setLoading] = useState(false)

  const { chainStore } = useStore()

  async function handleNext({ name, pass }: { name: string; pass: string }) {
    setLoading(true)
    const res = await createAccount({
      pass,
      name,
      isBackupMnemonic: false,
      selectChainType: chainStore.chainType,
    })
    if (res) {
      navigate('/backUpTip')
    } else {
      setLoading(false)
      toast('create new wallet error')
    }
  }
  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="CreateWallet"></FormatMessage>
        </Nav>
        <InitWallet
          loading={loading}
          onCancel={() => {
            if (loading) {
              return
            }
            navigate(-1)
          }}
          onNext={(data: any) => {
            if (loading) {
              return
            }
            handleNext(data)
          }}
          cancelText={getLocaleMessage({ id: 'Cancel1' })}
        ></InitWallet>
      </main>
    </>
  )
}

export default CreateNewWallet
