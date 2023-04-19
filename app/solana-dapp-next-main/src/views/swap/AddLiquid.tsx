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
import {addLiquidity, checkLpExistMemo, getLpBalances, initLp} from "./service/SwapService";
import {NATIVE_MINT} from "@solana/spl-token";
import {LpNotExist} from "./InitSwapForm";
import SwapStore from "./service/SwapStore";
import {observer} from "mobx-react-lite";


type Props = {}
export default observer(function AddLiquid(props: Props) {
  const router = useRouter();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

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
    if (!existLpAddress) {
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


  const [tx, setTx] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const submitForm = useCallback(() => {
    // check supported network
    if (!AnchorBrowserClient.isTestNetOrDevNet(connection)) {
      // throw new Error("Network not supported, plz use testnet or devnet")
      notify({type: "error", message: "Network not supported, plz use testnet or devnet"});
      return;
    }

    setLoading(true);
    addLiquidity(
      myToken.address,
      amountFrom,
      amountTo,
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
      console.error('{initLp} e: ', e);
      notify({type: "error", message: e.message, txid: tx});
    }).finally(() => {
      setLoading(false);
    })
  }, [amountFrom, amountTo, myToken.address, wallet, connection, refreshBalanceNonce ]);


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
                    <span className="label-text">Base amount ({">"}=0)</span>
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
                    <span className="label-text">Quote amount ({">"}=0)</span>
                  </label>
                  <label className="input-group">
                    <input
                      type="number" placeholder="0" required
                      name="amountFrom" value={amountTo} onChange={(e) => setAmountTo(e.target.value)}
                      className="input input-bordered"
                    />
                    <span>{symbolTo}</span>
                  </label>
                </div>
              </div>
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
            Add to liquidity
          </div>
        </button>
      </form>
    </div>
  );
});
