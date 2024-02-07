import { getAccount, getTopJs } from '../app/account'
import { topialog } from '../lib/log'
import { storageGet } from '../lib/storage'
import { ICurrency } from '../types'
import topiaId from '../lib/topiaId'

const priceCache: any = {
  CNY: {},
  USD: {},
}

export async function getEthToTopExchangeRatio() {
  const topjs = await getTopJs()
  const cgpResponse = await topjs.getCGP()
  try {
    return cgpResponse.data.eth_to_top_exchange_ratio
  } catch (error) {
    return 5004220
  }
}

export async function topGasFee() {
  const gas = 945
  const { available_gas } = await getAccount(() => {}, true)
  if (
    typeof available_gas === 'undefined' ||
    gas - Math.abs(available_gas) < 0
  ) {
    return 0
  } else {
    const topjs = await getTopJs()
    const cgpResponse = await topjs.getCGP()
    const txDepositGasExchangeRatio = Number(
      cgpResponse.data.tx_deposit_gas_exchange_ratio
    )
    const transferFree =
      Math.abs(gas - Math.abs(available_gas < 0 ? 0 : available_gas)) *
      txDepositGasExchangeRatio

    return Number(transferFree / 1000000)
  }
}

export async function getTopPrice(symbol: string, account: string) {
  const res = await storageGet<{ currency: ICurrency }>(['currency'])
  const currency = res.currency
  if (priceCache[currency][symbol]) {
    return priceCache[currency][symbol]
  }
  try {
    const id = symbolToId(symbol.toUpperCase())
    if (id === 0) {
      return 0
    }
    let visitorid = ''
    try {
      const tId: any = await (topiaId as any).init()
      const result: any = await tId.get()
      visitorid = result.visitorId
    } catch (error) {}

    if (process.env.REACT_APP_REPORT_ENV === 'dn') {
      return 1
    }

    const fetchRes = await fetch(
      `${
        (process as any).env.REACT_APP_PRICE_API
      }/api/v2/app/eth/get_coin_price`,
      {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        headers: {
          'Content-Type': 'application/json',
          visitorid: visitorid || '',
          account: account || '',
        },
        body: JSON.stringify({ vsCurrency: currency, coinId: id }),
      }
    )
    const res1 = await fetchRes.json()
    if (res1.message === 'OK') {
      priceCache[currency][symbol] = res1.result.current_price
      return res1.result.current_price
    }
    return 0
  } catch (error) {
    topialog('getTopPrice error')
    return 0
  }
}

function symbolToId(symbol: string): number {
  const sMap: any = {
    ETH: 1,
    BNB: 2,
    MKR: 3,
    LINK: 4,
    CRO: 5,
    VEN: 6,
    BAT: 7,
    USDC: 8,
    OMG: 9,
    HOT: 10,
    TUSD: 11,
    ZIL: 12,
    NPXS: 13,
    REP: 14,
    ZRX: 15,
    ICX: 16,
    PAX: 17,
    AOA: 18,
    HT: 19,
    BTM: 20,
    AE: 21,
    IOST: 22,
    QBIT: 23,
    DENT: 24,
    ENJ: 25,
    THETA: 26,
    KCS: 27,
    MCO: 28,
    ELF: 29,
    SNT: 30,
    GNT: 31,
    HEDG: 32,
    XIN: 33,
    WAX: 34,
    WTC: 35,
    INB: 36,
    DAI: 37,
    VEST: 38,
    EGT: 39,
    NAS: 40,
    LOOM: 41,
    DGD: 42,
    NULS: 43,
    MXM: 44,
    LRC: 45,
    SAN: 46,
    ODEM: 47,
    MANA: 48,
    AION: 49,
    PPT: 50,
    ORBS: 51,
    CCCX: 52,
    NEXO: 53,
    R: 54,
    FSN: 55,
    WIC: 56,
    QASH: 57,
    NET: 58,
    CELR: 59,
    FTM: 60,
    MATIC: 61,
    POWR: 62,
    QKC: 63,
    LAMB: 64,
    LA: 65,
    EKT: 66,
    KNC: 67,
    BNT: 68,
    IPC: 69,
    ABT: 70,
    ITC: 71,
    ENG: 72,
    POLY: 73,
    FUN: 74,
    CMT: 75,
    REN: 76,
    META: 77,
    BCZERO: 78,
    DGTX: 79,
    STORJ: 80,
    BRD: 81,
    IOTX: 82,
    QNT: 83,
    ECOREAL: 84,
    CTXC: 85,
    EURS: 86,
    C20: 87,
    UGAS: 88,
    RLC: 89,
    VERI: 90,
    CENNZ: 91,
    CVC: 92,
    BIX: 93,
    PAY: 94,
    LINA: 95,
    LBA: 96,
    SNX: 97,
    COSM: 98,
    MFT: 99,
    ICN: 100,
    CND: 101,
    EDO: 102,
    MTL: 103,
    AGI: 104,
    INO: 105,
    MEDX: 106,
    GNO: 107,
    ROX: 108,
    QRL: 109,
    PPP: 110,
    BTU: 111,
    DAC: 112,
    DEW: 113,
    ANKR: 114,
    HPB: 115,
    NKN: 116,
    SXDT: 117,
    TEL: 118,
    TTC: 119,
    CAJ: 120,
    UTK: 121,
    GTO: 122,
    KAN: 123,
    GUSD: 124,
    EVX: 125,
    STORM: 126,
    TOP: 127,
    ANT: 128,
    DRGN: 129,
    MDA: 130,
    POE: 131,
    DAPS: 132,
    AERGO: 133,
    NOAH: 134,
    RDN: 135,
    OCN: 136,
    RHOC: 137,
    FET: 138,
    HUM: 139,
    KIN: 140,
    FX: 141,
    WABI: 142,
    TKN: 143,
    DATA: 144,
    EDR: 145,
    QSP: 146,
    GVT: 147,
    OAX: 148,
    REQ: 149,
    DENTACOIN: 150,
    WIX: 151,
    LKY: 152,
    RCN: 153,
    SCRL: 154,
    MOC: 155,
    TCT: 156,
    RNT: 157,
    MAN: 158,
    VITE: 159,
    PLA: 160,
    RUFF: 161,
    TNT: 162,
    BZ: 163,
    TRIO: 164,
    SRN: 165,
    NEC: 166,
    FOAM: 167,
    CS: 168,
    NCASH: 169,
    BZNT: 170,
    MDS: 171,
    PRO: 172,
    BLZ: 173,
    SPND: 174,
    AUTO: 175,
    PMA: 176,
    INS: 177,
    MET: 178,
    VIBE: 179,
    ETHOS: 180,
    DX: 181,
    CWV: 182,
    XET: 183,
    LEND: 184,
    B2BX: 185,
    VEE: 186,
    ADX: 187,
    IHT: 188,
    LGO: 189,
    UTT: 190,
    DMT: 191,
    ZIP: 192,
    NMR: 193,
    BCV: 194,
    SWM: 195,
    SNGLS: 196,
    BOX: 197,
    APIS: 198,
    DNT: 199,
    SNM: 200,
    CHX: 201,
    DLT: 202,
    TAAS: 203,
    KCASH: 204,
    EDG: 205,
    DROP: 206,
    GOT: 207,
    MTH: 208,
    TEN: 209,
    KEY: 210,
    SOC: 211,
    LXT: 212,
    APPC: 213,
    UUU: 214,
    XYO: 215,
    LOC: 216,
    ARN: 217,
    QNTU: 218,
    BMC: 219,
    VIB: 220,
    CVT: 221,
    GTC: 222,
    POA20: 223,
    RFR: 224,
    SWFTC: 225,
    EVN: 226,
    INT: 227,
    WPR: 228,
    ADST: 229,
    YOYOW: 230,
    SALT: 231,
    SUB: 232,
    MGO: 233,
    AEN: 234,
    PAI: 235,
    CDT: 236,
    UPP: 237,
    COVA: 238,
    ABYSS: 239,
    MWAT: 240,
    AOG: 241,
    GEN: 242,
    PLR: 243,
    OCEAN: 244,
    TIOX: 245,
    CNUS: 246,
    FUEL: 247,
    BHPC: 248,
    AST: 249,
    DOCK: 250,
    TRAC: 251,
    UTNP: 252,
    PCH: 253,
    SEELE: 254,
    VIDT: 255,
    HYDRO: 256,
    AMB: 257,
    NPX: 258,
    BCPT: 259,
    TRXC: 260,
    FLUZ: 261,
    AURA: 262,
    BTO: 263,
    GNX: 264,
    // NET: 265,
    ARC: 266,
    CPC: 267,
    ADT: 268,
    JNT: 269,
    PRE: 270,
    ISR: 271,
    GSC: 272,
    // BOX: 273,
    CNN: 274,
    CBT: 275,
    CAS: 276,
    GET: 277,
    PLBT: 278,
    LUN: 279,
    FTI: 280,
    ABL: 281,
    SKM: 282,
    ZCO: 283,
    MRPH: 284,
    FOTA: 285,
    PST: 286,
    ERC20: 287,
    ULT: 288,
    QUN: 289,
    MLN: 290,
    MTC: 291,
    CREDO: 292,
    SSP: 293,
    CFI: 294,
    CZR: 295,
    CHSB: 296,
    MTV: 297,
    MXC: 298,
    IHF: 300,
    DIVX: 301,
    MDT: 302,
    WET: 303,
    BAAS: 304,
    CEN: 305,
    ART: 306,
    LND: 307,
    RMESH: 308,
    CPT: 309,
    BTC: 310,
    LTC: 315,
    DASH: 316,
    USDT: 317,
    EOS: '710875121446813696',
    GRT: '714429205869232128',
    KAI: '719589611768123392',
    FIL: '738446875891339264',
    SUSHI: '753568841354711040',
    UNI: '756157067072376832',
  }
  return sMap[symbol] || 0
}
