const writeText = (text) =>
  new Promise((resolve, reject) => {
    // Create hidden input with text
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    document.body.append(el)
    // Select the text and copy to clipboard
    el.select()
    const success = document.execCommand('copy')
    el.remove()
    if (!success) reject(new Error('Unable to write to clipboard'))
    resolve(text)
  })
const clipboard = { writeText }

export { clipboard }
