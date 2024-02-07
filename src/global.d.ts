import Web3 from 'web3'

declare global {
  interface Window {
    ethereum: any
    topiaEthereum: any
    web3: Web3
    topProvider: any
    Topia: any
    topia: any
    clipboardData: any
    ledgerTransport: any
  }
}
declare module '*.scss'