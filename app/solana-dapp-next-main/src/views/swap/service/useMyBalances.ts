import {useEffect, useState} from "react";
import {AnchorBrowserClient} from "../../../utils/anchor-client-js/AnchorBrowserClient";
import {useAnchorWallet, useConnection} from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import {NATIVE_MINT, NATIVE_MINT_2022} from "@solana/spl-token"
import {LAMPORTS_PER_SOL} from "@solana/web3.js";
import SwapStore from "./SwapStore";

export default function useMyBalances(tokenMintAddresses: anchor.web3.PublicKey[], refreshBalanceNonce: number) {
  const {connection} = useConnection();
  const wallet = useAnchorWallet();

  // const [balances, setBalances] = useState<number[]>([0, 0]);
  const setBalances = ([base, quote]: number[]) => {
    // @ts-ignore
    SwapStore.setState({
      userBalanceBase: base,
      userBalanceQuote: quote,
    });
  }

  useEffect(() => {
    if (!(wallet && wallet.publicKey)) {
      setBalances(tokenMintAddresses.map(() => 0));
      return;
    }

    // only fetch if LP exist
    if (!SwapStore.lpAddr) {
      return;
    }

    const fetchBalances = tokenMintAddresses.map(async (tokenMintAddress) => new Promise<number>((resolve) => {
      // if (!!tokenMintAddress) {   // => this not work !!!!
      if (!(tokenMintAddress && tokenMintAddress.toBase58())) {
        resolve(0);
        return;
      }

      if (tokenMintAddress.equals(NATIVE_MINT)) {
        AnchorBrowserClient.getSolBalanceOf(connection, wallet.publicKey).then((balance) => {
          resolve(balance / LAMPORTS_PER_SOL)
        }).catch(e => {
          console.log('{useMyBalances} sol e: ', e);
          resolve(0);
        });
      } else {
        AnchorBrowserClient.getSqlTokenBalanceOf(
          connection,
          wallet.publicKey,
          tokenMintAddress,
        ).then((tokenAmount) => {
          resolve(tokenAmount.uiAmount);
        }).catch(e => {
          console.log('{useMyBalances} token e: ', e);
          resolve(0);
        });
      }
    }))
    Promise.all(fetchBalances).then((balances) => setBalances(balances));
  }, [tokenMintAddresses, refreshBalanceNonce, wallet, SwapStore.lpAddr]);

  return [
    SwapStore.userBalanceBase,
    SwapStore.userBalanceQuote,
  ];
}
