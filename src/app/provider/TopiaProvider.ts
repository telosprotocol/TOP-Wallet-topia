import { topialog } from '../../lib/log'
import { BaseProvider } from './BaseProvider'
import { getRpcPromiseCallback } from './utils'

const evmQueue: any = {}

function evmSendMessage(data: any, res: any, end: any) {
  const sequence_id = Math.random()
  evmQueue[sequence_id] = {
    end,
    res,
    req: data,
  }
  window.postMessage(
    {
      target: 'Topia-contentscript',
      type: 'evm',
      sequence_id,
      data,
    },
    '*'
  )
}

window.addEventListener(
  'message',
  function (event) {
    if (event.source !== window) {
      return
    }
    if (event.data.target !== 'Topia-inpage-evm') {
      return
    }
    if (!window.topiaEthereum) {
      return
    }
    if (event.data.method === 'accountChange') {
      window.topiaEthereum._handleAccountsChanged(event.data.params)
    }
    if (event.data.method === 'chainChange') {
      window.topiaEthereum._handleChainChanged(event.data.params)
    }
    if (evmQueue[event.data.sequence_id]) {
      const { end, res, req } = evmQueue[event.data.sequence_id]
      topialog('event.data', event.data, req)
      if (!event.data.data || !event.data.data.code) {
        res.result = event.data.data
        if (req.method === 'eth_chainId') {
          window.topiaEthereum.chainId = res.result
        }
        end()
      } else {
        res.error = event.data.data
        end()
      }
    }
  },
  false
)

export class TopiaProvider extends BaseProvider {
  constructor() {
    super({})
    this._rpcEngine.push(async (req, res, next, end) => {
      topialog('topia _rpcEngine', req)
      evmSendMessage(req, res, end)
    })

    const res: any = {}
    evmSendMessage({ method: 'topia_getProviderState' }, res, () => {
      this._initializeState(res.result)
    })
  }
  public isTopia = true
  async enable(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      try {
        this._rpcRequest(
          { method: 'eth_requestAccounts', params: [] },
          getRpcPromiseCallback(resolve, reject)
        )
      } catch (error) {
        reject(error)
      }
    })
  }
}
