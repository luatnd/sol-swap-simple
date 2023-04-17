import * as anchor from "@project-serum/anchor";
import {createMint} from "@solana/spl-token";
import {getCurrentProvider, getProviderWallet} from "./test-env";
import fs from "fs";

export async function airdropSOL(recipientPubKey: anchor.web3.PublicKey, amountOfSol: number) {
  // @deprecated
  // await provider.connection.confirmTransaction(
  //   await provider.connection.requestAirdrop(recipientPubKey, 1 * anchor.web3.LAMPORTS_PER_SOL)
  // );
  const provider = getCurrentProvider();
  const airdropSignature = await provider.connection.requestAirdrop(recipientPubKey, amountOfSol * anchor.web3.LAMPORTS_PER_SOL);
  const latestBlockHash = await provider.connection.getLatestBlockhash();
  return provider.connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: airdropSignature,
  });
}

export async function airDropSolIfBalanceLowerThan(amountInSol: number, recipientPubKey: anchor.web3.PublicKey) {
  const provider = getCurrentProvider();
  const balance = await provider.connection.getBalance(recipientPubKey);
  if (balance < amountInSol * anchor.web3.LAMPORTS_PER_SOL) {
    console.log('{airDropSolIfBalanceLowerThan} ' + `${recipientPubKey} has small balance ${balance / anchor.web3.LAMPORTS_PER_SOL} SOL, airdrop ${amountInSol} SOL`);
    await airdropSOL(recipientPubKey, amountInSol);
  }
}

export async function getSqlTokenBalanceOf(
  owner: anchor.web3.PublicKey,
  tokenMintAddress: anchor.web3.PublicKey
): Promise<anchor.web3.TokenAmount> {
  const provider = getCurrentProvider();
  // ata stands for Associated Token Address
  const ata = await anchor.utils.token.associatedAddress({
    mint: tokenMintAddress,
    owner: owner,
  });
  const res = await provider.connection.getTokenAccountBalance(ata);
  return res.value;
}
