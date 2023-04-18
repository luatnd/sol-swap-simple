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
import {foo} from "./service/SwapService";
import {useRouter} from "next/router";
import {NATIVE_MINT} from "@solana/spl-token";


type Props = {}
export default function InitSwapForm(props: Props) {
  const router = useRouter();
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const myToken = fetchPrevMintToken();

  // form data
  const [rate, setRate] = useState<string>("1");

  useEffect(() => {
    foo("test", {
      wallet: wallet as anchor.Wallet,
      connection,
    })
  }, []);


  const [tx, setTx] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const submitForm = useCallback(() => {

  }, []);


  // it is required to have a previous token minted
  if (!myToken.address) {
    return (
      <div className="InitSwapForm">
        {!myToken.address && (
          <div className="alert alert-warning shadow-lg">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>&nbsp;This demo require a mint token, please mint it first on the Token page.</span>
            </div>
          </div>
        )}
        <button
          className={`${loading ? 'loading animate-pulse' : ''} group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
          onClick={() => router.push("/")}
        >
          Create a token
        </button>
      </div>
    );
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
                  <select className="select w-48 max-w-xs ml-6" disabled>
                    <option selected>SOL</option>
                  </select>
                  <label className="label justify-end">
                    <span className="label-text-alt text-gray-500">{NATIVE_MINT.toString()}</span>
                  </label>
                </div>

                <div className="mt-4">
                  <span className="label-text">and <b>Quote</b> token</span>
                  <select className="select w-48 max-w-xs ml-6" disabled>
                    <option selected>{myToken.symbol}</option>
                  </select>
                  <label className="label justify-end">
                    <span className="label-text-alt text-gray-500">{myToken.address.toString()}</span>
                  </label>
                </div>

                <div className="mt-4">
                  <span className="label-text">With a <b>fixed price rate</b></span>
                  <input
                    type="number" placeholder="1" required
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
