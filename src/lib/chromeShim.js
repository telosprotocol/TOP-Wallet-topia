if (process.env.NODE_ENV !== 'production') {
  if (!window.chrome) {
    window.chrome = {}
  }

  if (!window.chrome.runtime) {
    window.chrome.runtime = {
      onRemoved: {
        addListener: () => {},
      },
      onConnect: {
        addListener: () => {},
      },
      onSuspend: {
        addListener: () => {},
      },
      onInstalled: {
        addListener: () => {},
      },
    }
  }
  if (!window.chrome.windows) {
    window.chrome.windows = {
      onRemoved: {
        addListener: () => {},
      },
    }
  }
  if (!window.chrome.storage) {
    window.chrome.storage = {
      local: {
        get: () => {},
        set: () => {},
      },
    }
  }
}
