import { TopiaProvider } from './TopiaProvider'

export function initializeProvider() {
  if (!window.topiaEthereum) {
    const provider = new TopiaProvider()
    window.topiaEthereum = provider
    return provider
  }
}
