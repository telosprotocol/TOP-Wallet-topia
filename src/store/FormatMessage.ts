import { store } from '.'
import useFormatMessage from './useFormatMessage'

function FormatMessage(props: any) {
  const text = useFormatMessage(props)
  return text
}
export default FormatMessage

export const getLocaleMessage = (options: any) => {
  if (typeof options === 'string') {
    options = {
      id: options,
    }
  }
  const { id, params, defaultMessage } = options

  const { localeStore } = store
  const text = localeStore.getLocaleMessage(id, params, defaultMessage)
  return text
}
