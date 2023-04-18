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

    // support devnet only
    if (!AnchorBrowserClient.isDevNet(connection)) {
      // throw new Error("devnet is required")
      notify({type: "error", message: "Devnet is required"});
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
