import {useEffect, useState} from "react";
import {AnchorBrowserClient} from "../../../utils/anchor-client-js/AnchorBrowserClient";
import {useAnchorWallet, useConnection} from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import {NATIVE_MINT, NATIVE_MINT_2022} from "@solana/spl-token"
import {LAMPORTS_PER_SOL} from "@solana/web3.js";

export default function useMyBalances(tokenMintAddresses: anchor.web3.PublicKey[], refreshBalanceNonce: number) {
  const [balances, setBalances] = useState<number[]>([]);
  const {connection} = useConnection();
  const wallet = useAnchorWallet();

  useEffect(() => {
    if (!(wallet && wallet.publicKey)) {
      setBalances(tokenMintAddresses.map(() => 0));
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
        });
      } else {
        AnchorBrowserClient.getSqlTokenBalanceOf(
          connection,
          wallet.publicKey,
          tokenMintAddress,
        ).then((tokenAmount) => {
          resolve(tokenAmount.uiAmount);
        });
      }
    }))
    Promise.all(fetchBalances).then((balances) => setBalances(balances));
  }, [tokenMintAddresses, refreshBalanceNonce, setBalances, wallet]);

  return balances;
}
