import {useAnchorWallet, useConnection, useWallet} from "@solana/wallet-adapter-react";
import TokenStore from "../token/service/TokenStore";
import {useCallback, useEffect, useMemo, useState} from "react";
import {notify} from "../../utils/notifications";
import {AnchorBrowserClient} from "../../utils/anchor-client-js/AnchorBrowserClient";
import {airdropToken, createNewToken} from "../token/service/TokenService";
import * as anchor from "@project-serum/anchor";
import TxSuccessMsg from "../../components/TxSuccessMsg";
import BigNumber from "bignumber.js";
import {fetchPrevMintToken, MyToken, solToken} from "./service/token";
import {checkLpExistMemo, fetchExistLp, initLp} from "./service/SwapService";
import {useRouter} from "next/router";
import {NATIVE_MINT} from "@solana/spl-token";
import {TokenNotExist} from "../token/CreateToken";
import SwapStore from "./service/SwapStore";


type Props = {}
export default function InitSwapForm(props: Props) {
  const router = useRouter();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const myToken = fetchPrevMintToken();
  const RATE_SOL_TO_TOKEN_HARD_CODED = 10;

  const [rate, setRate] = useState<string>(RATE_SOL_TO_TOKEN_HARD_CODED.toString());
  const [tx, setTx] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

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

  const submitForm = useCallback(() => {
    // check supported network
    if (!AnchorBrowserClient.isTestNetOrDevNet(connection)) {
      // throw new Error("Network not supported, plz use testnet or devnet")
      notify({type: "error", message: "Network not supported, plz use testnet or devnet"});
      return;
    }

    setLoading(true);
    initLp(NATIVE_MINT, myToken.address, rate, {
      wallet: wallet as anchor.Wallet,
      connection,
    }).then(({tx, lpPubKey}) => {
      // success
      setTx(tx);
      // hide alert box after 20s
      setTimeout(() => {
        setTx("");
      }, 60000)
    }).catch(e => {
      console.error('{initLp} e: ', e);
      notify({type: "error", message: e.message, txid: tx});
    }).finally(() => {
      setLoading(false);
    })

  }, [myToken.address, rate]);


  // it is required to have a previous token minted
  if (!myToken.address) {
    return <TokenNotExist myToken={myToken} />
  }

  // LP SOL-PrevMintedMyToken exist then
  if (existLpAddress) {
    return <LpExist myToken={myToken} lpAddress={existLpAddress} />
  }

  return (
    <div className="InitSwapForm">
      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} >
        <div className="content-center">
          <div className="mt-6 mb-6 text-left leading-10">

            <div className="flex flex-row items-center">
              <div className="basis-10/12">
                <p>You're going to create a Liquidity Pool for the pair of (Base, Quote)</p>

                <div>
                  <span className="label-text">with <b>Base</b> token</span>
                  <select className="select w-48 max-w-xs ml-6" disabled value="SOL">
                    <option value="SOL">SOL</option>
                  </select>
                  <label className="label justify-end">
                    <span className="label-text-alt text-gray-500">{NATIVE_MINT.toString()}</span>
                  </label>
                </div>

                <div className="mt-4">
                  <span className="label-text">and <b>Quote</b> token</span>
                  <select className="select w-48 max-w-xs ml-6" disabled value="0">
                    <option value="0">{myToken.symbol}</option>
                  </select>
                  <label className="label justify-end">
                    <span className="label-text-alt text-gray-500">{myToken.address.toString()}</span>
                  </label>
                </div>

                <div className="mt-4">
                  <span className="label-text">With a <b>fixed price rate</b></span>
                  <input
                    type="number" placeholder="1" required disabled
                    name="amountFrom" value={rate} onChange={(e) => setRate(e.target.value)}
                    className="input input-bordered max-w-xs ml-6 w-36"
                  />
                  <label className="input-group justify-end mt-4">
                    <span>1 SOL</span>
                    <span><span className="pr-4">=</span> {rate} {myToken.symbol}</span>
                  </label>
                </div>

              </div>
            </div>

          </div>
        </div>

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
            Init Liquidity Pool
          </div>
        </button>
      </form>
    </div>
  );
};


export function LpNotExist(props: { myToken: MyToken }) {
  const router = useRouter();
  const { myToken } = props;

  return (
    <div className="InitSwapForm">
      <div className="alert alert-warning shadow-lg my-6">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>&nbsp;A LP for <b>SOL/{myToken.symbol}</b> does not exist</span>
        </div>
      </div>
      <button
        className={`group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
        onClick={() => router.push("/swap?tab=init")}
      >
        Create new LP
      </button>
    </div>
  );
}

export function LpExist(props: { myToken: MyToken, lpAddress: string }) {
  const router = useRouter();
  const { myToken, lpAddress } = props;

  return (
    <div className="InitSwapForm">
      <div className="alert alert-warning break-all shadow-lg my-6">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span>&nbsp;A LP for <b>SOL/{myToken.symbol}</b> exist at {lpAddress}</span>
        </div>
      </div>
      <button
        className={`group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
        onClick={() => {
          confirm("pool(SOL,MintedToken) can be init if you mint a new token, continue?")
          && router.push("/");
        }}
      >
        Create new LP
      </button>
      <button
        className={`group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
        onClick={() => router.push("/swap?tab=add")}
      >
        Add Liquidity
      </button>
    </div>
  );
}
