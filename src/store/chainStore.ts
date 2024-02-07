import { makeAutoObservable, runInAction } from 'mobx'
import { defaultData } from '../app/background'
import { getChainType } from '../app/utils'
import { changeChain, onAccountChange, onChainChange } from '../lib/appPort'
import { ICHainItem, IChainList, IChainType } from '../types'

class ChainStore {
  chainListAll: IChainList = defaultData.chainList
  chainType: IChainType = 'TOP'

  constructor() {
    makeAutoObservable(this)

    onChainChange(() => {
      this.init()
    })
    onAccountChange(() => {
      this.init()
    })

    this.init()
  }

  async init() {
    const chainTypeRes = await getChainType()
    runInAction(() => {
      this.chainType = chainTypeRes
    })
  }

  get chainList() {
    return [
      this.chainListAll.TOPEVM.chainList[0],
      this.chainListAll.TOP.chainList[0],
      this.chainListAll.FIL.chainList[0],
      this.chainListAll.ETH.chainList[0],
      this.chainListAll.BSC.chainList[0],
    ]
  }

  get selectChainDetail(): ICHainItem {
    if (this.chainList.length > 0) {
      return this.chainList.filter(item => item.chainType === this.chainType)[0]
    } else {
      return {
        rpc: '',
        name: '',
        browser: '',
        topRpc: '',
        symbol: '',
        chainType: 'TOP',
      }
    }
  }

  changeChain(chainType: IChainType) {
    runInAction(() => {
      this.chainType = chainType
    })
    changeChain(chainType)
  }
}
export default ChainStore
