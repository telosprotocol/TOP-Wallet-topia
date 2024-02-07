import { makeAutoObservable, runInAction } from 'mobx'
import { getTxList } from '../app/tx'
import {
  addToken,
  getAllAccountList,
  getAllToken,
  getChainTypeDecimals,
  getToken,
  hideToken,
  topAddressToEth,
} from '../app/utils'
import { getWeb3 } from '../eth'
import { accuracy, formatAddress, formatBalance } from '../lib'
import {
  getAccountInfo,
  onAccountChange,
  onChainChange,
  onHashStatusChange,
} from '../lib/appPort'
import { getTopPrice } from '../top'
import {
  IAccountList,
  IBaAccount,
  IChainType,
  ITokenItem,
  ITxItem,
} from '../types'

class AccountStore {
  currentAccount: IBaAccount = { address: '' }

  accountList: IAccountList = {
    TOP: {
      accountList: [],
      selectAccount: '',
    },
    TOPEVM: {
      accountList: [],
      selectAccount: '',
    },
    FIL: {
      accountList: [],
      selectAccount: '',
    },
    FEVM: {
      accountList: [],
      selectAccount: '',
    },
    ETH: {
      accountList: [],
      selectAccount: '',
    },
    BSC: {
      accountList: [],
      selectAccount: '',
    },
  }
  chainType: IChainType = 'TOP'
  transactionsTmpA: ITxItem[] = []
  transactionsTmpB: ITxItem[] = []

  coinPrice = 0

  homeSelectedTab = 1

  isShowMoreClick = 0

  tokenList: ITokenItem[] = []
  tokenListAll: ITokenItem[] = []

  loadingBalance = true
  loadingEthBalance = true
  ethBalanceFormated = '0'

  constructor() {
    makeAutoObservable(this)

    onChainChange(() => {
      this.loadingBalance = true
      this.loadingEthBalance = true
      this.ethBalanceFormated = '0'
      this.coinPrice = 0
      this.currentAccount = {
        ...this.currentAccount,
        balance: 0,
      }
      this.init()
    })

    onAccountChange(() => {
      this.loadingBalance = true
      this.loadingEthBalance = true
      this.ethBalanceFormated = '0'
      this.currentAccount = {
        ...this.currentAccount,
        balance: 0,
      }
      this.init()
    })

    onHashStatusChange(() => {
      this.updateTxList()
    })

    this.init()

    setInterval(() => {
      this.init()
    }, 10000)
  }

  async init() {
    if (process.env.NODE_ENV === 'production') {
      getAllAccountList().then((res) => {
        runInAction(() => {
          res.accountList[res.chainType].accountList = res.accountList[
            res.chainType
          ].accountList.filter((item) => !item.hidden)
          this.accountList = res.accountList
          this.chainType = res.chainType
          this.updateAccount('')

          this.updateTopPrice()

          this.updateTxList()
          setTimeout(() => {
            this.updateTxList()
          }, 5000)
        })
        getToken().then((l) => {
          runInAction(() => {
            this.tokenList = l
          })
        })
        getAllToken().then((l) => {
          runInAction(() => {
            this.tokenListAll = l
          })
        })
      })
    } else {
      accountListShim(this)
    }
  }

  updateAccount(name: string) {
    if (name) {
      this.currentAccount = {
        ...this.currentAccount,
        name: name,
      }
    }
    getAccountInfo<IBaAccount>((ba: IBaAccount) => {
      runInAction(() => {
        this.currentAccount = {
          ...this.currentAccount,
          ...ba,
        }
      })
      // get top eth balance
      console.log(ba.address)
      if (ba.address.startsWith('T600')) {
        getWeb3().then((w3) => {
          w3.eth.getBalance(topAddressToEth(ba.address)).then((v) => {
            console.log('v', v)
            if (this.currentAccount.address !== ba.address) {
              return
            }
            this.loadingEthBalance = false
            this.ethBalanceFormated = formatBalance(accuracy(v, 18, 6))
          })
        })
      }
    }).then((res) => {
      runInAction(() => {
        if (this.currentAccount.address !== res.address) {
          return
        }
        this.loadingBalance = false
        this.currentAccount = res
      })
    })
  }

  updateTopPrice() {
    getTopPrice(
      this.chainType === 'FIL' || this.chainType === 'FEVM' ? 'FIL' : 'TOP',
      this.currentAccount.address
    ).then((price) => {
      runInAction(() => {
        this.coinPrice = Number(price)
      })
    })
  }

  updateTxList() {
    getTxList().then((list: ITxItem[]) => {
      const uniqueList: ITxItem[] = Array.from(
        new Set(list.map((a) => a.txHash))
      )
        .map((txHash: string) => {
          return list.find((a) => a.txHash === txHash)
        })
        .filter((item) => item) as ITxItem[]

      const a = uniqueList
        .filter((item) => item.status === 'sending')
        .sort((a, b) => {
          return b.time - a.time
        })
      const b = uniqueList
        .filter((item) => item.status !== 'sending')
        .sort((a, b) => {
          return b.time - a.time
        })
      runInAction(() => {
        this.transactionsTmpA = a
        this.transactionsTmpB = b
      })
    })
  }

  setHomeSelectTab(t: number) {
    runInAction(() => {
      this.homeSelectedTab = t
    })
  }

  setShowMore() {
    runInAction(() => {
      this.isShowMoreClick = this.isShowMoreClick + 1
    })
  }

  hasAddToken(address: string) {
    return (
      this.tokenListAll.filter(
        (item) => item.address.toLowerCase() === address.toLowerCase()
      ).length > 0
    )
  }

  async addToken(token: ITokenItem) {
    await addToken(token)
    this.tokenList.push(token)
    runInAction(() => {
      this.currentAccount = {
        ...this.currentAccount,
      }
    })
    this.init()
  }

  async removeToken(address: string) {
    await hideToken(address)
    this.init()
  }

  get hideAccountAddress() {
    if (!this.currentAccount.address) {
      return ''
    }
    return formatAddress(this.currentAccount.address, 4, -4)
  }
  get balanceCoin() {
    return accuracy(
      this.currentAccount.balance,
      getChainTypeDecimals(this.chainType),
      6
    )
  }
  get balanceFormated() {
    return formatBalance(this.balanceCoin)
  }

  get balancePrice() {
    return formatBalance((this.balanceCoin as number) * this.coinPrice)
  }

  get allTransactionLength() {
    return this.transactionsTmpA.length + this.transactionsTmpB.length
  }

  get transactions() {
    let tmpA = this.transactionsTmpB.slice(0, 4 + this.isShowMoreClick * 10)
    return [...this.transactionsTmpA, ...tmpA]
  }
}
export default AccountStore

function accountListShim(as: AccountStore) {
  as.accountList = {
    TOP: {
      accountList: [
        {
          type: 'AES',
          name: 'Account 1',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T80000f61e1b145a1c164093d52f8abcc906a1e20237e0',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
      ],
      selectAccount: 'T80000f61e1b145a1c164093d52f8abcc906a1e20237e0',
    },
    TOPEVM: {
      accountList: [
        {
          type: 'AES',
          name: 'Account 2',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
        {
          type: 'AES',
          name: 'Account 232',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e2',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
      ],
      selectAccount: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
    },
    FEVM: {
      accountList: [
        {
          type: 'AES',
          name: 'Account 2',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
        {
          type: 'AES',
          name: 'Account 232',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e2',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
      ],
      selectAccount: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
    },
    ETH: {
      accountList: [
        {
          type: 'AES',
          name: 'Account 2',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
        {
          type: 'AES',
          name: 'Account 232',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e2',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
      ],
      selectAccount: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
    },
    BSC: {
      accountList: [
        {
          type: 'AES',
          name: 'Account 2',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
        {
          type: 'AES',
          name: 'Account 232',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e2',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
      ],
      selectAccount: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
    },
    FIL: {
      accountList: [
        {
          type: 'AES',
          name: 'Account 2',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
        {
          type: 'AES',
          name: 'Account 232',
          mnemonic: '',
          importType: 2, // 1 private key 2 mnemonic
          privateKey:
            '6e4e49cf720264b4e22d7f965ca22d173a3d9f51d007422e645fe5513aadb450',
          address: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e2',
          isSeed: true, // is seed mnemonic account
          accountIndex: 0,
        },
      ],
      selectAccount: 'T60004f61e1b145a1c164093d52f8abcc906a1e20237e0',
    },
  }
  as.chainType = 'TOP'
  as.currentAccount = as.accountList[as.chainType].accountList[0]
}
