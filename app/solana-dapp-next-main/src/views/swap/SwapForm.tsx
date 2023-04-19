import {useAnchorWallet, useConnection, useWallet} from "@solana/wallet-adapter-react";
import TokenStore from "../token/service/TokenStore";
import {useCallback, useEffect, useMemo, useState} from "react";
import {notify} from "../../utils/notifications";
import {AnchorBrowserClient} from "../../utils/anchor-client-js/AnchorBrowserClient";
import {airdropToken, createNewToken} from "../token/service/TokenService";
import * as anchor from "@project-serum/anchor";
import TxSuccessMsg from "../../components/TxSuccessMsg";
import BigNumber from "bignumber.js";
import {fetchPrevMintToken, solToken} from "./service/token";
import useMyBalances from "./service/useMyBalances";
import {useRouter} from "next/router";
import {swap, checkLpExistMemo, getLpBalances} from "./service/SwapService";
import {LpNotExist} from "./InitSwapForm";
import SwapStore from "./service/SwapStore";
import {observer} from "mobx-react-lite";


type Props = {}
export default observer(function SwapForm(props: Props) {
  const router = useRouter();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const RATE_SOL_TO_TOKEN_HARD_CODED = 10;
  const myToken = fetchPrevMintToken();
  const tokenAddresses = useMemo(() => {
    return [solToken.address, myToken.address];
  }, [solToken.address.toString(), myToken.address?.toString()])
  // change this to re-fetch all the balances
  const [refreshBalanceNonce, setRefreshBalanceNonce] = useState(0);
  const [mySolBalance, myTokenBalance] = useMyBalances(tokenAddresses, refreshBalanceNonce);

  // form data
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [amountTo, setAmountTo] = useState<string>("");
  const [symbolFrom, setSymbolFrom] = useState<string>(solToken.symbol);
  const [symbolTo, setSymbolTo] = useState<string>(myToken.symbol);
  const [rate, setRate] = useState<string>(RATE_SOL_TO_TOKEN_HARD_CODED.toString());


  // computed
  useEffect(() => {
    // don't parse float here, because we need to keep the precision
    if (amountFrom.charAt(amountFrom.length - 1) === '.') {
      return;
    }

    const a = new BigNumber(!!amountFrom ? amountFrom : 0);
    const rateA2B = symbolFrom === solToken.symbol
      ? RATE_SOL_TO_TOKEN_HARD_CODED
      : 1 / RATE_SOL_TO_TOKEN_HARD_CODED
    ;
    setRate(rateA2B.toString());
    setAmountTo(a.multipliedBy(rateA2B).toString());
  }, [amountFrom, symbolFrom]);

  // computed
  useEffect(() => {
    if (symbolFrom === solToken.symbol) {
      setSymbolTo(myToken.symbol);
    } else {
      setSymbolTo(solToken.symbol);
    }
  }, [symbolFrom, setSymbolTo]);

  const [existLpAddress, setExistLpAddress] = [
    SwapStore.lpAddr,
    (v) => SwapStore.set("lpAddr", v),
  ];
  useEffect(() => {
    checkLpExistMemo(myToken.address, {
      wallet: wallet as anchor.Wallet,
      connection
    }).then(addr => {
      setExistLpAddress(addr);
    })
  }, [])

  const lpBalance = SwapStore.lpBalance;
  useEffect(() => {
    // only fetch if LP exist
    if (!SwapStore.lpAddr) {
      return;
    }
    getLpBalances(myToken.address, {
      wallet: wallet as anchor.Wallet,
      connection
    }).then(res => {
      // @ts-ignore
      SwapStore.setState({
        lpBalanceBase: res.base,
        lpBalanceQuote: res.quote,
      });
    })
  }, [existLpAddress])


  const swapSymbol = useCallback(() => {
    // new version of react: re-render only once
    setSymbolFrom(symbolTo);
    setAmountFrom(amountTo);
  }, [setSymbolFrom, setAmountFrom, symbolTo, amountTo]);




  const [tx, setTx] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const submitForm = useCallback(() => {
    // check supported network
    if (!AnchorBrowserClient.isTestNetOrDevNet(connection)) {
      // throw new Error("Network not supported, plz use testnet or devnet")
      notify({type: "error", message: "Network not supported, plz use testnet or devnet"});
      return;
    }

    console.log('{amountFrom} amountFrom: ', amountFrom);

    const b2q = symbolFrom === solToken.symbol;
    setLoading(true);
    swap(
      (b2q ? solToken : myToken).address,
      (b2q ? myToken : solToken).address,
      amountFrom,
      {
        wallet: wallet as anchor.Wallet,
        connection,
      }
    ).then(({tx, lpBalances}) => {
      // success
      setTx(tx);
      // hide alert box after 20s
      setTimeout(() => {
        setTx("");
      }, 60000)

      // update balances
      // @ts-ignore
      SwapStore.setState({
        lpBalanceBase: lpBalances.base,
        lpBalanceQuote: lpBalances.quote,
      });
      setRefreshBalanceNonce(refreshBalanceNonce + 1);
    }).catch(e => {
      console.error('{swap} e: ', e);
      notify({type: "error", message: e.message, txid: tx});
    }).finally(() => {
      setLoading(false);
    })
  }, [
    amountFrom, symbolFrom,
    wallet, connection,
    myToken.address,
    refreshBalanceNonce,
  ]);


  if (!myToken.address) {
    return (
      <div className="InitSwapForm">
        <p>This demo require a mint token, please mint it first on the Token page</p>
        <button
          className={`${loading ? 'loading animate-pulse' : ''} group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
          onClick={() => router.push("/")}
        >
          Create a token
        </button>
      </div>
    );
  }

  // LP SOL-PrevMintedMyToken exist then
  if (!existLpAddress) {
    return <LpNotExist myToken={myToken} />
  }

  return (
    <div className="SwapForm">
      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} >
        <div className="content-center">
          <div className="mt-6 mb-6 text-left leading-10">

            <div className="flex flex-row items-center">
              <div className="basis-10/12">

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">You're going to swap</span>
                  </label>
                  <label className="input-group">
                    <input
                      type="number" placeholder="0" required
                      name="amountFrom" value={amountFrom} onChange={(e) => setAmountFrom(e.target.value)}
                      className="input input-bordered"
                    />
                    <span>{symbolFrom}</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">To get</span>
                  </label>
                  <label className="input-group">
                    <input
                      type="number" placeholder="" required
                      name="amountFrom" value={amountTo} disabled
                      className="input input-bordered"
                    />
                    <span>{symbolTo}</span>
                  </label>
                </div>

              </div>
              <div className="basis-2/12">
                <button type="button" onClick={swapSymbol} className="btn btn-circle btn-outline" style={{
                  width: 60,
                  height: 60,
                  marginTop: 40,
                  marginLeft: 20,
                  padding: 10,
                }}>
                  <svg style={{
                    height: '100%',
                  }}>
                    <use href="/swap-vertical-svgrepo-com.svg#my"></use>
                  </svg>
                </button>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">With price</span>
              </label>
              <label className="input-group">
                <span>1 {symbolFrom}</span>
                <span>= {rate} {symbolTo}</span>
              </label>
            </div>

            <div className="form-control mt-6">
              <label className="label">
                <span className="label-text">Your balance:</span>
              </label>
              <label className="input">
                <p><b>{mySolBalance}</b> {solToken.symbol}</p>
                <p><b>{myTokenBalance}</b> {myToken.symbol}</p>
              </label>
            </div>

            <div className="form-control mt-6">
              <label className="label">
                <span className="label-text">LP balance:</span>
              </label>
              <label className="input">
                <p><b>{lpBalance.base}</b> {solToken.symbol}</p>
                <p><b>{lpBalance.quote}</b> {myToken.symbol}</p>
              </label>
            </div>

          </div>
        </div>

        <p className="text-gray-500">NOTE: All client-side validation was skipped, plz see error in dev console</p>

        <TxSuccessMsg tx={tx}/>

        {!myToken.address && (
          <div className="alert alert-warning shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>&nbsp;No minted token found. Please mint your token first so you can swap it here.</span>
            </div>
          </div>
        )}
        <button
          type="submit"
          className={`${loading ? 'loading animate-pulse' : ''} group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
          disabled={!(wallet && wallet.publicKey) || !myToken.address}
        >
          <div className="hidden group-disabled:block ">
            {!(wallet && wallet.publicKey)
              ? 'Wallet not connected'
              : 'Cannot swap'
            }
          </div>
          <div className="block group-disabled:hidden">
            Swap
          </div>
        </button>
      </form>
    </div>
  );
});
