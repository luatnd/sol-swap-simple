import * as anchor from "@project-serum/anchor";
import {Wallet as SolAdapterWallet} from "@solana/wallet-adapter-react/lib/types/useWallet";
import {notify} from "../../../utils/notifications";
import {IDL as MoveTokenIdl} from "../../../../anchor/types/move_token";
import {AnchorBrowserClient} from "../../../utils/anchor-client-js/AnchorBrowserClient";

export async function createNewToken(
  tokenName: string,
  tokenSymbol: string,
  tokenSupply: number,
  metadataUri: string,
  data: {
    wallet: anchor.Wallet,
    // web3Wallet: SolAdapterWallet,
    connection: anchor.web3.Connection,
  },
) {
  // validate metadata
  try {
    const metadata = await fetch(metadataUri).then((res) => res.json());
    if (!metadata) {
      notify({type: 'error', message: `Cannot fetch metadata from uri: ${metadataUri}`});
      return;
    }
  } catch (e) {
    notify({type: 'error', message: `Cannot fetch metadata from uri: ${metadataUri}`});
    return;
  }

  const {wallet, connection} = data;
  const provider = AnchorBrowserClient.getProvider(connection, wallet);

  const TOKEN_PROGRAM_ID = "CpCRu5ziJbffaFLxxY1gQPV2Lpyq8iBecLweZUH8Rngu"; // TODO: do not hard code in prod
  const program = new anchor.Program(MoveTokenIdl, TOKEN_PROGRAM_ID, provider)
  console.log('{createNewToken} program: ', program);

  const payerPubKey = wallet.publicKey;

  const METAPLEX_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
  const tokenMetadataProgramId = new anchor.web3.PublicKey(METAPLEX_PROGRAM_ID);
  const mintKeypair: anchor.web3.Keypair = anchor.web3.Keypair.generate();
  console.log(`{canCreateNewToken} New random TMA: ${mintKeypair.publicKey}`);


  const [mintAuthorityPda, mintAuthorityPdaBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("mint_authority_"), // must match the program in rust
      mintKeypair.publicKey.toBuffer(),
    ],
    program.programId,
  );
  console.log('{createNewToken} mintAuthorityPda: ', mintAuthorityPda.toBase58());
  const metadataAddress = (anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"), // must match the metaplex program source code
      tokenMetadataProgramId.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    tokenMetadataProgramId
  ))[0];

  const payerAta = await anchor.utils.token.associatedAddress({
    mint: mintKeypair.publicKey,
    owner: payerPubKey,
  });
  console.log(`{testCreateNewToken} payerAta: ${payerAta}`);


  const tx = await program.methods.createToken(
    tokenName,
    tokenSymbol,
    metadataUri,
    new anchor.BN(tokenSupply * 1e9),
    mintAuthorityPdaBump
  )
    .accounts({
      metadataAccount: metadataAddress,
      mintAccount: mintKeypair.publicKey,
      mintAuthority: mintAuthorityPda,
      payer: payerPubKey,
      payerAta: payerAta,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      tokenMetadataProgram: tokenMetadataProgramId,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .signers([mintKeypair, provider.wallet as any]) // add more signer later with `tx.feePayer=...`
    .transaction();

  tx.feePayer = wallet.publicKey; // this is the point

  // const res = await AnchorBrowserClient.confirmTransaction(tx, wallet, connection);

  const latestBlockHash = await connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockHash.blockhash
  tx.sign(mintKeypair); // sign mintKeyPair, => just work, require setup recentBlockhash first
  // tx.sign(provider.wallet as any, mintKeypair); // not work
  const signedTx = await wallet.signTransaction(tx)
  const rawTx = signedTx.serialize();
  const signature = await connection.sendRawTransaction(rawTx)
  console.log('{confirmTransaction} signature: ', signature);

  const res = await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: signature,
  }, 'confirmed');
  console.log('{confirmTransaction} res: ', res);

  if (res?.value?.err) {
    notify({type: 'error', message: `ERROR: ${res.value.err}`});
    return;
  }

  return signature;
}
