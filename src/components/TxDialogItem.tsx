import {
  copyToClipboard,
  formatAddress,
  formatBalance,
  formatTxStatus,
  formatTxTime1,
  openTxScan,
} from '../lib/index'
import { ITxItem } from '../types'
import styles from '../styles/txDialogItem.module.scss'
import FormatMessage from '../store/FormatMessage'
import CopyToast from './CopyToast'
import { useStore } from '../store'
import { useState } from 'react'
import { topialog } from '../lib/log'

function TxDialogItem({ txItem }: { txItem: ITxItem | null }) {
  const [copyText, setCopyText] = useState('CopyTransactionHash')
  const { chainStore } = useStore()

  function copyWithToast(text: any) {
    copyToClipboard(text)
  }
  if (txItem === null) {
    return null
  }
  topialog('txItem', txItem)
  return (
    <div className={styles.modalContent}>
      <div>
        <div className={styles.txDialogItem}>
          <div className={styles.txDialogLabel}>
            <FormatMessage id="Date"></FormatMessage>
          </div>
          <div className={styles.txDialogValue}>
            {formatTxTime1(txItem.time)}
          </div>
        </div>
        <div className={styles.txDialogItem}>
          <div className={styles.txDialogLabel}>
            <FormatMessage id="Status"></FormatMessage>
          </div>
          <div
            className={`${styles.txDialogValue} ${
              txItem.status === 'success' ? styles.colorSuccess : ''
            } ${txItem.status === 'failure' ? styles.colorError : ''}`}
          >
            {formatTxStatus(txItem.status)}
          </div>
        </div>
        <div className={styles.txDialogItem}>
          <div className={styles.txDialogLabel}>
            <FormatMessage id="Amount"></FormatMessage>
          </div>
          <div className={styles.txDialogValue}>
            {formatBalance(txItem.amountShow)} {txItem.symbol}
          </div>
        </div>
        <div className={styles.txDialogItem}>
          <div className={styles.txDialogLabel}>
            <FormatMessage id="Fee1"></FormatMessage>
            {` (${txItem.mainSymbol || txItem.type})`}
          </div>
          <div className={styles.txDialogValue}>
            {txItem.fee && formatBalance(txItem.fee, 9)}{' '}
            {txItem.mainSymbol || txItem.type}
          </div>
        </div>
        {txItem.note && (
          <div className={styles.txDialogItem}>
            <div className={styles.txDialogLabel}>
              <FormatMessage id="Remark"></FormatMessage>
            </div>
            <div className={styles.txDialogValue}>{txItem.note}</div>
          </div>
        )}

        <div className={styles.txDialogItem}>
          <div className={styles.txDialogLabel}>
            <FormatMessage id="From"></FormatMessage>
          </div>
          <div className={styles.txDialogValue}>
            {formatAddress(txItem.from)}
            <CopyToast onClick={() => copyWithToast(txItem.from)}></CopyToast>
          </div>
        </div>

        <div className={styles.txDialogItem}>
          <div className={styles.txDialogLabel}>
            <FormatMessage id="To"></FormatMessage>
          </div>
          <div className={styles.txDialogValue}>
            {formatAddress(txItem.realTo)}
            <CopyToast onClick={() => copyWithToast(txItem.realTo)}></CopyToast>
          </div>
        </div>
        {txItem.txMethod && (
          <div className={styles.txDialogItem}>
            <div className={styles.txDialogLabel}>
              <FormatMessage id="ContractFunction"></FormatMessage>
            </div>
            <div className={styles.txDialogValue}>{txItem.txMethod}</div>
          </div>
        )}
        {txItem.params && (
          <div className={styles.txDialogItem}>
            <div className={styles.txDialogLabel}>
              <FormatMessage id="Params"></FormatMessage>
            </div>
            <div className={styles.txDialogValue}>{txItem.params}</div>
          </div>
        )}
      </div>
      <div className={styles.bottomOpt}>
        <div
          className={
            txItem.status === 'failure' || txItem.type === 'TOPEVM'
              ? styles.optDisable
              : ''
          }
          onClick={() => {
            if (txItem.status === 'failure' || txItem.type === 'TOPEVM') {
              return
            }
            openTxScan(txItem.txHash, chainStore.chainType)
          }}
        >
          <FormatMessage id="ViewOnExplorer"></FormatMessage>
        </div>
        <div
          onClick={() => {
            copyWithToast(txItem.txHash)
            setCopyText('Copied')
            setTimeout(() => {
              setCopyText('CopyTransactionHash')
            }, 1000)
          }}
        >
          <FormatMessage id={copyText}></FormatMessage>
        </div>
      </div>
    </div>
  )
}

export default TxDialogItem
