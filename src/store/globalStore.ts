import { makeAutoObservable, runInAction } from 'mobx'
import md5 from 'md5'
import { store } from '.'
import { changeCurrency } from '../app/utils'
import { getPageInitData, onAccountChange } from '../lib/appPort'
import { ICurrency, IIsBackupMnemonic, ILocale } from '../types'
import { storageGet } from '../lib/storage'

class GlobalStore {
  needLogin = true
  hasPass = false
  accountLength = 0
  isInit = false
  currency: ICurrency = 'USD'
  isBackupMnemonic = false
  nextPage = ''
  tmpData: string = ''
  _data: any = {}

  showBackupModal = false

  constructor() {
    makeAutoObservable(this)

    const init = async () => {
      if (process.env.NODE_ENV === 'production') {
        const res = await getPageInitData<{
          accountLength: number
          needLogin: boolean
          locale: ILocale
          isBackupMnemonic: IIsBackupMnemonic
          currency: ICurrency
          hasPass: boolean
        }>()
        runInAction(() => {
          this.accountLength = res.accountLength
          this.needLogin = res.needLogin
          store.localeStore.toogleLan(res.locale as ILocale, false)
          this.isBackupMnemonic = res.isBackupMnemonic
          this.currency = res.currency
          this.isInit = true
          this.hasPass = res.hasPass
        })
      } else {
        this.accountLength = 1
        this.needLogin = false
        this.isBackupMnemonic = true
        this.isInit = true
        this.hasPass = false
      }
    }

    init()

    onAccountChange(() => {
      init()
    })
  }

  async setTmpDataWithMd5(d: string) {
    const res = await storageGet<{
      salt: string
    }>(['salt'])
    this.tmpData = md5(d + res.salt)
  }
  async setTmpData(d: string) {
    this.tmpData = d
  }

  async updateCurrency(c: ICurrency) {
    runInAction(() => {
      this.currency = c
    })
    await changeCurrency({ currency: c })
    store.accountStore.updateTopPrice()
  }

  updateBackupStatus() {
    runInAction(() => {
      this.isBackupMnemonic = true
    })

    try {
      chrome.storage.local.set({
        isBackupMnemonic: true,
      })
    } catch (error) {}
  }

  updateTmpData(data: any) {
    this._data = data
  }

  setShowBackupModal(b: boolean) {
    runInAction(() => {
      this.showBackupModal = b
    })
  }

  logout() {
    runInAction(() => {
      this.needLogin = true
    })
  }
}
export default GlobalStore
