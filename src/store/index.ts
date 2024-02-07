import { createContext, useContext } from 'react'
import ChainStore from './chainStore'
import AccountStore from './accountStore'
import GlobalStore from './globalStore'
import LocaleStore from './localeStore'

export const store = {
  chainStore: new ChainStore(),
  accountStore: new AccountStore(),
  globalStore: new GlobalStore(),
  localeStore: new LocaleStore(),
}
export const StoreContext = createContext(store)
export const useStore = () => {
  return useContext(StoreContext)
}
