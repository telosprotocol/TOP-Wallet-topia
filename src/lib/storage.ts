export const storageSet = <T>(items: T) => {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      resolve(undefined)
    })
  })
}

export const storageGet = <T>(
  key: string | string[] | { [key: string]: any } | null
): Promise<T> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (res) => {
      resolve(res as T)
    })
  })
}

export const storageClear = () => {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      resolve(undefined)
    })
  })
}
