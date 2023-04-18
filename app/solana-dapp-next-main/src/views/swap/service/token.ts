import {NATIVE_MINT, NATIVE_MINT_2022} from "@solana/spl-token"
import * as anchor from "@project-serum/anchor";

export type MyToken = {
  symbol: string,
  address: undefined | anchor.web3.PublicKey,
  name?: string,
  image?: string,
}

export const solToken: MyToken = {
  symbol: 'SOL',
  address: NATIVE_MINT,
}

// TODO: Read from local storage take I/O and will reduce performance foreach re-rendering, need improvement in production
// Plz avoid to call this on component update
export function fetchPrevMintToken(): MyToken {
  const prevMintToken = localStorage.getItem('lastMintedToken');
  if (prevMintToken) {
    const d = JSON.parse(prevMintToken) as MyToken;
    d.address = new anchor.web3.PublicKey(d.address);
    return d
  }

  return {
    symbol: 'N/A',
    address: undefined,
  };
}
