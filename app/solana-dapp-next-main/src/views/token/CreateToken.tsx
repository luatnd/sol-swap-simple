import {useConnection, useAnchorWallet, useWallet, Wallet as SolAdapterWallet} from "@solana/wallet-adapter-react";
import {useCallback, useState} from "react";
import * as anchor from "@project-serum/anchor";
import { observer } from "mobx-react-lite"
import {notify} from "../../utils/notifications";

import {getExplorerUrlOfTx} from "../../utils/anchor-client-js/utils";
import TokenStore from "./service/TokenStore";
import {createNewToken} from "./service/TokenService";
import {AnchorBrowserClient} from "../../utils/anchor-client-js/AnchorBrowserClient";
import TxSuccessMsg from "../../components/TxSuccessMsg";
import {MyToken} from "../swap/service/token";
import {useRouter} from "next/router";

type Props = {}
export default observer(function CreateToken(props: Props) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  // form data
  const {
    tokenName,
    tokenSymbol,
    tokenSupply,
    metadataUri,
  } = TokenStore;

  const [tx, setTx] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const submitForm = useCallback(() => {
    // need wallet connected
    if (!wallet) {
      notify({type: "error", message: `Plz connect wallet first`});
      return;
    }

    // check supported network
    if (!AnchorBrowserClient.isTestNetOrDevNet(connection)) {
      // throw new Error("Network not supported, plz use testnet or devnet")
      notify({type: "error", message: "Network not supported, plz use testnet or devnet"});
      return;
    }

    setLoading(true);
    createNewToken(tokenName, tokenSymbol, tokenSupply, metadataUri, {
      wallet: wallet as anchor.Wallet,
      connection,
    }).then(({tx, metadata, tma}) => {
      // success
      setTx(tx);
      // hide alert box after 20s
      setTimeout(() => {
        setTx("");
      }, 60000)

      // save to local-storage
      localStorage.setItem("lastMintedToken", JSON.stringify({
        name: tokenName,
        symbol: tokenSymbol,
        image: metadata?.image ?? undefined,
        address: tma,
      }));
    }).catch(e => {
      console.error('{createNewToken} e: ', e);
      notify({type: "error", message: e.message, txid: tx});
    }).finally(() => {
      setLoading(false);
    })
  }, [tokenName, tokenSymbol, tokenSupply, metadataUri, setTx, wallet, connection]);

  return (
    <div className="CreateTokenForm">
      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} >
        <div className="mt-6 mb-6 leading-10">
          You're going to create a new token on <b>devnet</b><br/>
          <b>name</b> <input type="text" placeholder="Luat Galaxy" value={tokenName} onChange={(e) => TokenStore.set("tokenName", e.target.value)} required className="input input-bordered mr-2 w-28" />
          and <b>symbol</b> <input type="text" placeholder="LUAT" value={tokenSymbol} onChange={(e) => TokenStore.set("tokenSymbol", e.target.value)} required className="input input-bordered mr-2 w-20" /><br/>
          <span className="mr-44">with 9 <b>decimals</b></span><br/>
          and <b>metadata uri</b> <input type="text" placeholder="https://" value={metadataUri} onChange={(e) => TokenStore.set("metadataUri", e.target.value)} required className="input input-bordered mr-2 w-40" /><br/>
          <b>initial supply</b> will be <input type="number" placeholder="1000" value={tokenSupply} onChange={(e) => TokenStore.set("tokenSupply", e.target.value)} required className="input input-bordered mr-2 w-36" /><br/>

          <br/>
          <p className="text-left">
            <small>
              - NOTE: I skipped all the client side input validation<br/>
              - NOTE: Ensure name & symbol in metadata match your input
            </small>
          </p>
        </div>

        <TxSuccessMsg tx={tx}/>

        <button
          type="submit"
          className={`${loading ? 'loading animate-pulse' : ''} group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
          disabled={!(wallet && wallet.publicKey)}
        >
          <div className="hidden group-disabled:block ">
            Wallet not connected
          </div>
          <div className="block group-disabled:hidden">
            Create
          </div>
        </button>
      </form>
    </div>
  );
});


export function TokenNotExist(props: { myToken: MyToken }) {
  const router = useRouter();
  const { myToken } = props;

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
        className={`group w-60 m-2 btn disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... `}
        onClick={() => router.push("/")}
      >
        Create a token
      </button>
    </div>
  );
}
