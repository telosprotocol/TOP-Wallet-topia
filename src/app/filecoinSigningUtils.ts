import { IBaAccount } from '../types'
import { ethers } from 'ethers'
import { keyPairFromPrivateKey } from '@nodefactory/filecoin-address'

export function filMnemonicToKey(mnemonic: string, index: number): IBaAccount {
  
  const wallet = ethers.Wallet.fromMnemonic(mnemonic, `m/44'/461'/${index}'/0/0`)
  const privateKey = wallet._signingKey().privateKey
  const generatedKeypair = keyPairFromPrivateKey(privateKey, 'f')
  return {
    privateKey,
    address: generatedKeypair.address,
    mnemonic,
  }
}

export function filProvateKeyToAddress(privateKey: string): string {
  const generatedKeypair = keyPairFromPrivateKey(privateKey, 'f')
  return generatedKeypair.address
}
