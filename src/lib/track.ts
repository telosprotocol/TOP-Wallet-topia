import { sha256 } from 'js-sha256'
import { getBasicAccount } from '../app/account'
import manifest from '../app/manifest.json'
import { getChainType } from '../app/utils'
import topiaId from './topiaId'

type IpInfo = {
  ip: string
}
let _appname: string,
  _category: string,
  isInit = false
const eventPool: any = []
let ostype: string

export function initTrack({
  appname,
  category,
}: {
  appname: string
  category: string
}) {
  if (!appname) {
    throw new Error('Need appname')
  }
  if (!category) {
    throw new Error('Need category')
  }
  _appname = appname
  _category = category
  getOsVersion()
  isInit = true
  eventPool.forEach(async (item: any) => {
    await track(item)
  })
}

export function trackPV(params = {}) {
  track({
    ...params,
    event: 'pageview',
  })
}

export async function track(params: any = {}) {
  if (!isInit) {
    eventPool.push(params)
    return
  }
  try {
    const timestamp = Date.now()
    let visitorid = ''
    try {
      const tId: any = await (topiaId as any).init()
      const result: any = await tId.get()
      visitorid = result.visitorId
    } catch (error) {}
    const event = params.event
    delete params.event
    // result.visitorId
    const ip = await getIp()
    const ba = await getBasicAccount()
    const chainType = await getChainType()
    const msg = {
      ip: ip.ip,
      ostype,
      actiontime: timestamp,
      category: _category,
      appname: _appname,
      appVersion: manifest.version,
      event: event,
      properties: {
        source: '3',
        evn: process.env.REACT_APP_REPORT_ENV, // dn|pn
        chain_name: chainType,
        chain_id: '',
        visitor_id: visitorid,
        account: ba.address,
        language: navigator.language,
        local_timestamp: timestamp,
        time_zone_offset: `GMT+${new Date().getTimezoneOffset() / -60}:00`,
        user_agent: navigator.userAgent,
        href: window.location.href,
        ...params,
      },
    }
    const msgStr = JSON.stringify(msg)
    await fetch(
      (process as any).env.REACT_APP_REPORT_API + '/report/log/async',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'tz_block',
          sign: msgHash(msgStr),
          msg: msgStr,
        }),
      }
    )
  } catch (error) {}
}

function msgHash(msgStr: string) {
  if (msgStr.length <= 128) {
    return sha256(msgStr)
  }
  return sha256(
    msgStr.substring(0, 64) +
      msgStr.substring(msgStr.length - 64, msgStr.length)
  )
}

function getOsVersion() {
  ostype = 'Unknown'
  if (window.navigator.userAgent.indexOf('Windows') !== -1) ostype = 'Windows'
  if (window.navigator.userAgent.indexOf('Mac') !== -1) ostype = 'Mac/iOS'
  if (window.navigator.userAgent.indexOf('X11') !== -1) ostype = 'UNIX'
  if (window.navigator.userAgent.indexOf('Linux') !== -1) ostype = 'Linux'
}

async function getIp(): Promise<IpInfo> {
  return {
    ip: '127.0.0.1',
  }
}
