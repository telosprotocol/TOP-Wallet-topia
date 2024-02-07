import { initializeProvider } from './provider/initializeInpageProvider'

initializeProvider()

const queue: any = {}
const eventHandles: any = {
  accountChange: [],
  chainChange: [],
}

function sendMessage(type: any, data: any, cb?: any) {
  return new Promise((resolve, reject) => {
    const sequence_id = Math.random()
    queue[sequence_id] = {
      resolve,
      reject,
      cb,
    }
    window.postMessage(
      {
        target: 'Topia-contentscript',
        type,
        sequence_id,
        data,
      },
      window.location.origin
    )
  })
}

window.Topia = function Topia() {}

window.Topia.prototype.enable = function () {
  return sendMessage('clientEnable', {})
}

window.Topia.prototype.getAccount = function (cb: any) {
  return sendMessage('clientGetAccount', null, cb)
}

window.Topia.prototype.getChain = function (cb: any) {
  return sendMessage('clientGetChain', null, cb)
}
window.Topia.prototype.walletSwitchChain = function (chainType: string) {
  return sendMessage('wallet_switchChain', chainType)
}

window.Topia.prototype.send = function (data: any) {
  const sequence_id = Math.random()
  window.postMessage(
    {
      target: 'Topia-contentscript',
      type: 'clientSendTx',
      sequence_id,
      data,
    },
    window.location.origin
  )
  function on(type: any, callback: any) {
    let queueCallback = queue[sequence_id]
    if (!queueCallback) {
      queueCallback = {}
    }
    if (type === 'error') {
      queueCallback.reject = callback
    }
    if (type === 'receipt') {
      queueCallback.resolve = callback
    }
    if (type === 'transactionHash') {
      queueCallback.cb = callback
    }
    queue[sequence_id] = queueCallback
    return { on }
  }
  return {
    on,
  }
}

window.Topia.prototype.on = function (type: any, fn: any) {
  if (typeof fn === 'function') {
    if (type === 'accountChange') {
      eventHandles.accountChange.push(fn)
    } else if (type === 'chainChange') {
      eventHandles.chainChange.push(fn)
    }
  }
}

window.addEventListener(
  'message',
  function (event) {
    if (event.source !== window) {
      return
    }
    if (event.data.target !== 'Topia-inpage') {
      return
    }
    if (queue[event.data.sequence_id]) {
      if (event.data.errorCode) {
        queue[event.data.sequence_id].reject(event.data)
      } else {
        if (event.data.type === 'cb') {
          if (typeof queue[event.data.sequence_id].cb === 'function') {
            queue[event.data.sequence_id].cb(event.data.data)
          }
        } else {
          queue[event.data.sequence_id].resolve(event.data.data)
        }
      }
    } else {
      if (event.data.type === 'accountChange') {
        eventHandles.accountChange.forEach((fn: any) => fn(event.data.data))
      } else if (event.data.type === 'chainChange') {
        eventHandles.chainChange.forEach((fn: any) => fn(event.data.data))
      }
    }
  },
  false
)
window.topia = new window.Topia()
