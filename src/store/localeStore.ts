import { makeAutoObservable, runInAction } from 'mobx'
import { storageSet } from '../lib/storage'
import { ILocale } from '../types'

import en from '../_locales/en/messages.json'
import zh_CN from '../_locales/zh_CN/messages.json'

export default class LocaleStore {
  lan: ILocale = 'en'

  supportLan:any = {
    EN: {
      name: 'en',
      icon: '',
    },
    zh_CN: {
      name: 'zh_CN',
      icon: '',
    },
  }

  messages:any = {
    en,
    zh_CN,
  }

  get isCN() {
    return this.lan === 'zh_CN'
  }

  get currentLanName() {
    return this.supportLan[this.lan].name
  }

  get message() {
    return this.messages[this.lan]
  }

  constructor() {
    makeAutoObservable(this)
  }

  toogleLan(lan: ILocale, updateBg?: boolean) {
    runInAction(() => {
      this.lan = lan
    })
    if (updateBg) {
      storageSet<{locale: ILocale}>({ locale: lan })
    }
  }

  getMessage(id: any, message: any, params: any, defaultMessage: any) {
    let text = message[id]

    if (!text) {
      text = defaultMessage || id
    } else {
      text = text.message
    }
    if (params && Array.isArray(params)) {
      params.forEach((value, index) => {
        text = text.replace(`$${index + 1}`, value)
      })
    }
    return text
  }

  getLocaleMessage(id:any, params: any, defaultMessage: any) {
    return this.getMessage(id, this.message, params, defaultMessage)
  }
}
