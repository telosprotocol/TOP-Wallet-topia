import { observer } from 'mobx-react-lite'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { onAccountChange, onChainChange, onDataSuccess } from '../lib/appPort'
import { useEffect, useRef, useState } from 'react'
import styles from '../styles/TopContractTx.module.scss'
import Button from '../components/Button'
import transferArrow from '../assets/images/transferArrow.svg'
import topLogo from '../assets/images/top.svg'
import clock from '../assets/images/clock.svg'
import vote from '../assets/images/vote.svg'

import { useStore } from '../store'
import BigNumber from 'bignumber.js'
import Modal from '../components/Modal'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import { toast } from 'react-toastify'
import { track } from '../lib/track'
import { topialog } from '../lib/log'
import { formatBalance } from '../lib'
import { topSystemContractSend } from '../app/tx'

const methodsMap: any = {
  stakeVote: 'pledge_token_vote',
  unstakeVote: 'redeem_token_vote',
  voteNode: 'vote',
  unVoteNode: 'abolish_vote',
  claimVoterDividend: 'claimVoterDividend',
}

function TopContractTx() {
  const { accountStore, globalStore } = useStore()
  let navigate = useNavigate()

  let [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(false)

  const [amount, setAmount] = useState(0)

  const [voteCount, setVoteCount] = useState(0)

  const [params, setParams] = useState<any>({})
  const [origin, setOrigin] = useState('')

  const seqIdRef = useRef<string>('')

  useEffect(() => {
    function handleChange() {
      if (seqIdRef.current) {
        window.close()
      } else {
        navigate('/')
      }
    }
    const clear1 = onAccountChange(handleChange)
    const clear2 = onChainChange(handleChange)
    return () => {
      clear1()
      clear2()
    }
  }, [navigate])

  useEffect(() => {
    const sequence_id = searchParams.get('sequence_id')
    if (sequence_id) {
      setOrigin(searchParams.get('origin') || '')
      const p = JSON.parse(searchParams.get('params') || '{}')
      if (p.txMethod === 'stakeVote') {
        setAmount(Number(p.topAmount))
        delete p.topAmount
      }
      setParams(p)
      if (p.txMethod === 'voteNode') {
        setVoteCount(
          p.voteInfoArray.reduce((a: any, b: any) => {
            return a + Number(b.voteCount)
          }, 0)
        )
      }
      seqIdRef.current = sequence_id
    }
  }, [searchParams])

  const [showModal, setShowModal] = useState(false)

  function onCancel() {
    if (seqIdRef.current) {
      window.close()
    } else {
      navigate('/')
    }
  }

  async function handleConfirmClick() {
    try {
      if (
        new BigNumber(amount)
          .plus(0.1)
          .isGreaterThan(Number(accountStore.balanceCoin))
      ) {
        toast.error(getLocaleMessage('InsufficientBalance1'))
        return
      }
      setLoading(true)
      sendTransferTx(globalStore.tmpData)
    } catch (error: any) {
      toast.error(error.message || 'Error')
      setLoading(false)
    }
  }

  async function sendTransferTx(pass: string) {
    try {
      const sendData = {
        ...params,
      }
      const sequence_id = searchParams.get('sequence_id')

      const txHash = await topSystemContractSend(
        sendData,
        pass,
        methodsMap[params.txMethod],
        amount
      )
      track({
        event: params.txMethod,
        from: accountStore.currentAccount.address,
        tx_hash: txHash,
        ...sendData,
      })
      if (sequence_id) {
        await onDataSuccess({
          sequence_id,
          data: {
            tx_hash: txHash,
            from: accountStore.currentAccount.address,
            errno: 0,
          },
        })
        window.close()
      } else {
        accountStore.setHomeSelectTab(2)
        accountStore.updateTxList()
        navigate('/')
      }
    } catch (error) {
      toast.error('Error')
      topialog(error)
      setLoading(false)
    }
  }

  return (
    <>
      <main>
        <div className={styles.top}>
          <span>{accountStore.currentAccount.name}</span>
          <img src={transferArrow} alt="arrow"></img>
          <span>
            <FormatMessage id="SystemContract"></FormatMessage>
          </span>
        </div>
        <div className={styles.centerInfo}>
          <div className={styles.text1}>{origin}</div>
          <div className={styles.actions}>
            <span>{methodsMap[params.txMethod] || params.txMethod}</span>
            {params.txMethod === 'stakeVote' && (
              <span>lockTime: {params.lockTime}</span>
            )}
          </div>
          <div className={styles.actionImg}>
            {params.txMethod === 'stakeVote' && (
              <img src={topLogo} alt="logo"></img>
            )}
            {params.txMethod === 'voteNode' && (
              <img src={vote} alt="logo"></img>
            )}
          </div>
          {params.txMethod === 'stakeVote' && (
            <>
              <div className={styles.text2}>{formatBalance(amount)} TOP</div>
              <div className={styles.text3}>
                ${formatBalance(accountStore.coinPrice * Number(amount))}
              </div>
            </>
          )}
          {params.txMethod === 'voteNode' && (
            <div className={styles.text2}>{formatBalance(voteCount)} Vote</div>
          )}
        </div>
        <div className={styles.transfer}>
          <div className={styles.text4}>
            <FormatMessage id="DETAILS"></FormatMessage>
          </div>
          <div className={styles.maxGasFee}>
            <div className={styles.maxLeft}>
              <FormatMessage id="MaxGasFee"></FormatMessage>
            </div>
            <div className={styles.maxRight}>
              ${formatBalance(accountStore.coinPrice * 0.1)}
              <span>0.1 TOP</span>
            </div>
          </div>
          <div className={styles.inMin}>
            <img src={clock} alt="clock"></img>
            <FormatMessage id="LikelyIn"></FormatMessage>
          </div>
          <div className={styles.line}></div>
          <div className={styles.maxGasFee}>
            <div className={styles.maxLeft}>
              <FormatMessage id="Total"></FormatMessage>
            </div>
            <div className={styles.maxRight}>
              ${formatBalance((Number(amount) + 0.1) * accountStore.coinPrice)}
            </div>
          </div>
          <div className={styles.total}>
            <div></div>
            <div>{formatBalance(Number(amount) + 0.1)} TOP</div>
          </div>
          <div className={styles.line}></div>
          <div className={styles.btns}>
            <div>
              <Button onClick={onCancel} type="default">
                <FormatMessage id="Reject"></FormatMessage>
              </Button>
            </div>
            <div>
              <Button
                type="primary"
                loading={loading}
                onClick={handleConfirmClick}
              >
                <FormatMessage id="Confirm"></FormatMessage>
              </Button>
            </div>
          </div>
        </div>
        <Modal
          shouldCloseOnOverlayClick={true}
          open={showModal}
          onClose={() => setShowModal(false)}
          showClose={false}
          title=""
        >
          <div className={styles.modalContent}>
            <div className={styles.desc}>
              <FormatMessage id="Note01TOP"></FormatMessage>
            </div>
          </div>
        </Modal>
        
      </main>
    </>
  )
}

export default observer(TopContractTx)
