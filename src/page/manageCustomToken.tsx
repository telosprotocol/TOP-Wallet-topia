import Nav from '../components/Nav'
import { useEffect, useState } from 'react'
import FormatMessage, { getLocaleMessage } from '../store/FormatMessage'
import on from '../assets/images/on.svg'
import off from '../assets/images/off.svg'
import searchImg from '../assets/images/search.svg'
import styles from '../styles/manageCustomToken.module.scss'
import Input from '../components/Input'
import TokenLogo from '../components/TokenLogo'
import { getAllTokens, hideOrShowToken } from '../app/utils'
import { ITokenItem } from '../types'
import { useStore } from '../store'

function ManageCustomToken() {
  const { accountStore } = useStore()

  const [search, setSearch] = useState('')

  const [tokenList, setTokenList] = useState<ITokenItem[]>([])

  const [pageTokenList, setPageTokenList] = useState<ITokenItem[]>([])

  useEffect(() => {
    getAllTokens().then((list) => {
      setTokenList(list)
    })
  }, [])

  useEffect(() => {
    if (search.trim()) {
      const reg = search.trim()
      setPageTokenList(
        tokenList.filter(
          (item) => item.symbol === reg || item.chainType === reg
        )
      )
      return
    }
    setPageTokenList(tokenList)
  }, [tokenList, search])

  async function handleTokenHideChange(token: ITokenItem, toStatus: boolean) {
    token.isHide = toStatus
    setTokenList([...tokenList])
    await hideOrShowToken(
      tokenList.filter((item) => item.chainType === token.chainType),
      token.chainType
    )
    accountStore.init()
  }

  return (
    <>
      <main>
        <Nav>
          <FormatMessage id="ManageCustomToken"></FormatMessage>
        </Nav>
        <div className={styles.mctWrap}>
          <div className={styles.inputWrap}>
            <Input
              value={search}
              onChange={(v: any) => setSearch(v.target.value)}
              placeholder={getLocaleMessage('Tokensymbol')}
            ></Input>
            <img
              className={styles.searchImg}
              alt="Search"
              src={searchImg}
            ></img>
          </div>

          <div className={styles.list}>
            {pageTokenList.map((token, index) => {
              return (
                <div
                  className={styles.item}
                  key={token.address + token.chainType}
                >
                  <div className={styles.lWrap}>
                    <div style={{ marginRight: '13px' }}>
                      <TokenLogo
                        width={42}
                        address={token.address + token.symbol}
                      ></TokenLogo>
                    </div>
                    <div className={styles.flexCenter}>
                      <div className={styles.chainType}>{token.chainType}</div>
                      <div className={styles.symbol}>{token.symbol}</div>
                    </div>
                  </div>
                  {token.isHide ? (
                    <img
                      onClick={() => handleTokenHideChange(token, false)}
                      alt="Off"
                      src={off}
                    ></img>
                  ) : (
                    <img
                      onClick={() => handleTokenHideChange(token, true)}
                      alt="On"
                      src={on}
                    ></img>
                  )}
                </div>
              )
            })}
            {pageTokenList.length === 0 && (
              <div className={styles.noToken}>
                <FormatMessage id="NoToken"></FormatMessage>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}

export default ManageCustomToken
