import { useStore } from '.'

function useFormatMessage({
  id,
  defaultMessage = id,
  params,
}: {
  id: string
  defaultMessage?: any
  params?: any
}) {
  const { localeStore } = useStore()
  const text = localeStore.getLocaleMessage(id, params, defaultMessage)

  return text
}

export default useFormatMessage
