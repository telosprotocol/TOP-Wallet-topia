import Nav from '../components/Nav'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import FormatMessage from '../store/FormatMessage'

import ImportTokens from '../components/ImportTokens'

function TokenImport1() {
  let navigate = useNavigate()

  const [step, setStep] = useState(1)

  function handleBack() {
    if (step === 1) {
      navigate(-1)
      return
    }
    if (step === 2) {
      setStep(1)
    }
  }

  return (
    <>
      <main>
        <Nav backCallback={handleBack}>
          <FormatMessage id="ImportTokens"></FormatMessage>
        </Nav>
        <div>
          <ImportTokens
            step={step}
            setStep={setStep}
            requestClose={() => {
              setTimeout(() => {
                navigate(-1)
              }, 1000)
            }}
          ></ImportTokens>
        </div>
      </main>
    </>
  )
}

export default TokenImport1
