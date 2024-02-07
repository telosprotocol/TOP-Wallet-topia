import { generateMnemonic, validateMnemonic as validateMnemonic1 } from 'bip39'
import { ethers } from 'ethers'
import { IBaAccount, IChainType } from '../types'
import { ethAddressToTop } from './utils'

export function getRandomMnemonic() {
  const mnemonic = generateMnemonic(128)
  return mnemonic
}

export function validateMnemonic(mnemonic: string) {
  return validateMnemonic1(mnemonic)
}

export function mnemonicToKey(
  mnemonic: string,
  index: number,
  chainType: IChainType,
  topAccountType?: 'T8' | 'T0',
  topjs?: any
): IBaAccount {
  if (!mnemonic) {
    mnemonic = getRandomMnemonic()
  }
  const wallet = ethers.Wallet.fromMnemonic(
    mnemonic,
    `m/44'/${chainTypeToBipCoinType(chainType)}'/${index}'/0/0`
  )
  let address = ''
  if (topAccountType === 'T0') {
    const tmpAccount = topjs.accounts.generate({
      privateKey: wallet._signingKey().privateKey,
      addressType: '0',
    })
    address = tmpAccount.address
  } else {
    address = getAddress(chainType, wallet.address, topAccountType)
  }
  return {
    privateKey: wallet._signingKey().privateKey,
    address,
    mnemonic,
  }
}

function getAddress(
  chainType: IChainType,
  address: string,
  topAccountType?: 'T8' | 'T0'
) {
  if (chainType === 'TOP') {
    if (!topAccountType) {
      topAccountType = 'T8'
    }
    return address.toLowerCase().replace(/^0x/, topAccountType + '0000')
  }
  if (chainType === 'TOPEVM') {
    return ethAddressToTop(address)
  }
  return address
}

function chainTypeToBipCoinType(chainType: IChainType): string {
  if (chainType === 'TOP' || chainType === 'TOPEVM') {
    return '562'
  }
  if (chainType === 'FEVM' || chainType === 'FIL') {
    return '461'
  }
  if (chainType === 'BSC') {
    return '9006'
  }
  return '60'
}
