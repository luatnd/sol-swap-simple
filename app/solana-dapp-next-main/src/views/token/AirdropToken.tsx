import {useAnchorWallet, useConnection, useWallet} from "@solana/wallet-adapter-react";
import TokenStore from "./service/TokenStore";
import {useCallback, useEffect, useState} from "react";
import {notify} from "../../utils/notifications";
import {AnchorBrowserClient} from "../../utils/anchor-client-js/AnchorBrowserClient";
import {airdropToken, createNewToken} from "./service/TokenService";
import * as anchor from "@project-serum/anchor";
import TxSuccessMsg from "../../components/TxSuccessMsg";
import {fetchPrevMintToken} from "../swap/service/token";

type Props = {}
export default function AirdropToken(props: Props) {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  const myToken = fetchPrevMintToken();

  // form data
  const [tokenDisplay, setTokenDisplay] = useState({name: "", symbol: ""});
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [tma, setTma] = useState<string>(myToken.address?.toString() ?? "");
  const [tx, setTx] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // useEffect(() => {
  //   // get token name and symbol from token mint address
  //   if (tma) {
  //     AnchorBrowserClient.getTokenInfo(tma, connection).then((res) => {
  //       setTokenDisplay({
  //         name: "TODO",
  //         symbol: "TODO",
  //       });
  //     })
  //   }
  // }, [tma])
  useEffect(() => {
    if (tma === myToken.address?.toString()) {
      setTokenDisplay({name: myToken.name, symbol: myToken.symbol});
    } else {
      setTokenDisplay({name: "", symbol: ""});
    }
  }, [tma]);


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
    airdropToken(tma, parseFloat(amount), recipient, {
      wallet: wallet as anchor.Wallet,
      connection,
    }).then((tx) => {
      setTx(tx);
      // hide alert box after 20s
      setTimeout(() => {
        setTx("");
      }, 60000)
    }).catch(e => {
      console.error('{createNewToken} e: ', e);
      notify({type: "error", message: e.message});
    }).finally(() => {
      setLoading(false);
    })
  }, [tma, amount, recipient, wallet, connection]);


  return (
    <div className="CreateTokenForm">
      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} >
        <div className="content-center">
          <div className="mt-6 mb-6 text-left leading-10">
            1. What is <b>Token Mint Address</b> of the token you wanna airdrop?<br/>
            <input type="text" placeholder="" name="tma" value={tma} onChange={(e) => setTma(e.target.value)} required className="input input-bordered mr-2 w-full" /> <br/>
            <small className="text-gray-400">Warning: Only tokens minted with this app were supported!</small>
            <br/>

            2. You're going to airdrop (mint, not transfer)<br/>
            <input type="number" placeholder="1000" name="amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="input input-bordered mr-2 w-28" /> <b>{!tokenDisplay.symbol ? 'tokens' : `${tokenDisplay.symbol} (${tokenDisplay.name})`}</b><br/>
            to the <b>recipient wallet</b> <input type="text" placeholder="" name="rec" value={recipient} onChange={(e) => setRecipient(e.target.value)} required className="input input-bordered mr-2 w-48" /><br/>

            <ul className="leading-6">
              <li><small>Anyone can airdrop the token minted with this app to any wallet</small></li>
              <li><small>You will be the tx fee payer.</small></li>
            </ul>

            <p className="text-left">
              <small>
                NOTE: I skipped all the client side input validation<br/>
              </small>
            </p>
          </div>
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
            Airdrop
          </div>
        </button>
      </form>
    </div>
  );
};
