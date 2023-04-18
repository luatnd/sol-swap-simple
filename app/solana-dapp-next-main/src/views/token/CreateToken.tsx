import {useConnection, useAnchorWallet, useWallet, Wallet as SolAdapterWallet} from "@solana/wallet-adapter-react";
import {useCallback, useState} from "react";
import * as anchor from "@project-serum/anchor";
import { observer } from "mobx-react-lite"
import {notify} from "../../utils/notifications";

import {getExplorerUrlOfTx} from "../../utils/anchor-client-js/utils";
import TokenStore from "./service/TokenStore";
import {createNewToken} from "./service/TokenService";

type Props = {}
export default observer(function CreateToken(props: Props) {
  const wallet = useAnchorWallet();
  const walletWeb3 = useWallet();
  const { connection } = useConnection();

  // form data
  const {
    tokenName,
    tokenSymbol,
    tokenSupply,
    metadataUri,
  } = TokenStore;

  const [tx, setTx] = useState<string>("");

  const submitForm = useCallback(() => {
    if (!wallet) {
      notify({type: "error", message: `Plz connect wallet first`});
      return;
    }

    createNewToken(tokenName, tokenSymbol, tokenSupply, metadataUri, {
      anchorWallet: wallet as anchor.Wallet,
      web3Wallet: walletWeb3.wallet,
      connection,
    }).then((tx) => {
      setTx(tx);
      // hide alert box after 20s
      setTimeout(() => {
        setTx("");
      }, 60000)
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
        </div>

        <button
          type="submit"
          className="group w-60 m-2 btn animate-pulse disabled:animate-none bg-gradient-to-r from-[#9945FF] to-[#14F195] hover:from-pink-500 hover:to-yellow-500 ... "
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

      {!!tx && <div className="alert alert-success shadow-lg">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>
            Success, view on explorer:<br/>
            <a href={getExplorerUrlOfTx(tx, "devnet")} target="_blank" className="break-all">{getExplorerUrlOfTx(tx, "devnet")}</a>
          </span>
        </div>
      </div>}
    </div>
  );
});
