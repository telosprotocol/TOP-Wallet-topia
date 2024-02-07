import CryptoJS from 'crypto-js'

export function Decrypt(word, p) {
  let decrypt = CryptoJS.AES.decrypt(word, p)
  return decrypt.toString(CryptoJS.enc.Utf8)
}

export function Encrypt(word, p) {
  var encrypted = CryptoJS.AES.encrypt(word, p)
  return encrypted.toString()
}
