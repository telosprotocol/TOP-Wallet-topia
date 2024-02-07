function addJs() {
  var file = chrome.runtime.getURL('inpage.js')
  var s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = file
  document.documentElement.appendChild(s)
}
addJs()

let port: chrome.runtime.Port | null = null
initPort()
function initPort() {
  port = chrome.runtime.connect()
  port.onMessage.addListener(function (message) {
    window.postMessage(message, window.location.origin)
  })
  port.onDisconnect.addListener(function () {
    port = null
  })
  return port
}

window.addEventListener(
  'message',
  function (event) {
    if (event.source !== window) {
      return
    }

    if (event.data.target !== 'Topia-contentscript') {
      return
    }
    if (!port) {
      initPort()
    }
    port?.postMessage({
      ...event.data,
      origin: event.origin,
      target: 'Topia-inpage',
    })
  },
  false
)
