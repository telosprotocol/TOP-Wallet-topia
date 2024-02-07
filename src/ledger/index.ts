import TransportWebHID from '@ledgerhq/hw-transport-webhid'

let transport: any

export async function getTransport() {
  if (transport) {
    return transport
  }
  transport = await TransportWebHID.create()
  return transport
}
